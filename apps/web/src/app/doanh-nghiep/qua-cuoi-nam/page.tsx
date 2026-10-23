import type { Metadata } from "next";
import Link from "next/link";
import { B2B_BUDGETS } from "@pod/shared";
import { getProducts, getSettings } from "@/lib/api";
import { ProductGrid, priceLabelOf } from "@/components/shop/ProductCard";
import { AddToQuote } from "@/components/b2b/AddToQuote";
import { pastel } from "@/lib/pastel";
import { SITE_URL } from "@/lib/config";

export const revalidate = 300;

const PATH = "/doanh-nghiep/qua-cuoi-nam";
const DIP = "qua-tet";
const LIST = `/doanh-nghiep/san-pham?dip=${DIP}`;
const QUOTE = `/doanh-nghiep?dip=${DIP}#bao-gia`;

export const metadata: Metadata = {
  title: "Quà tặng nhân viên cuối năm, quà Tết doanh nghiệp in logo",
  description:
    "Quà Tết doanh nghiệp in logo cho nhân viên, đối tác, khách hàng: bình giữ nhiệt, sổ tay, lịch Tết, hộp quà. Chọn theo ngân sách mỗi phần quà, mockup logo miễn phí, xuất hoá đơn VAT, giao nhiều chi nhánh.",
  alternates: { canonical: PATH },
};

// điều kiện khớp mặc định CMS (b2bHub.terms) – không hứa thời gian cụ thể cho quà nhiều món
const FAQ = [
  { q: "Quà Tết doanh nghiệp đặt tối thiểu bao nhiêu phần?", a: "Áo, túi in theo thiết kế: đơn nhóm từ 10. Quà tặng khác theo số lượng tối thiểu ghi trên từng sản phẩm. Quà nhiều món hoặc cần đóng hộp: gửi yêu cầu để YALA báo giá theo số lượng." },
  { q: "Chọn quà tặng nhân viên cuối năm theo ngân sách thế nào?", a: "Lọc sản phẩm theo ngân sách mỗi phần quà (dưới 50.000đ đến trên 500.000đ), hoặc gửi tổng ngân sách và số người nhận – YALA đề xuất bộ quà phù hợp." },
  { q: "Có xem logo trên quà trước khi đặt không?", a: "Có, miễn phí. YALA gửi mockup logo trên từng sản phẩm, chỉnh đến khi duyệt mới sản xuất." },
  { q: "Bao lâu thì nhận được quà Tết in logo?", a: "Đơn áo in đặt online sản xuất trong 2–4 ngày. Quà tặng số lượng lớn hoặc đóng hộp: báo thời gian theo từng dự án – nên chốt sớm vì sát Tết xưởng và vận chuyển đều dồn đơn." },
  { q: "Có xuất hoá đơn VAT và giao nhiều chi nhánh không?", a: "Có. YALA xuất hoá đơn điện tử cho doanh nghiệp, giao một điểm hoặc chia nhiều chi nhánh theo danh sách." },
];

/** Trang tĩnh cho từ khoá "quà tặng nhân viên cuối năm", "quà Tết doanh nghiệp in logo" – thay URL ?dip=qua-tet yếu SEO */
export default async function YearEndGiftsPage() {
  const s = await getSettings();
  const sol = s.b2bHub.solutions.find((x) => x.key === DIP);
  const data = await getProducts({ b2b: "1", dip: DIP, pageSize: "8" }).catch(() => null);
  const items = data?.items ?? [];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Doanh nghiệp", item: `${SITE_URL}/doanh-nghiep` },
        { "@type": "ListItem", position: 3, name: "Quà cuối năm", item: `${SITE_URL}${PATH}` },
      ],
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-line bg-cream">
        <div className="container-site py-8 md:py-12">
          <nav className="text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink">Trang chủ</Link> / <Link href="/doanh-nghiep" className="hover:text-ink">Doanh nghiệp</Link> /{" "}
            <span className="text-ink">Quà cuối năm</span>
          </nav>
          <h1 className="mt-3 max-w-3xl font-display text-[clamp(28px,3.8vw,46px)] font-bold leading-[1.15] tracking-[-0.02em] [text-wrap:balance]">
            Quà tặng nhân viên cuối năm, quà Tết doanh nghiệp in logo
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/80 md:text-lg">
            {sol?.desc ?? "Hộp quà Tết in logo cho nhân viên, đối tác, khách hàng – chọn theo ngân sách từng người."} Mockup logo miễn phí, xuất hoá đơn VAT, giao một hoặc nhiều chi nhánh.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href={QUOTE} className="btn-primary px-6">Nhận báo giá quà Tết</Link>
            <Link href={LIST} className="btn-outline bg-white px-6">Xem tất cả quà gợi ý</Link>
          </div>
        </div>
      </section>

      {/* Chọn theo ngân sách mỗi phần quà */}
      <section className="py-10 md:py-14">
        <div className="container-site">
          <p className="eyebrow">Theo ngân sách</p>
          <h2 className="h-section mt-1.5">Ngân sách mỗi phần quà là bao nhiêu?</h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {B2B_BUDGETS.map((b, i) => (
              <li key={b.key}>
                <Link href={`${LIST}&ngan-sach=${b.key}`} className={`block h-full rounded-2xl border border-line p-4 shadow-sticker-sm transition hover:-translate-y-0.5 ${pastel(i)}`}>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-ink/60">Mỗi phần</p>
                  <p className="mt-1 text-lg font-extrabold leading-tight">{b.label}</p>
                </Link>
              </li>
            ))}
          </ul>
          {sol?.items && <p className="mt-4 text-[15px] text-muted">Hay được chọn: {sol.items}</p>}
        </div>
      </section>

      {/* Sản phẩm gợi ý */}
      <section className="border-t border-line bg-surface py-10 md:py-14">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="h-section">Quà Tết in logo gợi ý</h2>
            {items.length > 0 && (
              <Link href={LIST} className="text-sm font-semibold underline underline-offset-4 hover:text-brand">
                Xem tất cả{data && data.total > items.length ? ` ${data.total} sản phẩm` : ""} →
              </Link>
            )}
          </div>
          {items.length ? (
            <div className="mt-6">
              <ProductGrid
                items={items}
                after={(x) => (
                  <AddToQuote
                    variant="compact"
                    quantity={Math.max(x.minQty ?? 1, s.b2bQuote.threshold)}
                    product={{ id: x.id, slug: x.slug, name: x.name, image: x.images[0] ?? "", priceLabel: priceLabelOf(x) }}
                  />
                )}
              />
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-white p-8 text-center">
              <p className="text-lg font-semibold">Đang cập nhật quà Tết 2027</p>
              <p className="mx-auto mt-1 max-w-md text-[15px] text-muted">Gửi số người nhận và ngân sách – YALA đề xuất bộ quà và gửi mockup logo miễn phí.</p>
              <Link href={QUOTE} className="btn-primary mt-4">Nhận tư vấn</Link>
            </div>
          )}
          <p className="mt-6 text-sm text-muted">
            Giá hiển thị là giá lẻ tham khảo. Từ {s.b2bQuote.threshold} sản phẩm, quà nhiều món hoặc cần đóng hộp: bấm “+ Thêm vào báo giá” rồi{" "}
            <Link href="/doanh-nghiep/bao-gia" className="font-semibold text-ink underline underline-offset-4">gửi 1 yêu cầu</Link>.
          </p>
        </div>
      </section>

      {/* Hỏi đáp */}
      <section className="border-t border-line py-10 md:py-14">
        <div className="container-site max-w-3xl">
          <h2 className="h-section">Câu hỏi về quà Tết doanh nghiệp</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[16px] font-semibold">
                  {f.q}
                  <span className="mt-0.5 text-xl leading-none text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/80">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[15px] font-semibold">
            <Link href={QUOTE} className="text-brand hover:underline">Gửi yêu cầu báo giá →</Link>
            <Link href="/dip/tet-2027" className="underline underline-offset-4 hover:text-brand">Áo gia đình Tết 2027</Link>
            <Link href="/doanh-nghiep" className="underline underline-offset-4 hover:text-brand">Giải pháp doanh nghiệp khác</Link>
          </div>
        </div>
      </section>
    </>
  );
}
