import type { MetadataRoute } from "next";
import { getCategories, getHelp, getPages, getProducts, getSettings } from "@/lib/api";
import { DESIGN_COLLECTIONS, DESIGN_HUBS, SEGMENTS } from "@pod/shared";
import { TOOL_LINKS } from "@/components/seo/ToolLinks";
import { SITE_URL } from "@/lib/config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, products, pages, help, settings] = await Promise.all([getCategories(), allProducts(), getPages(), getHelp(), getSettings()]);
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/san-pham`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/thiet-ke`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/bo-suu-tap`, changeFrequency: "weekly", priority: 0.8 },
    ...SEGMENTS.map((g) => ({ url: `${SITE_URL}${g.href}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...DESIGN_HUBS.map((h) => ({ url: `${SITE_URL}/${h.slug}`, changeFrequency: "weekly" as const, priority: 0.85 })),
    ...TOOL_LINKS.map((l) => ({ url: `${SITE_URL}${l.href}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${SITE_URL}/doanh-nghiep/san-pham`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/doanh-nghiep/qua-cuoi-nam`, changeFrequency: "weekly", priority: 0.85 },
    ...settings.b2bHub.industries.map((i) => ({ url: `${SITE_URL}/doanh-nghiep/san-pham?nganh=${i.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...settings.b2bHub.solutions.filter((x) => x.key !== "qua-tet").map((x) => ({ url: `${SITE_URL}/doanh-nghiep/san-pham?dip=${x.key}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...settings.campaigns.filter((c) => c.enabled).map((c) => ({ url: `${SITE_URL}/dip/${c.slug}`, changeFrequency: "daily" as const, priority: 0.85 })),
    ...DESIGN_COLLECTIONS.map((c) => ({ url: `${SITE_URL}/bo-suu-tap/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...cats.map((c) => ({ url: `${SITE_URL}/danh-muc/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...pages.map((p) => ({ url: `${SITE_URL}/trang/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.3 })),
    { url: `${SITE_URL}/ho-tro`, changeFrequency: "weekly", priority: 0.4 },
    ...help.items.map((a) => ({ url: `${SITE_URL}/ho-tro/${a.slug}`, lastModified: a.updatedAt, changeFrequency: "monthly" as const, priority: 0.3 })),
    ...products.map((p) => ({ url: `${SITE_URL}/san-pham/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}

/** API trả tối đa 100 SP/trang -> đi hết các trang (trước đây chỉ lấy trang 1, sitemap thiếu ~670 SP) */
async function allProducts() {
  const first = await getProducts({ pageSize: "100" }).catch(() => null);
  if (!first) return [];
  const pages = Math.min(Math.ceil(first.total / 100), 50);
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => getProducts({ pageSize: "100", page: String(i + 2) }).catch(() => null)));
  return [first, ...rest].flatMap((r) => r?.items ?? []);
}
