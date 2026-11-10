import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/lib/api";
import { GIFT_GROUPS, type GiftCandidate, type GiftGroup } from "@/lib/gift-set";
import { priceLabelOf } from "@/components/shop/ProductCard";
import { GiftSetStudio } from "@/components/b2b/GiftSetStudio";

export const metadata: Metadata = {
  title: "Xem logo trên cả bộ quà",
  description: "Tải logo một lần, xem ngay trên áo, bình giữ nhiệt, ly, sổ tay, bút, túi… rồi gửi cả bộ để nhận báo giá kèm mockup.",
  // trang công cụ mới: chưa cho Google lập chỉ mục cho tới khi chủ shop duyệt nội dung SEO
  robots: { index: false, follow: true },
};

/** Mỗi nhóm lấy tối đa 8 mẫu thật từ danh mục (gộp các nguồn theo thứ tự, lọc theo tên, bỏ trùng), mẫu "prefer" lên đầu */
async function candidates(g: GiftGroup): Promise<GiftCandidate[]> {
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

export default async function GiftSetPage() {
  const groups = (
    await Promise.all(GIFT_GROUPS.map(async (g) => ({ key: g.key, label: g.label, on: g.on, items: await candidates(g) })))
  ).filter((g) => g.items.length);
  return (
    <div className="container-site py-5 md:py-8">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Trang chủ</Link> / <Link href="/doanh-nghiep" className="hover:text-ink">Doanh nghiệp</Link> /{" "}
        <span className="text-ink">Xem logo trên cả bộ quà</span>
      </nav>
      <h1 className="mt-3 max-w-4xl text-[32px] font-bold leading-[1.1] tracking-tight md:text-[48px]">Một logo, xem ngay trên cả bộ quà</h1>
      <p className="mt-3 max-w-2xl text-[16px] text-muted md:text-[17px]">
        Tải logo một lần – YALA đặt lên áo, bình, ly, sổ, bút, túi để bạn so cả bộ, tải ảnh trình duyệt nội bộ và gửi một yêu cầu báo giá cho tất cả.
      </p>
      <div className="mt-6 md:mt-8">
        <GiftSetStudio groups={groups} />
      </div>
    </div>
  );
}
