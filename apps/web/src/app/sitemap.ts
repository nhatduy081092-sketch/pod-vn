import type { MetadataRoute } from "next";
import { getCategories, getHelp, getPages, getProducts } from "@/lib/api";
import { SITE_URL } from "@/lib/config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, products, pages, help] = await Promise.all([getCategories(), getProducts({ pageSize: "100" }).catch(() => null), getPages(), getHelp()]);
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/san-pham`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/thiet-ke`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/mau-in-san`, changeFrequency: "weekly", priority: 0.8 },
    ...cats.map((c) => ({ url: `${SITE_URL}/danh-muc/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...pages.map((p) => ({ url: `${SITE_URL}/trang/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.3 })),
    { url: `${SITE_URL}/ho-tro`, changeFrequency: "weekly", priority: 0.4 },
    ...help.items.map((a) => ({ url: `${SITE_URL}/ho-tro/${a.slug}`, lastModified: a.updatedAt, changeFrequency: "monthly" as const, priority: 0.3 })),
    ...(products?.items ?? []).map((p) => ({ url: `${SITE_URL}/san-pham/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
