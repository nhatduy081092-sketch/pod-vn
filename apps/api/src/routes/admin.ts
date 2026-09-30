import { Hono } from "hono";
import { prisma, type Prisma } from "@pod/db";
import { verifyPassword } from "@pod/db/password";
import {
  categoryUpsertSchema,
  landingSettingsSchema,
  loginSchema,
  orderUpdateSchema,
  ORDER_STATUSES,
  PAGE_KEY_PREFIX,
  pageSlugSchema,
  pageUpsertSchema,
  parseTiers,
  productPriceBulkSchema,
  productUpsertSchema,
  sortPriceOf,
  testimonialUpsertSchema,
  variantsSaveSchema,
  printAreasSaveSchema,
  noticeUpsertSchema,
  helpArticleUpsertSchema,
  adminSellerUpdateSchema,
  LEAD_STATUSES,
  toSearchText,
  type OrderStatus,
  DESIGN_ASSET_KINDS,
  designAssetBulkSchema,
  designAssetPatchSchema,
  designAssetUpsertSchema,
  designJsonSchema,
  designTemplateSchema,
} from "@pod/shared";
import { z } from "zod";
import { hashPassword } from "@pod/db/password";
import { randomBytes } from "node:crypto";
import { assertAreasAllowed, ensureProductParts, savePrintAreas, saveVariants } from "../lib/product-parts";
import { emitOrderEvent } from "../lib/webhooks";
import { requireAdmin, signAdminToken, type AdminClaims } from "../lib/auth";
import { conflict, notFound, pageParams } from "../lib/http";
import { rateLimit } from "../lib/rate-limit";
import { getLanding, invalidateLanding } from "../lib/settings";
import { uniqueSlug } from "../lib/slug";
import { saveBuffer, saveUpload } from "../lib/upload";
import { aiPhotoEnabled, aiPhotoModel, buildPrompt, generateAiPhoto, type AiPhotoStyle } from "../lib/ai-photo";
import { listPages } from "../lib/pages";
import { importOemCatalog } from "../lib/oem-import";
import { searchFields, searchWhere } from "../lib/search";
import { HTTPException } from "hono/http-exception";

export const adminRoutes = new Hono<{ Variables: { admin: AdminClaims } }>();

/* ---------- Auth ---------- */
adminRoutes.post("/login", rateLimit({ key: "login", limit: 10, windowMs: 15 * 60_000 }), async (c) => {
  const { email, password } = loginSchema.parse(await c.req.json());
  const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HTTPException(401, { message: "Email hoặc mật khẩu không đúng" });
  }
  return c.json({ token: await signAdminToken(user), user: { id: user.id, email: user.email, name: user.name } });
});

adminRoutes.use("*", async (c, next) => {
  if (c.req.path.endsWith("/login")) return next();
  return requireAdmin(c, next);
});

adminRoutes.get("/me", async (c) => {
  const user = await prisma.adminUser.findUnique({
    where: { id: c.get("admin").sub },
    select: { id: true, email: true, name: true },
  });
  if (!user) throw notFound();
  return c.json(user);
});

/* ---------- Dashboard ---------- */
adminRoutes.get("/stats", async (c) => {
  const now = new Date();
  const since = (days: number) => new Date(now.getTime() - days * 86400_000);
  const notCancelled = { status: { not: "CANCELLED" as OrderStatus }, isQuote: false };
  const [byStatus, rev1, rev7, rev30, productCount, recent, newLeads, pendingSellers, unpaidBatches] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.aggregate({ where: { ...notCancelled, createdAt: { gte: since(1) } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.order.aggregate({ where: { ...notCancelled, createdAt: { gte: since(7) } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.order.aggregate({ where: { ...notCancelled, createdAt: { gte: since(30) } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, code: true, customerName: true, phone: true, total: true, status: true, paymentMethod: true, createdAt: true },
    }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.sellerProfile.count({ where: { status: "PENDING" } }),
    prisma.paymentBatch.count({ where: { status: "UNPAID" } }),
  ]);
  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  for (const row of byStatus) statusCounts[row.status] = row._count._all;
  const r = (x: { _sum: { total: number | null }; _count: { _all: number } }) => ({ revenue: x._sum.total ?? 0, orders: x._count._all });
  return c.json({ statusCounts, last24h: r(rev1), last7d: r(rev7), last30d: r(rev30), productCount, recent, newLeads, pendingSellers, unpaidBatches });
});

/* ---------- Upload ---------- */
adminRoutes.post("/uploads", async (c) => {
  const body = await c.req.parseBody();
  return c.json(await saveUpload(body["file"]), 201);
});

/* ---------- Ảnh thật bằng AI (Gemini) ---------- */
adminRoutes.get("/ai-photo/config", (c) => c.json({ enabled: aiPhotoEnabled(), model: aiPhotoModel() }));

/** Ảnh 2D của sản phẩm (CMS đã chuyển SVG -> PNG) + kiểu ảnh -> ảnh chụp thật, lưu vào /uploads (CHƯA gắn vào sản phẩm) */
adminRoutes.post("/ai-photo", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];
  const productId = String(body["productId"] ?? "");
  const style = (["studio", "flatlay", "model"].includes(String(body["style"])) ? body["style"] : "studio") as AiPhotoStyle;
  if (!(file instanceof File)) throw new HTTPException(400, { message: "Thiếu ảnh nguồn" });
  if (file.size > 12 * 1024 * 1024) throw new HTTPException(400, { message: "Ảnh nguồn tối đa 12MB" });
  const p = await prisma.product.findUnique({ where: { id: productId }, select: { name: true, material: true, audience: true, category: { select: { name: true } } } });
  if (!p) throw notFound("Không tìm thấy sản phẩm");
  const src = Buffer.from(await file.arrayBuffer());
  const mime = src[0] === 0x89 ? "image/png" : src[0] === 0xff ? "image/jpeg" : src.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : "";
  if (!mime) throw new HTTPException(400, { message: "Ảnh nguồn phải là PNG/JPG/WEBP" });
  const prompt = buildPrompt({ name: p.name, material: p.material, audience: p.audience, category: p.category.name }, style);
  const out = await generateAiPhoto(src, mime, prompt);
  // tiền tố "ai-" -> web tự gắn nhãn "Ảnh minh hoạ" (isAiImage) cho tới khi thay bằng ảnh/mockup thật
  const saved = await saveBuffer(out, "ai-");
  return c.json({ ...saved, style, model: aiPhotoModel() }, 201);
});

/** Đổi danh sách ảnh của 1 sản phẩm (duyệt ảnh AI, sắp xếp ảnh) */
const imagesSchema = z.object({
  images: z
    .array(z.string().trim().max(500).regex(/^(\/uploads\/|\/mock\/|https:\/\/)/, "Ảnh không hợp lệ"))
    .max(12),
});
adminRoutes.patch("/products/:id/images", async (c) => {
  const { images } = imagesSchema.parse(await c.req.json());
  const exists = await prisma.product.findUnique({ where: { id: c.req.param("id") }, select: { id: true } });
  if (!exists) throw notFound();
  const p = await prisma.product.update({ where: { id: c.req.param("id") }, data: { images: [...new Set(images)] }, select: { id: true, images: true } });
  return c.json(p);
});

/* ---------- Categories ---------- */
adminRoutes.get("/categories", async (c) => {
  const items = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return c.json(items);
});

adminRoutes.post("/categories", async (c) => {
  const input = categoryUpsertSchema.parse(await c.req.json());
  const slug = await uniqueSlug(input.slug || input.name, (s) => prisma.category.findUnique({ where: { slug: s }, select: { id: true } }));
  return c.json(await prisma.category.create({ data: { ...input, slug } }), 201);
});

adminRoutes.put("/categories/:id", async (c) => {
  const id = c.req.param("id");
  const input = categoryUpsertSchema.parse(await c.req.json());
  const slug = await uniqueSlug(input.slug || input.name, (s) => prisma.category.findUnique({ where: { slug: s }, select: { id: true } }), id);
  return c.json(await prisma.category.update({ where: { id }, data: { ...input, slug } }));
});

adminRoutes.delete("/categories/:id", async (c) => {
  const id = c.req.param("id");
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) throw conflict(`Danh mục đang có ${count} sản phẩm – hãy chuyển/xoá sản phẩm trước`);
  await prisma.category.delete({ where: { id } });
  return c.json({ ok: true });
});

/* ---------- Products ---------- */
/** anh=trong: chưa có ảnh · anh=nguon: vẫn dùng ảnh gốc oemgroup.vn (cần thay) · anh=rieng: đã có ảnh tự upload */
async function imageFilter(anh?: string): Promise<Prisma.ProductWhereInput> {
  if (anh === "trong") return { images: { isEmpty: true } };
  if (anh !== "nguon" && anh !== "rieng") return {};
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Product" WHERE array_to_string(images, ' ') ~* '^https?://(www[.])?oemgroup[.]vn/'`;
  const ids = rows.map((r) => r.id);
  return anh === "nguon" ? { id: { in: ids } } : { id: { notIn: ids }, images: { isEmpty: false } };
}

adminRoutes.get("/products", async (c) => {
  const { page, pageSize, skip, take } = pageParams(c, 30);
  const q = c.req.query("q")?.trim();
  const categoryId = c.req.query("categoryId");
  const gia = c.req.query("gia");
  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q } }, searchWhere(q)] } : {}),
    ...(categoryId ? { categoryId } : {}),
    // co = bán online · bao-gia = giá 0 · chua-co = giá 0 và chưa có giá "Từ"
    ...(gia === "co" ? { basePrice: { gt: 0 } } : gia === "bao-gia" ? { basePrice: 0 } : gia === "chua-co" ? { sortPrice: null } : {}),
    ...(await imageFilter(c.req.query("anh"))),
  };
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      skip,
      take,
      include: { category: { select: { name: true } } },
    }),
    prisma.product.count({ where }),
  ]);
  return c.json({ items, total, page, pageSize });
});

adminRoutes.get("/products/:id", async (c) => {
  const p = await prisma.product.findUnique({
    where: { id: c.req.param("id") },
    include: { variants: { orderBy: { sortOrder: "asc" } }, printAreas: { orderBy: { sortOrder: "asc" } } },
  });
  if (!p) throw notFound();
  return c.json({ ...p, priceTiers: parseTiers(p.priceTiers) });
});

/** Lưu biến thể (màu × size, SKU, cân nặng, phụ phí) – thay thế toàn bộ */
adminRoutes.put("/products/:id/variants", async (c) => {
  const id = c.req.param("id");
  const { variants } = variantsSaveSchema.parse(await c.req.json());
  const p = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  if (!p) throw notFound();
  return c.json(await saveVariants(id, p.name, variants));
});

/** Lưu các mặt in (kích thước thật, DPI, ảnh mockup, khung vùng in) – thay thế toàn bộ */
adminRoutes.put("/products/:id/print-areas", async (c) => {
  const id = c.req.param("id");
  const { areas } = printAreasSaveSchema.parse(await c.req.json());
  assertAreasAllowed(areas);
  const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw notFound();
  return c.json(await savePrintAreas(id, areas));
});

adminRoutes.post("/products", async (c) => {
  const input = productUpsertSchema.parse(await c.req.json());
  const slug = await uniqueSlug(input.slug || input.name, (s) => prisma.product.findUnique({ where: { slug: s }, select: { id: true } }));
  const cat = await prisma.category.findUnique({ where: { id: input.categoryId }, select: { name: true } });
  const p = await prisma.product.create({
    data: {
      ...input,
      ...searchFields(input.name, input.subcategory, cat?.name ?? "", input.material),
      slug,
      compareAtPrice: input.compareAtPrice ?? null,
      priceFrom: input.priceFrom || null,
      salePrice: input.salePrice || null,
      sortPrice: sortPriceOf(input.basePrice, input.priceFrom),
    },
  });
  await ensureProductParts(p);
  return c.json(p, 201);
});

adminRoutes.put("/products/:id", async (c) => {
  const id = c.req.param("id");
  const input = productUpsertSchema.parse(await c.req.json());
  const slug = await uniqueSlug(input.slug || input.name, (s) => prisma.product.findUnique({ where: { slug: s }, select: { id: true } }), id);
  const cat = await prisma.category.findUnique({ where: { id: input.categoryId }, select: { name: true } });
  return c.json(
    await prisma.product.update({
      where: { id },
      data: {
        ...input,
        ...searchFields(input.name, input.subcategory, cat?.name ?? "", input.material),
        slug,
        compareAtPrice: input.compareAtPrice ?? null,
        priceFrom: input.priceFrom || null,
        salePrice: input.salePrice || null,
        sortPrice: sortPriceOf(input.basePrice, input.priceFrom),
      },
    }),
  );
});

/** Sửa nhanh giá nhiều sản phẩm trong 1 transaction (CMS → Bảng giá nhanh) */
adminRoutes.patch("/products/prices", async (c) => {
  const { items } = productPriceBulkSchema.parse(await c.req.json());
  const ids = [...new Set(items.map((i) => i.id))];
  const found = await prisma.product.count({ where: { id: { in: ids } } });
  if (found !== ids.length) throw notFound("Có sản phẩm không còn tồn tại – tải lại trang");
  await prisma.$transaction(
    items.map((i) =>
      prisma.product.update({
        where: { id: i.id },
        data: {
          basePrice: i.basePrice,
          compareAtPrice: i.basePrice > 0 && i.compareAtPrice && i.compareAtPrice > i.basePrice ? i.compareAtPrice : null,
          priceFrom: i.priceFrom || null,
          minQty: i.minQty,
          sortPrice: sortPriceOf(i.basePrice, i.priceFrom),
        },
      }),
    ),
  );
  return c.json({ ok: true, updated: items.length });
});

adminRoutes.delete("/products/:id", async (c) => {
  await prisma.product.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

/* ---------- Orders ---------- */
adminRoutes.get("/orders", async (c) => {
  const { page, pageSize, skip, take } = pageParams(c, 30);
  const q = c.req.query("q")?.trim();
  const status = c.req.query("status") as OrderStatus | undefined;
  const type = c.req.query("type");
  const where: Prisma.OrderWhereInput = {
    ...(type === "quote" ? { isQuote: true } : type === "order" ? { isQuote: false, sellerId: null } : type === "seller" ? { sellerId: { not: null } } : {}),
    ...(c.req.query("sellerId") ? { sellerId: c.req.query("sellerId") } : {}),
    ...(status && ORDER_STATUSES.includes(status) ? { status } : {}),
    ...(q
      ? {
          OR: [
            { code: { contains: q.toUpperCase() } },
            { phone: { contains: q } },
            { customerName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { _count: { select: { items: true } }, seller: { select: { name: true, phone: true } }, batch: { select: { code: true, status: true } } },
    }),
    prisma.order.count({ where }),
  ]);
  return c.json({ items, total, page, pageSize });
});

adminRoutes.get("/orders/:id", async (c) => {
  const order = await prisma.order.findUnique({
    where: { id: c.req.param("id") },
    include: {
      items: true,
      customer: { select: { id: true, name: true, phone: true } },
      seller: { select: { id: true, name: true, phone: true, seller: { select: { brandName: true, companyName: true, labelImage: true } } } },
      batch: { select: { code: true, status: true, total: true } },
    },
  });
  if (!order) throw notFound();
  return c.json(order);
});

adminRoutes.patch("/orders/:id", async (c) => {
  const input = orderUpdateSchema.parse(await c.req.json());
  const before = await prisma.order.findUnique({ where: { id: c.req.param("id") }, select: { status: true, paymentStatus: true, trackingCode: true } });
  if (!before) throw notFound();
  const order = await prisma.order.update({ where: { id: c.req.param("id") }, data: input });
  // Webhook cho seller khi trạng thái / thanh toán / mã vận đơn thay đổi
  const changed = before.status !== order.status || before.paymentStatus !== order.paymentStatus || before.trackingCode !== order.trackingCode;
  if (order.sellerId && changed) {
    const ev = order.status === "CANCELLED" ? "order.cancelled" : order.status === "SHIPPING" && before.status !== "SHIPPING" ? "order.shipped" : "order.updated";
    void emitOrderEvent(order.id, ev).catch(() => undefined);
  }
  return c.json(order);
});

/* ---------- Settings (landing) ---------- */
adminRoutes.get("/settings/landing", async (c) => c.json(await getLanding(true)));

adminRoutes.put("/settings/landing", async (c) => {
  const value = landingSettingsSchema.parse(await c.req.json());
  await prisma.setting.upsert({ where: { key: "landing" }, update: { value }, create: { key: "landing", value } });
  invalidateLanding();
  return c.json(value);
});

/* ---------- Testimonials ---------- */
adminRoutes.get("/testimonials", async (c) => c.json(await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } })));

adminRoutes.post("/testimonials", async (c) => {
  const input = testimonialUpsertSchema.parse(await c.req.json());
  return c.json(await prisma.testimonial.create({ data: { ...input, productPrice: input.productPrice ?? null } }), 201);
});

adminRoutes.put("/testimonials/:id", async (c) => {
  const input = testimonialUpsertSchema.parse(await c.req.json());
  return c.json(await prisma.testimonial.update({ where: { id: c.req.param("id") }, data: { ...input, productPrice: input.productPrice ?? null } }));
});

adminRoutes.delete("/testimonials/:id", async (c) => {
  await prisma.testimonial.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

/* ---------- Trang nội dung ---------- */
adminRoutes.get("/pages", async (c) => c.json(await listPages()));

adminRoutes.put("/pages/:slug", async (c) => {
  const slug = pageSlugSchema.parse(c.req.param("slug"));
  const value = pageUpsertSchema.parse(await c.req.json());
  const key = PAGE_KEY_PREFIX + slug;
  await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  return c.json({ slug, ...value });
});

/** Xoá bản đã lưu (trang mặc định sẽ quay về nội dung mẫu) */
adminRoutes.delete("/pages/:slug", async (c) => {
  const slug = pageSlugSchema.parse(c.req.param("slug"));
  await prisma.setting.deleteMany({ where: { key: PAGE_KEY_PREFIX + slug } });
  return c.json({ ok: true });
});

/* ---------- Đồng bộ sản phẩm OEM Group ---------- */
let importRunning = false;
adminRoutes.post("/import/oem", async (c) => {
  if (importRunning) throw conflict("Đang đồng bộ, vui lòng đợi");
  importRunning = true;
  try {
    return c.json(await importOemCatalog());
  } finally {
    importRunning = false;
  }
});

/* ================== C. Thông báo ================== */
adminRoutes.get("/notices", async (c) => c.json(await prisma.notice.findMany({ orderBy: { startsAt: "desc" }, take: 200 })));
adminRoutes.post("/notices", async (c) => {
  const input = noticeUpsertSchema.parse(await c.req.json());
  return c.json(await prisma.notice.create({ data: { ...input, startsAt: input.startsAt ?? new Date() } }), 201);
});
adminRoutes.put("/notices/:id", async (c) => {
  const input = noticeUpsertSchema.parse(await c.req.json());
  return c.json(await prisma.notice.update({ where: { id: c.req.param("id") }, data: { ...input, startsAt: input.startsAt ?? new Date() } }));
});
adminRoutes.delete("/notices/:id", async (c) => {
  await prisma.notice.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

/* ================== D. Help Center ================== */
adminRoutes.get("/help", async (c) => c.json(await prisma.helpArticle.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] })));
async function helpData(raw: unknown, id?: string) {
  const input = helpArticleUpsertSchema.parse(raw);
  const slug = await uniqueSlug(input.slug || input.title, (s) => prisma.helpArticle.findUnique({ where: { slug: s }, select: { id: true } }), id);
  return { ...input, slug, searchText: toSearchText(input.title, input.content) };
}
adminRoutes.post("/help", async (c) => c.json(await prisma.helpArticle.create({ data: await helpData(await c.req.json()) }), 201));
adminRoutes.put("/help/:id", async (c) => {
  const id = c.req.param("id");
  return c.json(await prisma.helpArticle.update({ where: { id }, data: await helpData(await c.req.json(), id) }));
});
adminRoutes.delete("/help/:id", async (c) => {
  await prisma.helpArticle.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

/* ================== Thư viện thiết kế (clipart + mẫu) ================== */
adminRoutes.get("/design-assets", async (c) => {
  const kind = c.req.query("kind");
  return c.json(
    await prisma.designAsset.findMany({
      where: kind && (DESIGN_ASSET_KINDS as readonly string[]).includes(kind) ? { kind } : {},
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: 5000,
    }),
  );
});
const assetData = (raw: unknown) => {
  const a = designAssetUpsertSchema.parse(raw);
  return { ...a, data: (a.data ?? undefined) as Prisma.InputJsonValue | undefined };
};
adminRoutes.post("/design-assets", async (c) => c.json(await prisma.designAsset.create({ data: assetData(await c.req.json()) }), 201));
adminRoutes.put("/design-assets/:id", async (c) => c.json(await prisma.designAsset.update({ where: { id: c.req.param("id") }, data: assetData(await c.req.json()) })));
/** Sửa / duyệt / xoá hàng loạt (đặt trước /:id) */
adminRoutes.post("/design-assets/bulk", async (c) => {
  const { ids, patch, remove } = designAssetBulkSchema.parse(await c.req.json());
  if (remove) return c.json({ count: (await prisma.designAsset.deleteMany({ where: { id: { in: ids } } })).count });
  if (!patch || !Object.keys(patch).length) throw new HTTPException(400, { message: "Không có thay đổi" });
  return c.json({ count: (await prisma.designAsset.updateMany({ where: { id: { in: ids } }, data: patch })).count });
});
adminRoutes.patch("/design-assets/:id", async (c) => {
  const p = designAssetPatchSchema.parse(await c.req.json());
  return c.json(await prisma.designAsset.update({ where: { id: c.req.param("id") }, data: p }));
});
adminRoutes.delete("/design-assets/:id", async (c) => {
  await prisma.designAsset.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

/** Thiết kế khách/admin đã lưu – nguồn để tạo mẫu thư viện */
adminRoutes.get("/saved-designs", async (c) => {
  const q = c.req.query("q")?.trim();
  return c.json(
    await prisma.savedDesign.findMany({
      where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { customer: { phone: { contains: q } } }, { product: { name: { contains: q, mode: "insensitive" } } }] } : {},
      orderBy: { updatedAt: "desc" },
      take: 60,
      select: {
        id: true,
        name: true,
        previewUrl: true,
        updatedAt: true,
        json: true,
        customer: { select: { name: true, phone: true } },
        product: { select: { id: true, name: true, printAreas: { orderBy: { sortOrder: "asc" }, select: { key: true, name: true, widthMm: true, heightMm: true } } } },
      },
    }),
  );
});

adminRoutes.post("/design-assets/from-design", async (c) => {
  const input = z.object({ savedDesignId: z.string().min(1).max(40), area: z.string().min(1).max(30), name: z.string().trim().min(1).max(80), category: z.string().trim().max(40).default("") }).parse(await c.req.json());
  const d = await prisma.savedDesign.findUnique({ where: { id: input.savedDesignId }, select: { json: true, previewUrl: true, productId: true } });
  if (!d) throw notFound("Không tìm thấy thiết kế");
  const json = designJsonSchema.safeParse(d.json);
  if (!json.success) throw new HTTPException(400, { message: "Dữ liệu thiết kế lỗi" });
  const ad = json.data.areas[input.area];
  if (!ad?.layers.length) throw new HTTPException(400, { message: "Mặt in này chưa có lớp nào" });
  const area = await prisma.printArea.findFirst({ where: { productId: d.productId, key: input.area }, select: { widthMm: true, heightMm: true } });
  if (!area) throw notFound("Sản phẩm không còn mặt in này");
  const data = designTemplateSchema.parse({ srcW: area.widthMm, srcH: area.heightMm, bg: ad.bg, layers: ad.layers });
  const row = await prisma.designAsset.create({
    data: { kind: "TEMPLATE", name: input.name, category: input.category, imageUrl: d.previewUrl, data: data as unknown as Prisma.InputJsonValue },
  });
  return c.json(row, 201);
});

/* ================== D. Lead ================== */
adminRoutes.get("/leads", async (c) => {
  const { page, pageSize, skip, take } = pageParams(c, 50);
  const status = c.req.query("status");
  const where: Prisma.LeadWhereInput = status && (LEAD_STATUSES as readonly string[]).includes(status) ? { status } : {};
  const [items, total] = await Promise.all([prisma.lead.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }), prisma.lead.count({ where })]);
  return c.json({ items, total, page, pageSize });
});
adminRoutes.patch("/leads/:id", async (c) => {
  const input = z.object({ status: z.enum(LEAD_STATUSES), adminNote: z.string().max(1000).default("") }).parse(await c.req.json());
  return c.json(await prisma.lead.update({ where: { id: c.req.param("id") }, data: input }));
});

/* ================== D. Khách hàng ================== */
adminRoutes.get("/customers", async (c) => {
  const { page, pageSize, skip, take } = pageParams(c, 30);
  const q = c.req.query("q")?.trim();
  const where: Prisma.CustomerWhereInput = q ? { OR: [{ phone: { contains: q } }, { name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {};
  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: { id: true, phone: true, name: true, email: true, isActive: true, createdAt: true, seller: { select: { status: true } }, _count: { select: { orders: true, designs: true } } },
    }),
    prisma.customer.count({ where }),
  ]);
  return c.json({ items, total, page, pageSize });
});
adminRoutes.patch("/customers/:id", async (c) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(await c.req.json());
  return c.json(await prisma.customer.update({ where: { id: c.req.param("id") }, data: { isActive }, select: { id: true, isActive: true } }));
});
/** Cấp lại mật khẩu tạm (khách quên mật khẩu, chưa có SMS OTP) – chỉ hiện 1 lần cho admin */
adminRoutes.post("/customers/:id/reset-password", async (c) => {
  const temp = randomBytes(6).toString("base64url").replace(/[-_]/g, "x") + "9a";
  await prisma.customer.update({ where: { id: c.req.param("id") }, data: { passwordHash: await hashPassword(temp) } });
  return c.json({ tempPassword: temp });
});

/* ================== E. Seller ================== */
adminRoutes.get("/sellers", async (c) => {
  const status = c.req.query("status");
  return c.json(
    await prisma.sellerProfile.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 300,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true, _count: { select: { sellerOrders: true, templates: true } } } },
      },
    }),
  );
});
adminRoutes.put("/sellers/:customerId", async (c) => {
  const input = adminSellerUpdateSchema.parse(await c.req.json());
  // Seller không ở trạng thái APPROVED: API key & khu seller tự bị chặn (requireSeller/requireApiKey kiểm tra trạng thái)
  return c.json(await prisma.sellerProfile.update({ where: { customerId: c.req.param("customerId") }, data: input }));
});

/* ================== E. Thanh toán gộp ================== */
adminRoutes.get("/batches", async (c) => {
  const status = c.req.query("status");
  return c.json(
    await prisma.paymentBatch.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { seller: { select: { name: true, phone: true } }, orders: { select: { id: true, code: true, total: true, status: true, paymentStatus: true } } },
    }),
  );
});
/** Xác nhận đã nhận tiền: tất cả đơn trong lần thanh toán -> Đã thanh toán, đơn chờ -> Đã xác nhận */
adminRoutes.post("/batches/:id/paid", async (c) => {
  const b = await prisma.paymentBatch.findUnique({ where: { id: c.req.param("id") }, select: { id: true, status: true, orders: { select: { id: true, status: true } } } });
  if (!b) throw notFound();
  if (b.status !== "UNPAID") throw conflict("Lần thanh toán này không ở trạng thái chờ");
  await prisma.$transaction([
    prisma.paymentBatch.update({ where: { id: b.id }, data: { status: "PAID", paidAt: new Date() } }),
    prisma.order.updateMany({ where: { batchId: b.id }, data: { paymentStatus: "PAID" } }),
    prisma.order.updateMany({ where: { batchId: b.id, status: "PENDING" }, data: { status: "CONFIRMED" } }),
  ]);
  for (const o of b.orders) void emitOrderEvent(o.id, "order.updated").catch(() => undefined);
  return c.json({ ok: true });
});
adminRoutes.post("/batches/:id/cancel", async (c) => {
  const b = await prisma.paymentBatch.findUnique({ where: { id: c.req.param("id") }, select: { id: true, status: true } });
  if (!b) throw notFound();
  if (b.status !== "UNPAID") throw conflict("Chỉ huỷ được lần thanh toán đang chờ");
  await prisma.$transaction([
    prisma.order.updateMany({ where: { batchId: b.id }, data: { batchId: null } }),
    prisma.paymentBatch.update({ where: { id: b.id }, data: { status: "CANCELLED" } }),
  ]);
  return c.json({ ok: true });
});
