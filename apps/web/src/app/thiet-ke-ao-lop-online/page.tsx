import type { Metadata } from "next";
import Link from "next/link";
import { CLASS_SLOGANS, findDesignHub, GARMENT_PRODUCT } from "@pod/shared";
import { SITE_URL } from "@/lib/config";
import { basicPrices } from "@/lib/basic-prices";
import { ReadyDesignCard } from "@/components/designs/ReadyDesignCard";
import { DesignFonts } from "@/components/designs/DesignFonts";
import { TeamLineup } from "@/components/group/TeamLineup";
import { HomeSteps, rise } from "@/components/landing/HomeSections";
import { MaskTitle } from "@/components/motion/MaskTitle";
import { Faq, h2Big, rowLink, Arrow } from "@/components/seo/SeoBlocks";
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
      <section className="bg-surface">
        <div className="container-site grid items-center gap-10 pb-[clamp(56px,9vh,110px)] pt-10 md:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <nav className="text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-ink">
                Trang chủ
              </Link>{" "}
              / <span className="text-ink">Thiết kế áo lớp online</span>
            </nav>
            <h1 className="mt-4 font-display text-[clamp(34px,4.4vw,62px)] font-bold leading-[1.04] tracking-[-0.035em] [text-wrap:balance]">Thiết kế áo lớp online miễn phí – in tên từng bạn</h1>
            <p className="mt-5 max-w-[34rem] text-lg leading-relaxed md:text-xl">
              Làm áo lớp, áo kỷ yếu ngay trên trình duyệt: tên lớp, slogan, logo, ảnh tập thể và ô tên từng bạn. Xong gửi một link cho cả lớp tự ghi size.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`${STUDIO}?preset=ao-lop-1&back=${PATH}`} className="btn-primary px-6">
                Bắt đầu với mẫu áo lớp
              </Link>
              <Link href={`${STUDIO}?back=${PATH}`} className="btn-outline bg-white px-6">
                Thiết kế từ áo trắng
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-sky/60 px-3 py-4 shadow-sticker md:p-6" {...rise(1)}>
            <TeamLineup team="12A1 · 2026" color="trang" people={[{ name: "HÀ" }, { name: "KHOA" }, { name: "VY" }]} />
          </div>
        </div>
      </section>

      <section className="py-[clamp(72px,12vh,150px)]">
        <div className="container-site">
          <MaskTitle className={h2Big}>Làm được gì trong YALA Studio</MaskTitle>
          <ul className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <li key={f.t} {...rise(i % 3)}>
                <span className="draw-rule mb-5 w-12 bg-brand" aria-hidden />
                <h3 className="text-xl font-bold leading-snug">{f.t}</h3>
                <p className="mt-2 text-base leading-relaxed">{f.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <HomeSteps />

      <section className="py-[clamp(72px,12vh,150px)]">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <h2 className={h2Big}>Bắt đầu từ mẫu áo lớp</h2>
            <Link href="/mau-ao-lop" className="text-[15px] font-semibold underline underline-offset-4 hover:text-brand-dark">
              Xem tất cả mẫu áo lớp
            </Link>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:mt-12 md:gap-x-6 lg:grid-cols-4">
            {designs.map((d, i) => (
              <li key={d.slug} {...rise(i % 4)}>
                <ReadyDesignCard d={d} back={PATH} price={prices[d.garment]} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-surface py-[clamp(56px,9vh,110px)]">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="h-section">Chưa nghĩ ra slogan?</h2>
            <Link href="/slogan-ao-lop" className="text-[15px] font-semibold underline underline-offset-4 hover:text-brand-dark">
              Xem tất cả slogan áo lớp
            </Link>
          </div>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {slogans.map((t, i) => (
              <li key={t} className="flex items-center justify-between gap-3 rounded-lg bg-white px-5 py-4" {...rise(i % 4)}>
                <span className="text-[17px] font-semibold leading-snug">{t}</span>
                <Link href={phraseHref(t, PATH)} prefetch={false} className="shrink-0 text-sm font-semibold text-brand-dark underline underline-offset-4">
                  Dùng
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Faq items={FAQ} />

      <section className="container-site pb-[clamp(72px,12vh,150px)]">
        <h2 className="h-section">Công cụ miễn phí khác</h2>
        <ul className="mt-6 grid gap-2 md:grid-cols-2">
          {TOOL_LINKS.filter((l) => l.href !== PATH).map((l, i) => (
            <li key={l.href} {...rise(i % 2)}>
              <Link href={l.href} className={`${rowLink} h-full`}>
                <span>
                  <span className="block text-lg font-semibold">{l.title}</span>
                  <span className="mt-0.5 block text-[15px] opacity-80">{l.desc}</span>
                </span>
                <Arrow />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
