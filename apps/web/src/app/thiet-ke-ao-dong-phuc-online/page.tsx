import type { Metadata } from "next";
import Link from "next/link";
import { findDesignHub, GARMENT_PRODUCT } from "@pod/shared";
import { SITE_URL } from "@/lib/config";
import { basicPrices } from "@/lib/basic-prices";
import { ReadyDesignCard } from "@/components/designs/ReadyDesignCard";
import { DesignFonts } from "@/components/designs/DesignFonts";
import { TeamLineup } from "@/components/group/TeamLineup";
import { GroupSteps } from "@/components/landing/GroupHero";
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
      <section className="border-b border-line bg-cream">
        <div className="container-site grid items-center gap-8 py-8 md:grid-cols-[1.1fr_1fr] md:py-12">
          <div>
            <nav className="text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-ink">
                Trang chủ
              </Link>{" "}
              / <span className="text-ink">Thiết kế áo đồng phục online</span>
            </nav>
            <h1 className="mt-3 font-display text-[clamp(28px,3.8vw,46px)] font-bold leading-[1.15] tracking-[-0.02em] [text-wrap:balance]">Thiết kế áo đồng phục công ty online – xem mockup ngay</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink/80 md:text-lg">
              Đặt logo, đổi màu áo, thêm tên phòng ban và tên từng nhân viên – mọi thay đổi hiện ngay trên mockup áo thật. Miễn phí, chốt mẫu xong gửi một link cho nhân viên tự ghi size.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href={`${STUDIO}?preset=dong-phuc-cong-ty-1&back=${PATH}`} className="btn-primary px-6">
                Bắt đầu với mẫu đồng phục
              </Link>
              <Link href={`${STUDIO}?back=${PATH}`} className="btn-outline bg-white px-6">
                Thiết kế từ áo trắng
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-sky/60 px-3 py-4 shadow-sticker md:p-6">
            <TeamLineup team="CÔNG TY BẠN" color="navy" people={[{ name: "SALES" }, { name: "KỸ THUẬT" }, { name: "MARKETING" }]} />
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
            <h2 className="h-section">Bắt đầu từ mẫu đồng phục công ty</h2>
            <Link href="/mau-dong-phuc-cong-ty" className="text-[15px] font-semibold underline underline-offset-4 hover:text-brand-dark">
              Xem tất cả mẫu đồng phục công ty
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
        <div className="container-site grid gap-4 md:grid-cols-2">
          <Link href="/dong-phuc-ao-thun" className="block rounded-2xl border border-line bg-white p-5 transition hover:border-ink">
            <p className="text-sm font-semibold text-brand-dark">Giá & mẫu</p>
            <h2 className="mt-1 text-lg font-bold">Đồng phục áo thun in theo yêu cầu</h2>
            <p className="mt-1 text-[15px] text-ink/80">Bảng giá theo số lượng, 6 màu áo, mẫu có sẵn cho công ty, lớp, nhóm.</p>
          </Link>
          <Link href="/mau-danh-sach-in-ao" className="block rounded-2xl border border-line bg-white p-5 transition hover:border-ink">
            <p className="text-sm font-semibold text-brand-dark">Cho HR</p>
            <h2 className="mt-1 text-lg font-bold">File Excel danh sách tên – size nhân viên</h2>
            <p className="mt-1 text-[15px] text-ink/80">Tải file mẫu, điền tên và size, tải lên là ra đơn.</p>
          </Link>
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
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
