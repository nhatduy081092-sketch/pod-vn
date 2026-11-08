import type { Metadata } from "next";
import Link from "next/link";
import { findDesignHub, GARMENT_PRODUCT } from "@pod/shared";
import { SITE_URL } from "@/lib/config";
import { basicPrices } from "@/lib/basic-prices";
import { ReadyDesignCard } from "@/components/designs/ReadyDesignCard";
import { DesignFonts } from "@/components/designs/DesignFonts";
import { TeamLineup } from "@/components/group/TeamLineup";
import { HomeSteps, rise } from "@/components/landing/HomeSections";
import { MaskTitle } from "@/components/motion/MaskTitle";
import { Faq, h2Big, rowLink, Arrow } from "@/components/seo/SeoBlocks";
import { hubDesigns } from "@/components/seo/HubPage";
import { TOOL_LINKS } from "@/components/seo/ToolLinks";

export const revalidate = 600;
const PATH = "/thiet-ke-ao-dong-phuc-online";
const title = "Thiết kế áo đồng phục công ty online miễn phí – xem mockup ngay";
const description =
  "Thiết kế áo đồng phục công ty, áo đồng phục văn phòng online: tải logo, đặt logo ngực trái, thêm tên phòng ban, tên từng nhân viên, đổi màu áo xem mockup ngay. Gửi 1 link cho nhân viên tự ghi size. Không cần cài phần mềm.";
export const metadata: Metadata = { title: { absolute: `${title} | YALA` }, description, alternates: { canonical: PATH }, openGraph: { title, description } };

const STUDIO = `/thiet-ke/${GARMENT_PRODUCT.tshirt.slug}`;
const FEATURES = [
  { t: "Logo công ty đúng vị trí", d: "Tải logo PNG, đặt ngực trái hoặc giữa ngực, thêm mặt sau; Studio báo khi ảnh logo không đủ nét để in." },
  { t: "Chữ tiếng Việt nhiều font", d: "Gõ có dấu, đổi font, màu, cỡ, uốn cong; chữ tự co vừa vùng in." },
  { t: "Tên nhân viên, phòng ban", d: "Một thiết kế chung, mỗi áo in đúng tên từng nhân viên – xem trước từng áo trước khi đặt." },
  { t: "Đúng màu nhận diện", d: "Nhập mã màu thương hiệu cho chữ; 6 màu áo trắng, đen, kem, xám, navy, hồng – đổi màu xem mockup ngay." },
  { t: "Xoá nền logo", d: "Logo nền trắng? Xoá nền ngay trên máy, không cần Photoshop." },
  { t: "Dùng tốt trên điện thoại", d: "Thiết kế bằng điện thoại, không cần cài phần mềm." },
];
const FAQ = [
  { q: "Thiết kế áo đồng phục công ty trên YALA có mất phí không?", a: "Không. Thiết kế miễn phí; công ty chỉ trả tiền khi đặt in." },
  { q: "Có cần tài khoản hoặc cài phần mềm không?", a: "Không cần cài phần mềm, thiết kế tự lưu nháp trên máy. Đăng nhập nếu muốn lưu thiết kế vào tài khoản để mở lại ở máy khác." },
  { q: "In tên từng nhân viên như thế nào?", a: "Chọn mẫu có ô tên (hoặc thêm ô tên trong mục Chữ). Khi đặt theo nhóm, mỗi áo in đúng tên một nhân viên – không tính thêm phí." },
  { q: "Thu size cả công ty ra sao?", a: "Bấm Hoàn tất → “Tạo link gom đơn nhóm” và gửi vào nhóm chat công ty, hoặc điền file Excel mẫu danh sách in áo rồi tải lên. HR xem danh sách đếm sẵn theo size và đặt một đơn." },
  { q: "Có xuất hoá đơn, báo giá cho đơn lớn không?", a: "Ghi thông tin xuất hoá đơn khi đặt hàng. Đơn lớn, nhiều món hoặc cần polo, sơ mi: gửi yêu cầu báo giá ở trang Doanh nghiệp." },
  { q: "Đặt tối thiểu bao nhiêu áo?", a: "Đơn nhóm từ 10 sản phẩm. Ít hơn vẫn đặt được, tính như mua lẻ." },
];

/** Công thức 2: trang công cụ – từ khoá "thiết kế áo đồng phục công ty" (12.100 lượt/tháng, Sonatools 10/2026) */
export default async function Page() {
  const hub = findDesignHub("mau-dong-phuc-cong-ty")!;
  const designs = hubDesigns(hub).slice(0, 8);
  const prices = await basicPrices();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "YALA Studio – thiết kế áo đồng phục online",
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
              / <span className="text-ink">Thiết kế áo đồng phục online</span>
            </nav>
            <h1 className="mt-4 font-display text-[clamp(34px,4.4vw,62px)] font-bold leading-[1.04] tracking-[-0.035em] [text-wrap:balance]">Thiết kế áo đồng phục công ty online – xem mockup ngay</h1>
            <p className="mt-5 max-w-[34rem] text-lg leading-relaxed md:text-xl">
              Đặt logo, đổi màu áo, thêm tên phòng ban và tên từng nhân viên – mọi thay đổi hiện ngay trên mockup áo thật. Miễn phí, chốt mẫu xong gửi một link cho nhân viên tự ghi size.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`${STUDIO}?preset=dong-phuc-cong-ty-1&back=${PATH}`} className="btn-primary px-6">
                Bắt đầu với mẫu đồng phục
              </Link>
              <Link href={`${STUDIO}?back=${PATH}`} className="btn-outline bg-white px-6">
                Thiết kế từ áo trắng
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-sky/60 px-3 py-4 shadow-sticker md:p-6" {...rise(1)}>
            <TeamLineup team="CÔNG TY BẠN" color="navy" people={[{ name: "SALES" }, { name: "KỸ THUẬT" }, { name: "MARKETING" }]} />
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
            <h2 className={h2Big}>Bắt đầu từ mẫu đồng phục công ty</h2>
            <Link href="/mau-dong-phuc-cong-ty" className="text-[15px] font-semibold underline underline-offset-4 hover:text-brand-dark">
              Xem tất cả mẫu đồng phục công ty
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
        <div className="container-site grid gap-4 md:grid-cols-2">
          <Link href="/dong-phuc-ao-thun" className="group block rounded-lg bg-white p-6 transition-colors hover:bg-ink hover:text-white">
            <p className="text-sm font-semibold text-brand-dark group-hover:text-brand">Giá & mẫu</p>
            <h2 className="mt-1 text-xl font-bold">Đồng phục áo thun in theo yêu cầu</h2>
            <p className="mt-1.5 text-[15px] opacity-80">Bảng giá theo số lượng, 6 màu áo, mẫu có sẵn cho công ty, lớp, nhóm.</p>
          </Link>
          <Link href="/mau-danh-sach-in-ao" className="group block rounded-lg bg-white p-6 transition-colors hover:bg-ink hover:text-white">
            <p className="text-sm font-semibold text-brand-dark group-hover:text-brand">Cho HR</p>
            <h2 className="mt-1 text-xl font-bold">File Excel danh sách tên – size nhân viên</h2>
            <p className="mt-1.5 text-[15px] opacity-80">Tải file mẫu, điền tên và size, tải lên là ra đơn.</p>
          </Link>
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
