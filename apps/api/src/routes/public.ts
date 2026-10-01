import { Hono } from "hono";
import { prisma, type Prisma } from "@pod/db";
import {
  B2B_BUDGETS,
  AUDIENCE_SLUG,
  AUDIENCES,
  HELP_CATEGORIES,
  leadCreateSchema,
  currentSeasonRule,
  parseTiers,
  rankColors,
  searchTokens,
  type Audience,
} from "@pod/shared";
import { getLanding } from "../lib/settings";
import { clientIp, notFound, pageParams } from "../lib/http";
import { rateLimit } from "../lib/rate-limit";
import { getPage, listPages } from "../lib/pages";
import { notifyLead } from "../lib/notify";
import { resolveSearch, phraseWhere } from "../lib/search";

export const publicRoutes = new Hono();

const productSelect = {
  id: true,
  name: true,
  slug: true,
  audience: true,
  basePrice: true,
  compareAtPrice: true,
  priceFrom: true,
  salePrice: true,
  saleEndsAt: true,
  newUntil: true,
  productionDays: true,
  minQty: true,
  images: true,
  isBestSeller: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;

const audienceFromSlug = (slug?: string): Audience | undefined =>
  AUDIENCES.find((a) => AUDIENCE_SLUG[a] === slug);

/** Toàn bộ dữ liệu landing trong 1 request (SSR/ISR) */
publicRoutes.get("/home", async (c) => {
  const settings = await getLanding();
  const [bestSellers, categories, testimonials, b2bProducts, catalogRaw] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isBestSeller: true },
      orderBy: { sortOrder: "asc" },
      take: 12,
      select: productSelect,
    }),
    prisma.category.findMany({
      where: { isActive: true, showOnHome: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        products: {
          where: { isActive: true, isHotSale: true },
          orderBy: { sortOrder: "asc" },
          take: 8,
          select: productSelect,
        },
      },
    }),
    prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    settings.b2b.enabled && settings.b2b.categorySlug
      ? prisma.product.findMany({
          where: { isActive: true, category: { slug: settings.b2b.categorySlug } },
          orderBy: { sortOrder: "asc" },
          take: 6,
          select: productSelect,
        })
      : Promise.resolve([]),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        _count: { select: { products: { where: { isActive: true } } } },
        products: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 1, select: { images: true } },
      },
    }),
  ]);
  const catalog = catalogRaw
    .filter((x) => x._count.products > 0)
    .map((x) => ({ id: x.id, name: x.name, slug: x.slug, count: x._count.products, image: x.imageUrl || x.products[0]?.images[0] || "" }));
  const [showcase, extras] = await Promise.all([showcaseData(settings, catalog), homeExtras(settings)]);
  return c.json({ settings, bestSellers, categories: categories.filter((x) => x.products.length), testimonials, b2bProducts, catalog, ...showcase, ...extras });
});

/** Khối theo mùa, shop the look, dòng basic – 3 truy vấn chạy song song */
async function homeExtras(settings: Awaited<ReturnType<typeof getLanding>>) {
  const rule = settings.seasonal.enabled ? currentSeasonRule(settings.seasonal.rules) : null;
  const lookSlugs = settings.lookbook.enabled ? [...new Set(settings.lookbook.hotspots.map((h) => h.productSlug).filter(Boolean))] : [];
  const [seasonRows, lookRows, everydayRows] = await Promise.all([
    rule && (rule.categorySlugs.length || rule.productSlugs.length)
      ? prisma.product.findMany({
          where: { isActive: true, category: { isActive: true }, OR: [{ slug: { in: rule.productSlugs } }, { category: { slug: { in: rule.categorySlugs } } }] },
          orderBy: [{ isBestSeller: "desc" }, { sortOrder: "asc" }],
          take: 24,
          select: { ...productSelect, slug: true },
        })
      : Promise.resolve([]),
    lookSlugs.length ? prisma.product.findMany({ where: { isActive: true, slug: { in: lookSlugs } }, select: productSelect }) : Promise.resolve([]),
    settings.everyday.enabled && settings.everyday.categorySlug
      ? prisma.product.findMany({ where: { isActive: true, category: { slug: settings.everyday.categorySlug, isActive: true } }, orderBy: { sortOrder: "asc" }, take: 8, select: productSelect })
      : Promise.resolve([]),
  ]);
  // sản phẩm chọn tay (productSlugs) đứng trước, theo đúng thứ tự khai báo
  const rank = (slug: string) => {
    const i = rule?.productSlugs.indexOf(slug) ?? -1;
    return i < 0 ? 1000 : i;
  };
  const seasonal = rule && seasonRows.length ? { eyebrow: rule.eyebrow, title: rule.title, href: rule.href, items: [...seasonRows].sort((a, b) => rank(a.slug) - rank(b.slug)).slice(0, 8) } : null;
  return { seasonal, lookbookProducts: lookRows, everyday: everydayRows };
}

/**
 * Khối "Dòng sản phẩm": danh mục nào thật sự có hàng (để link không 404) + dải màu thật theo danh mục.
 * 1 truy vấn cho mọi ô: mỗi (sản phẩm, màu) 1 dòng -> gom & xếp hạng ở rankColors.
 */
async function showcaseData(settings: Awaited<ReturnType<typeof getLanding>>, catalog: { slug: string; count: number }[]) {
  const sc = settings.showcase;
  if (!sc.enabled || !sc.tiles.length) return { showcaseCounts: {}, showcaseColors: {} };
  const slugs = [...new Set(sc.tiles.map((t) => t.categorySlug).filter(Boolean))];
  const showcaseCounts = Object.fromEntries(catalog.filter((x) => slugs.includes(x.slug)).map((x) => [x.slug, x.count]));
  if (!sc.autoColors || !slugs.length) return { showcaseCounts, showcaseColors: {} };
  const rows = await prisma.productVariant.findMany({
    where: { isActive: true, color: { not: "" }, colorHex: { not: "" }, product: { isActive: true, category: { isActive: true, slug: { in: slugs } } } },
    distinct: ["productId", "color"],
    orderBy: [{ product: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: { productId: true, color: true, colorHex: true, product: { select: { category: { select: { slug: true } } } } },
    take: 5000,
  });
  const bySlug = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = r.product.category.slug;
    const list = bySlug.get(k);
    if (list) list.push(r);
    else bySlug.set(k, [r]);
  }
  return { showcaseCounts, showcaseColors: Object.fromEntries([...bySlug].map(([k, v]) => [k, rankColors(v, 10)])) };
}

publicRoutes.get("/settings", async (c) => c.json(await getLanding()));

/** Trang nội dung: chính sách, hướng dẫn... */
publicRoutes.get("/pages", async (c) => {
  const pages = await listPages();
  return c.json(pages.map(({ slug, title, showInFooter, sortOrder }) => ({ slug, title, showInFooter, sortOrder })));
});

publicRoutes.get("/pages/:slug", async (c) => {
  const page = await getPage(c.req.param("slug"));
  if (!page) throw notFound("Không tìm thấy trang");
  return c.json(page);
});

publicRoutes.get("/categories", async (c) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, description: true, imageUrl: true },
  });
  return c.json(categories);
});

/** GET /products?category=ao-thun&doi-tuong=nam&q=hoodie&page=1 */
publicRoutes.get("/products", async (c) => {
  const { page, pageSize, skip, take } = pageParams(c, 24);
  const where = await listingWhere(c.req.query());
  const sort = c.req.query("sort");
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "price-asc"
      ? [{ sortPrice: { sort: "asc", nulls: "last" } }, { sortOrder: "asc" }, { id: "asc" }]
      : sort === "price-desc"
        ? [{ sortPrice: { sort: "desc", nulls: "last" } }, { sortOrder: "asc" }, { id: "asc" }]
        : sort === "newest"
          ? [{ createdAt: "desc" }, { id: "asc" }]
          : [{ sortOrder: "asc" }, { id: "asc" }];
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip, take, select: productSelect }),
    prisma.product.count({ where }),
  ]);
  return c.json({ items, total, page, pageSize });
});

/** Bộ sưu tập: moi (hàng mới) · sale (đang khuyến mãi) · ban-chay */
function collectionWhere(key?: string): Prisma.ProductWhereInput {
  const now = new Date();
  if (key === "moi") return { newUntil: { gt: now } };
  if (key === "ban-chay") return { isBestSeller: true };
  if (key === "sale")
    return {
      OR: [
        { salePrice: { gt: 0 }, OR: [{ saleEndsAt: null }, { saleEndsAt: { gt: now } }] },
        { compareAtPrice: { gt: 0 }, basePrice: { gt: 0 } },
      ],
    };
  return {};
}

/** Điều kiện chung cho danh sách + bộ lọc: q (không dấu), category, sub, doi-tuong, gia=co|bao-gia, thiet-ke=1 */
async function listingWhere(query: Record<string, string>, omit: "sub" | "category" | null = null): Promise<Prisma.ProductWhereInput> {
  const audience = audienceFromSlug(query["doi-tuong"]);
  return {
    isActive: true,
    category: { isActive: true, ...(query.category && omit !== "category" ? { slug: query.category } : {}) },
    ...(query.sub && omit !== "sub" ? { subcategorySlug: query.sub } : {}),
    ...(audience ? { audience: { in: [audience, ...(audience !== "KIDS" ? (["UNISEX"] as Audience[]) : [])] } } : {}),
    ...(query.gia === "co" ? { basePrice: { gt: 0 } } : query.gia === "bao-gia" ? { basePrice: 0 } : {}),
    ...collectionWhere(query["bo-suu-tap"]),
    // thiet-ke=1: chỉ sản phẩm khách tự thiết kế được (có vùng in)
    ...(query["thiet-ke"] === "1" ? { printAreas: { some: {} } } : {}),
    // mau=Đen: sản phẩm có phân loại màu đó (không phân biệt hoa thường)
    ...(query.mau ? { variants: { some: { isActive: true, color: { equals: query.mau.trim().slice(0, 40), mode: "insensitive" as const } } } } : {}),
    ...(await resolveSearch(query.q)),
    ...(await b2bWhere(query)),
  };
}

/**
 * Bộ lọc doanh nghiệp: b2b=1 (chỉ ngành hàng doanh nghiệp), dip=<mã giải pháp> (khớp từ khoá theo dịp),
 * ngan-sach=<khoảng> (theo giá bán / giá "Từ" mỗi sản phẩm)
 */
async function b2bWhere(query: Record<string, string>): Promise<Prisma.ProductWhereInput> {
  if (query.b2b !== "1" && !query.dip && !query["ngan-sach"]) return {};
  const hub = (await getLanding()).b2bHub;
  const and: Prisma.ProductWhereInput[] = [];
  if (query.b2b === "1" && !query.category) and.push({ category: { isActive: true, slug: { in: hub.industries.map((i) => i.slug) } } });
  const dip = query.dip ? hub.solutions.find((s) => s.key === query.dip) : undefined;
  if (dip) {
    const ors = dip.keywords.split(",").map((k) => phraseWhere(k)).filter((w): w is Prisma.ProductWhereInput => !!w);
    if (ors.length) and.push({ OR: ors });
  }
  const budget = B2B_BUDGETS.find((b) => b.key === query["ngan-sach"]);
  if (budget) and.push({ sortPrice: { gte: budget.min, ...(budget.max ? { lt: budget.max } : {}) } });
  return and.length ? { AND: and } : {};
}

/** Bộ lọc: nhóm con trong danh mục + danh mục (khi tìm kiếm) kèm số lượng */
publicRoutes.get("/facets", async (c) => {
  const query = c.req.query();
  const [whereNoSub, whereNoCat] = await Promise.all([listingWhere(query, "sub"), listingWhere(query, "category")]);
  const [subs, cats] = await Promise.all([
    query.category
      ? prisma.product.groupBy({
          by: ["subcategorySlug", "subcategory"],
          where: { ...whereNoSub, subcategorySlug: { not: "" } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    prisma.product.groupBy({ by: ["categoryId"], where: whereNoCat, _count: { _all: true } }),
  ]);
  const catRows = await prisma.category.findMany({
    where: { id: { in: cats.map((x) => x.categoryId) } },
    select: { id: true, name: true, slug: true, sortOrder: true },
  });
  const catCount = new Map(cats.map((x) => [x.categoryId, x._count._all]));
  return c.json({
    subcategories: subs
      .map((s) => ({ slug: s.subcategorySlug, name: s.subcategory, count: s._count._all }))
      .sort((a, b) => b.count - a.count),
    categories: catRows
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((r) => ({ slug: r.slug, name: r.name, count: catCount.get(r.id) ?? 0 })),
  });
});

/** Gợi ý tức thì khi gõ tìm kiếm */
publicRoutes.get("/search/suggest", rateLimit({ key: "suggest", limit: 120, windowMs: 60_000 }), async (c) => {
  const q = c.req.query("q") ?? "";
  if (q.trim().length < 2) return c.json({ products: [], categories: [] });
  const where = { isActive: true, category: { isActive: true }, ...(await resolveSearch(q)) };
  const [products, total, cats] = await Promise.all([
    prisma.product.findMany({ where, take: 6, orderBy: [{ isBestSeller: "desc" }, { sortOrder: "asc" }], select: productSelect }),
    prisma.product.count({ where }),
    prisma.product.groupBy({ by: ["categoryId"], where, _count: { _all: true }, orderBy: { _count: { categoryId: "desc" } }, take: 3 }),
  ]);
  const catRows = await prisma.category.findMany({ where: { id: { in: cats.map((x) => x.categoryId) } }, select: { id: true, name: true, slug: true } });
  return c.json({
    total,
    products,
    categories: cats.map((x) => ({ ...catRows.find((r) => r.id === x.categoryId)!, count: x._count._all })).filter((x) => x.slug),
  });
});

publicRoutes.get("/categories/:slug", async (c) => {
  const cat = await prisma.category.findFirst({
    where: { slug: c.req.param("slug"), isActive: true },
    select: { id: true, name: true, slug: true, description: true, imageUrl: true },
  });
  if (!cat) throw notFound("Không tìm thấy danh mục");
  return c.json(cat);
});

publicRoutes.get("/products/:slug", async (c) => {
  const product = await prisma.product.findFirst({
    where: { slug: c.req.param("slug"), isActive: true },
    include: {
      category: { select: { name: true, slug: true, sizeChart: true } },
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, color: true, colorHex: true, size: true, sku: true, priceDelta: true, weightGram: true },
      },
      printAreas: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) throw notFound("Không tìm thấy sản phẩm");
  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, isActive: true, id: { not: product.id } },
    orderBy: { sortOrder: "asc" },
    take: 4,
    select: productSelect,
  });
  const { searchText: _s, sortPrice: _p, externalId: _e, sourceUrl: _u, ...rest } = product;
  return c.json({
    ...rest,
    priceTiers: parseTiers(product.priceTiers),
    // mặt in chưa có ảnh riêng -> dùng ảnh đại diện sản phẩm
    printAreas: product.printAreas.map((a) => ({ ...a, mockupImage: a.mockupImage || product.images[0] || "" })),
    related,
  });
});

/* ---------- Thông báo ---------- */
publicRoutes.get("/notices", async (c) => {
  const now = new Date();
  const items = await prisma.notice.findMany({
    where: { isActive: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    orderBy: { startsAt: "desc" },
    take: 20,
    select: { id: true, title: true, content: true, level: true, showBanner: true, showOnProduct: true, startsAt: true, endsAt: true },
  });
  return c.json(items);
});

/* ---------- Thư viện thiết kế cho editor ---------- */
publicRoutes.get("/design-assets", async (c) => {
  const kind = c.req.query("kind") === "TEMPLATE" ? "TEMPLATE" : "CLIPART";
  const items = await prisma.designAsset.findMany({
    where: { kind, isActive: true, status: "APPROVED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 5000,
    select: { id: true, kind: true, name: true, category: true, tags: true, imageUrl: true, natW: true, natH: true, data: true },
  });
  c.header("Cache-Control", "public, max-age=60");
  return c.json(items);
});

/* ---------- Help Center ---------- */
publicRoutes.get("/help", async (c) => {
  const q = c.req.query("q")?.trim() ?? "";
  const tokens = searchTokens(q);
  const items = await prisma.helpArticle.findMany({
    where: {
      isPublished: true,
      ...(c.req.query("category") ? { category: c.req.query("category") } : {}),
      ...(tokens.length ? { AND: tokens.map((t) => ({ searchText: { contains: t } })) } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    take: 100,
    select: { slug: true, category: true, title: true, updatedAt: true },
  });
  return c.json({ categories: HELP_CATEGORIES, items });
});

publicRoutes.get("/help/:slug", async (c) => {
  const a = await prisma.helpArticle.findFirst({
    where: { slug: c.req.param("slug"), isPublished: true },
    select: { slug: true, category: true, title: true, content: true, updatedAt: true },
  });
  if (!a) throw notFound("Không tìm thấy bài viết");
  const related = await prisma.helpArticle.findMany({
    where: { category: a.category, isPublished: true, slug: { not: a.slug } },
    orderBy: { sortOrder: "asc" },
    take: 6,
    select: { slug: true, title: true },
  });
  return c.json({ ...a, related });
});

/* ---------- Lead: khách để lại SĐT từ widget ---------- */
publicRoutes.post("/leads", rateLimit({ key: "lead", limit: 5, windowMs: 10 * 60_000 }), async (c) => {
  const input = leadCreateSchema.parse(await c.req.json());
  const lead = await prisma.lead.create({
    data: { name: input.name, phone: input.phone, topic: input.topic, message: input.message, pageUrl: input.pageUrl.slice(0, 300) },
    select: { id: true },
  });
  notifyLead({ ...input, ip: clientIp(c) });
  return c.json({ ok: true, id: lead.id }, 201);
});
