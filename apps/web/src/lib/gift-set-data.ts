/** Dữ liệu "bộ quà" phía server: lấy mẫu thật từ CMS cho từng nhóm trong GIFT_GROUPS */
import { getProducts } from "@/lib/api";
import { GIFT_GROUPS, type GiftCandidate, type GiftGroup } from "@/lib/gift-set";
import { priceLabelOf } from "@/components/shop/ProductCard";

/** Mỗi nhóm lấy tối đa 8 mẫu thật từ danh mục (gộp các nguồn theo thứ tự, lọc theo tên, bỏ trùng), mẫu "prefer" lên đầu */
export async function candidates(g: GiftGroup): Promise<GiftCandidate[]> {
  const pages = await Promise.all(
    g.sources.map(async (s) => {
      const res = await getProducts({ category: s.category, sub: s.sub, q: s.q, pageSize: "8" }).catch(() => null);
      const re = s.match ? new RegExp(s.match, "i") : null;
      return (res?.items ?? []).filter((p) => !re || re.test(p.name));
    }),
  );
  const rank = (slug: string) => {
    const i = g.prefer?.indexOf(slug) ?? -1;
    return i < 0 ? 99 : i; // không dùng Infinity: Infinity - Infinity = NaN làm sort sai
  };
  const seen = new Set<string>();
  const all: GiftCandidate[] = [];
  for (const p of pages.flat()) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    all.push({ id: p.id, slug: p.slug, name: p.name, image: p.images[0] ?? "", priceLabel: priceLabelOf(p) });
  }
  // sort ổn định: mẫu ưu tiên lên đầu, còn lại giữ thứ tự danh mục
  return all.sort((a, b) => rank(a.slug) - rank(b.slug)).slice(0, 8);
}

/** Các nhóm kèm mẫu (bỏ nhóm rỗng); keys = chỉ lấy các nhóm này, theo thứ tự đưa vào */
export async function giftGroupsWithItems(keys?: string[]) {
  const picked = keys ? keys.map((k) => GIFT_GROUPS.find((g) => g.key === k)).filter((g): g is GiftGroup => !!g) : GIFT_GROUPS;
  const groups = await Promise.all(picked.map(async (g) => ({ key: g.key, label: g.label, on: g.on, items: await candidates(g) })));
  return groups.filter((g) => g.items.length);
}
