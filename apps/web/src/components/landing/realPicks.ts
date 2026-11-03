import { isAiImage } from "@pod/shared";
import { getProducts } from "@/lib/api";
import type { ProductCardData } from "@/lib/types";

/**
 * Sản phẩm thật cho màn đầu trang chủ (đầu trang + 4 lối vào nhóm khách): chỉ ảnh chụp sản phẩm có trong danh mục,
 * không ảnh AI, không ảnh phôi /blanks. Ưu tiên đúng mẫu đã chọn; mẫu đó bị ẩn/xoá thì lấy mẫu ảnh thật đầu tiên cùng nhóm.
 */
const CATEGORY = "dong-phuc-may-mac";
const HERO = [
  { sub: "ao-thun-polo", slug: "ao-thun-dong-phuc-tay-ngan-phoi-mau-theu-logo" },
  { sub: "ao-so-mi", slug: "ao-so-mi-dong-phuc-tay-dai-theu-logo-2" },
  { sub: "ao-thun-the-thao", slug: "ao-thun-the-thao-co-tron-tay-ngan-10" },
  { sub: "ao-khoac-ao-bao-ho", slug: "ao-khoac-dong-phuc-dong" },
];
const SEGMENT: Record<string, { sub: string; slug: string }> = {
  "doanh-nghiep": { sub: "ao-thun-polo", slug: "ao-thun-polo-tay-ngan-in-logo-nguc" },
  "the-thao": { sub: "ao-thun-the-thao", slug: "ao-thun-the-thao-co-tron-tay-ngan-8" },
  "hoi-nhom": { sub: "ao-thun-polo", slug: "ao-thun-co-tron-tay-ngan-in-lua-freesize" },
  "su-kien": { sub: "ao-thun-the-thao", slug: "ao-thun-the-thao-co-tron-tay-ngan-11" },
};

export type RealPick = { slug: string; name: string; image: string };

export async function getRealPicks(): Promise<{ hero: RealPick[]; segments: Record<string, RealPick> }> {
  const subs = [...new Set([...HERO, ...Object.values(SEGMENT)].map((x) => x.sub))];
  const lists = new Map(
    await Promise.all(
      subs.map(async (sub) => {
        const items = await getProducts({ category: CATEGORY, sub, pageSize: "40" }).then((d) => d.items).catch(() => [] as ProductCardData[]);
        return [sub, items.filter((p) => p.images[0] && !isAiImage(p.images[0]))] as const;
      }),
    ),
  );
  const used = new Set<string>();
  const pick = ({ sub, slug }: { sub: string; slug: string }): RealPick | null => {
    const list = lists.get(sub) ?? [];
    const p = list.find((x) => x.slug === slug && !used.has(x.slug)) ?? list.find((x) => !used.has(x.slug));
    if (!p) return null;
    used.add(p.slug);
    return { slug: p.slug, name: p.name, image: p.images[0]! };
  };
  const hero = HERO.map(pick).filter((x): x is RealPick => !!x);
  const segments: Record<string, RealPick> = {};
  for (const [key, want] of Object.entries(SEGMENT)) {
    const p = pick(want);
    if (p) segments[key] = p;
  }
  return { hero, segments };
}
