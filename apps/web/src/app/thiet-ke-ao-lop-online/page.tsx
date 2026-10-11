import type { Metadata } from "next";
import Link from "next/link";
import { CLASS_SLOGANS, findDesignHub, GARMENT_PRODUCT } from "@pod/shared";
import { SITE_URL } from "@/lib/config";
import { basicPrices } from "@/lib/basic-prices";
import { ReadyDesignCard } from "@/components/designs/ReadyDesignCard";
import { DesignFonts } from "@/components/designs/DesignFonts";
import { TeamLineup } from "@/components/group/TeamLineup";
import { GroupSteps } from "@/components/landing/GroupHero";
import { hubDesigns } from "@/components/seo/HubPage";
import { phraseHref } from "@/components/seo/PhrasePage";
import { TOOL_LINKS } from "@/components/seo/ToolLinks";

export const revalidate = 600;
const PATH = "/thiet-ke-ao-lop-online";
const title = "Thiết kế áo lớp online miễn phí – in tên từng bạn, cả lớp tự ghi size";
const description =
  "Tự thiết kế áo lớp, áo kỷ yếu online ngay trên trình duyệt: thêm tên lớp, logo, slogan, ô tên từng bạn, đổi màu áo xem ngay. Gửi 1 link cho cả lớp tự ghi size. Không cần cài phần mềm.";
export const metadata: Metadata = { title: { absolute: `${title} | YALA` }, description, alternates: { canonical: PATH }, openGraph: { title, description } };

const STUDIO = `/thiet-ke/${GARMENT_PRODUCT.tshirt.slug}`;
const FEATURES = [
  { t: "Tên lớp, logo, ảnh tập thể", d: "Tải ảnh, logo lớp lên áo; khung ghép ảnh có sẵn cho ảnh cả lớp." },
  { t: "Chữ tiếng Việt nhiều font", d: "Gõ có dấu, đổi font, màu, cỡ, uốn cong; chữ tự co vừa vùng in." },
  { t: "Ô tên / số từng bạn", d: "Một thiết kế chung, mỗi áo in đúng tên một bạn – xem trước từng áo." },
  { t: "Đổi màu áo xem ngay", d: "6 màu áo: trắng, đen, kem, xám, navy, hồng – xem mẫu trên áo thật." },
  { t: "Xoá nền ảnh, cảnh báo ảnh mờ", d: "Xoá nền ngay trên máy; báo khi ảnh không đủ nét để in." },
  { t: "Dùng tốt trên điện thoại", d: "Thiết kế bằng điện thoại, không cần cài phần mềm." },
];
const FAQ = [
  { q: "Thiết kế áo lớp trên YALA có mất phí không?", a: "Không. Thiết kế miễn phí; bạn chỉ trả tiền khi đặt in." },
  { q: "Có cần tài khoản hoặc cài phần mềm không?", a: "Không cần cài phần mềm, thiết kế tự lưu nháp trên máy. Đăng nhập nếu muốn lưu thiết kế vào tài khoản để mở lại ở máy khác." },
  { q: "In tên từng bạn như thế nào?", a: "Chọn mẫu có ô tên (hoặc thêm ô tên trong mục Chữ). Khi đặt theo nhóm, mỗi áo in đúng tên từng bạn – không tính thêm phí." },
  { q: "Cả lớp chọn size ra sao?", a: "Bấm Hoàn tất → “Tạo link gom đơn nhóm”, gửi link vào nhóm lớp. Mỗi bạn tự ghi tên, size; lớp trưởng xem danh sách và đặt một đơn." },
  { q: "Đặt tối thiểu bao nhiêu áo?", a: "Đơn nhóm từ 10 sản phẩm. Ít hơn vẫn đặt được, tính như mua lẻ." },
];

/** Công thức 2: trang công cụ – vào là thiết kế được ngay */
export default async function Page() {
  const hub = findDesignHub("mau-ao-lop")!;
  const designs = hubDesigns(hub).slice(0, 8);
  const prices = await basicPrices();
  const slogans = CLASS_SLOGANS.flatMap((g) => g.items.slice(0, 2)).slice(0, 8);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "YALA Studio – thiết kế áo lớp online",
      url: `${SITE_URL}${PATH}`,
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      inLanguage: "vi",
      offers: { "@type": "Offer", price: 0, priceCurrency: "VND" },
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DesignFonts designs={designs} />
      <section className="border-b border-line bg-cream">
        <div className="container-site grid items-center gap-8 py-8 md:grid-cols-[1.1fr_1fr] md:py-12">
          <div>
            <nav className="text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-ink">
                Trang chủ
              </Link>{" "}
              / <span className="text-ink">Thiết kế áo lớp online</span>
            </nav>
            <h1 className="mt-3 font-display text-[clamp(28px,3.8vw,46px)] font-bold leading-[1.15] tracking-[-0.02em] [text-wrap:balance]">Thiết kế áo lớp online miễn phí – in tên từng bạn</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink/80 md:text-lg">
              Làm áo lớp, áo kỷ yếu ngay trên trình duyệt: tên lớp, slogan, logo, ảnh tập thể và ô tên từng bạn. Xong gửi một link cho cả lớp tự ghi size.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href={`${STUDIO}?preset=ao-lop-1&back=${PATH}`} className="btn-primary px-6">
                Bắt đầu với mẫu áo lớp
              </Link>
              <Link href={`${STUDIO}?back=${PATH}`} className="btn-outline bg-white px-6">
                Thiết kế từ áo trắng
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-sky/60 px-3 py-4 shadow-sticker md:p-6">
            <TeamLineup team="12A1 · 2026" color="trang" people={[{ name: "HÀ" }, { name: "KHOA" }, { name: "VY" }]} />
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container-site">
          <h2 className="h-section">Làm được gì trong YALA Studio</h2>
          <ul className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.t} className="border-l-2 border-brand pl-4">
                <h3 className="text-lg font-bold">{f.t}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink/80">{f.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <GroupSteps />

      <section className="py-10 md:py-14">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="h-section">Bắt đầu từ mẫu áo lớp</h2>
            <Link href="/mau-ao-lop" className="text-[15px] font-semibold underline underline-offset-4 hover:text-brand-dark">
              Xem tất cả mẫu áo lớp
            </Link>
          </div>
          <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {designs.map((d) => (
              <li key={d.slug}>
                <ReadyDesignCard d={d} back={PATH} price={prices[d.garment]} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line bg-surface/60 py-10 md:py-14">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="h-section">Chưa nghĩ ra slogan?</h2>
            <Link href="/slogan-ao-lop" className="text-[15px] font-semibold underline underline-offset-4 hover:text-brand-dark">
              Xem tất cả slogan áo lớp
            </Link>
          </div>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {slogans.map((t) => (
              <li key={t} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3">
                <span className="font-semibold">{t}</span>
                <Link href={phraseHref(t, PATH)} prefetch={false} className="shrink-0 text-sm font-semibold text-brand-dark underline underline-offset-4">
                  Dùng
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line py-10 md:py-14">
        <div className="container-site max-w-3xl">
          <h2 className="h-section">Câu hỏi thường gặp</h2>
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
        </div>
      </section>

      <section className="bg-cream py-10">
        <div className="container-site">
          <h2 className="text-xl font-bold">Công cụ miễn phí khác</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TOOL_LINKS.filter((l) => l.href !== PATH).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block h-full rounded-xl border border-line bg-white p-4 transition hover:border-ink">
                  <p className="font-semibold">{l.title}</p>
                  <p className="mt-1 text-sm text-muted">{l.desc}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
