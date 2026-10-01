import { prisma } from "@pod/db";
import { b2bPriceFor, DEFAULT_SIZES, KIDS_SIZES, mergeLanding, slugify } from "@pod/shared";
import { getLanding, invalidateLanding } from "./settings";
import { searchFields } from "./search";
import { ensureProductParts } from "./product-parts";

/**
 * Đồng bộ danh mục + sản phẩm từ website OEM Group (WooCommerce Store API công khai).
 * Chạy trên máy chủ API (có Internet). Idempotent: upsert theo externalId = "oem:<id>".
 * Khi cập nhật chỉ ghi đè tên/mô tả/danh mục/link nguồn + giá nguồn (sourcePrice) – KHÔNG đụng giá bán, nhãn, trạng thái
 * đã có (đổi giá bán hàng loạt bằng CMS → "Giá B2B" → Áp dụng). Sản phẩm mới: giá bán tính theo cấu hình giá B2B.
 * Ảnh: chỉ cập nhật khi sản phẩm vẫn đang dùng ảnh gốc oemgroup.vn (ảnh đã thay trong CMS được giữ nguyên).
 */
const BASE = process.env.OEM_SOURCE_URL ?? "https://oemgroup.vn";
const SOURCE_HOST = new URL(BASE).hostname.replace(/^www\./, "");

/** Ảnh lấy trực tiếp từ website nguồn (chưa thay bằng ảnh tự host) */
export function isSourceImage(url: string): boolean {
  try {
    return new URL(url).hostname.replace(/^www\./, "") === SOURCE_HOST;
  } catch {
    return false; // "/uploads/..." = ảnh đã upload trong CMS
  }
}

// thứ tự hiển thị danh mục cấp 1 (ưu tiên nhóm hợp với in ấn cá nhân hoá)
const TOP_ORDER = [
  "dong-phuc-may-mac",
  "balo-tui-phu-kien",
  "binh-nuoc-ly-coc",
  "mu-non-ao-mua-o-du",
  "van-phong-pham",
  "hop-giay-san-pham-giay",
  "vali-du-lich",
  "gia-dung-dien-bep",
  "do-choi-me-be",
];
const APPAREL_SUB = new Set(["dong-phuc", "ao-khoac-ao-bao-ho", "ao-so-mi", "ao-the-thao", "ao-thun-polo", "ao-tre-em", "may-mac-khac"]);
const KIDS_SUB = new Set(["ao-tre-em", "balo-tre-em", "vali-tre-em", "do-choi-tre-em", "do-choi-me-be"]);

type WcImage = { src: string; srcset?: string; thumbnail?: string };
type WcCat = { id: number; parent: number; name: string; slug: string; count: number };
type WcProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  short_description: string;
  description: string;
  prices?: { price: string; currency_minor_unit: number };
  images: WcImage[];
  categories: { id: number; name: string; slug: string }[];
};

export type ImportReport = {
  categories: number;
  created: number;
  updated: number;
  skipped: number;
  total: number;
  errors: string[];
  ms: number;
};

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…" };
export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
      .replace(/<\/(p|div|h\d|li|tr)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, ""),
  )
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** Chọn ảnh ~768px từ srcset (nhẹ hơn ảnh gốc 2000px+) */
function pickImage(img: WcImage): string {
  const cands = (img.srcset ?? "")
    .split(",")
    .map((x) => x.trim().split(/\s+/))
    .map(([url, w]) => ({ url: url ?? "", w: Number((w ?? "").replace("w", "")) || 0 }))
    .filter((c) => c.url && c.w);
  const ok = cands.filter((c) => c.w >= 600).sort((a, b) => Math.abs(a.w - 768) - Math.abs(b.w - 768))[0];
  if (ok) return ok.url;
  const biggest = cands.sort((a, b) => b.w - a.w)[0];
  return biggest?.url ?? img.src;
}

async function getJson<T>(path: string): Promise<{ data: T; totalPages: number }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(`${BASE}${path}`, { signal: ctrl.signal, headers: { Accept: "application/json", "User-Agent": "pod-vn-sync/1.0" } });
    if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
    return { data: (await res.json()) as T, totalPages: Number(res.headers.get("x-wp-totalpages") ?? 1) };
  } finally {
    clearTimeout(timer);
  }
}

export async function importOemCatalog(): Promise<ImportReport> {
  const t0 = Date.now();
  const report: ImportReport = { categories: 0, created: 0, updated: 0, skipped: 0, total: 0, errors: [], ms: 0 };
  const pricing = (await getLanding(true)).b2bPricing;

  // 1. Danh mục -> map về danh mục cấp 1
  const { data: cats } = await getJson<WcCat[]>("/wp-json/wc/store/v1/products/categories?per_page=100");
  const byId = new Map(cats.map((c) => [c.id, c]));
  const topOf = (id: number): WcCat | undefined => {
    let c = byId.get(id);
    for (let i = 0; c && c.parent && i < 10; i++) c = byId.get(c.parent);
    return c;
  };
  const tops = cats.filter((c) => c.parent === 0);
  const catIdBySlug = new Map<string, string>();
  for (const t of tops) {
    const order = TOP_ORDER.indexOf(t.slug);
    const cat = await prisma.category.upsert({
      where: { slug: t.slug },
      update: { name: decodeEntities(t.name) },
      create: {
        name: decodeEntities(t.name),
        slug: t.slug,
        description: `${decodeEntities(t.name)} in / thêu / khắc logo và cá nhân hoá theo yêu cầu – nhận làm từ số lượng nhỏ đến đơn doanh nghiệp.`,
        sortOrder: 100 + (order === -1 ? 50 : order),
        isActive: true,
        showOnHome: false, // hiển thị ở khối "Danh mục cá nhân hoá" thay vì section dài
      },
    });
    catIdBySlug.set(t.slug, cat.id);
  }
  report.categories = catIdBySlug.size;

  // 2. Sản phẩm (phân trang 100/lần)
  const all: WcProduct[] = [];
  const first = await getJson<WcProduct[]>("/wp-json/wc/store/v1/products?per_page=100&page=1");
  all.push(...first.data);
  for (let p = 2; p <= first.totalPages; p++) {
    all.push(...(await getJson<WcProduct[]>(`/wp-json/wc/store/v1/products?per_page=100&page=${p}`)).data);
  }
  report.total = all.length;

  // 3. Upsert theo lô nhỏ
  const handle = async (p: WcProduct) => {
    const leaf = p.categories.find((c) => byId.get(c.id)?.parent) ?? p.categories[0];
    const top = leaf ? topOf(leaf.id) : undefined;
    const categoryId = top ? catIdBySlug.get(top.slug) : undefined;
    if (!categoryId) {
      report.skipped++;
      return;
    }
    const subSlugs = p.categories.map((c) => c.slug);
    const isApparel = top!.slug === "dong-phuc-may-mac" && subSlugs.some((s) => APPAREL_SUB.has(s));
    const isKids = subSlugs.some((s) => KIDS_SUB.has(s)) || top!.slug === "do-choi-me-be";
    const images = [...new Set(p.images.map(pickImage))].slice(0, 5);
    const short = htmlToText(p.short_description);
    const long = htmlToText(p.description);
    const subNames = p.categories.map((c) => decodeEntities(c.name)).join(", ");
    const description = [short, long && long !== short ? long : "", `Nhóm: ${subNames}.`].filter(Boolean).join("\n\n").slice(0, 4000);
    const minor = p.prices?.currency_minor_unit ?? 0;
    const price = Math.round(Number(p.prices?.price ?? 0) / 10 ** minor) || 0;
    const externalId = `oem:${p.id}`;
    const name = decodeEntities(p.name).trim();
    const subName = leaf && leaf.id !== top!.id ? decodeEntities(leaf.name) : "";
    const search = searchFields(name, subName, decodeEntities(top!.name));

    const existing = await prisma.product.findUnique({ where: { externalId }, select: { id: true, images: true } });
    if (existing) {
      const keepImages = existing.images.some((u) => !isSourceImage(u));
      await prisma.product.update({
        where: { id: existing.id },
        data: { name, description, ...(keepImages ? {} : { images }), categoryId, sourceUrl: p.permalink, sourcePrice: price > 0 ? price : null, ...search },
      });
      report.updated++;
      return;
    }
    let slug = p.slug || slugify(name);
    const clash = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (clash) slug = `${slug}-oem`;
    const created = await prisma.product.create({
      data: {
        externalId,
        sourceUrl: p.permalink,
        ...search,
        name,
        slug,
        description,
        categoryId,
        audience: isKids ? "KIDS" : "UNISEX",
        material: "",
        printMethod: "In / thêu / khắc logo theo yêu cầu",
        // giá nguồn 0 = nguồn chưa niêm yết -> liên hệ báo giá
        ...(price > 0 ? b2bPriceFor(price, pricing) : { basePrice: 0, priceFrom: null, sortPrice: null, minQty: 1, priceTiers: [] }),
        sourcePrice: price > 0 ? price : null,
        compareAtPrice: null,
        images,
        mockShape: "",
        colors: [],
        sizes: isApparel ? (subSlugs.includes("ao-tre-em") ? KIDS_SIZES : DEFAULT_SIZES) : ["Free size"],
        isBestSeller: false,
        isHotSale: false,
        isActive: true,
        sortOrder: 1000,
      },
    });
    await ensureProductParts(created);
    report.created++;
  };

  for (let i = 0; i < all.length; i += 8) {
    await Promise.all(
      all.slice(i, i + 8).map((p) =>
        handle(p).catch((e) => {
          report.errors.push(`${p.name}: ${(e as Error).message}`.slice(0, 200));
        }),
      ),
    );
  }

  // 4. Dọn 3 sản phẩm mẫu B2B cũ + trỏ khối B2B sang danh mục đồng phục thật
  const oldB2B = await prisma.category.findUnique({ where: { slug: "dong-phuc-qua-tang-doanh-nghiep" }, select: { id: true } });
  if (oldB2B) {
    await prisma.product.updateMany({ where: { categoryId: oldB2B.id, externalId: null }, data: { isActive: false } });
    await prisma.category.update({ where: { id: oldB2B.id }, data: { isActive: false } });
  }
  const row = await prisma.setting.findUnique({ where: { key: "landing" } });
  if (row) {
    const cur = mergeLanding(row.value);
    if (cur.b2b.categorySlug === "dong-phuc-qua-tang-doanh-nghiep" && catIdBySlug.has("dong-phuc-may-mac")) {
      await prisma.setting.update({ where: { key: "landing" }, data: { value: { ...cur, b2b: { ...cur.b2b, categorySlug: "dong-phuc-may-mac" } } } });
      invalidateLanding();
    }
  }

  report.ms = Date.now() - t0;
  report.errors = report.errors.slice(0, 20);
  return report;
}
