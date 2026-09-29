import { prisma } from "@pod/db";
import { DEFAULT_PAGES, PAGE_KEY_PREFIX, type ContentPage } from "@pod/shared";

/** Gộp trang mặc định + trang đã lưu trong CMS (bản lưu ghi đè bản mặc định cùng slug) */
export async function listPages(): Promise<ContentPage[]> {
  const rows = await prisma.setting.findMany({ where: { key: { startsWith: PAGE_KEY_PREFIX } } });
  const map = new Map<string, ContentPage>(DEFAULT_PAGES.map((p) => [p.slug, p]));
  for (const r of rows) {
    const slug = r.key.slice(PAGE_KEY_PREFIX.length);
    map.set(slug, { ...(map.get(slug) ?? {}), ...(r.value as Omit<ContentPage, "slug">), slug } as ContentPage);
  }
  return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPage(slug: string): Promise<ContentPage | null> {
  return (await listPages()).find((p) => p.slug === slug) ?? null;
}
