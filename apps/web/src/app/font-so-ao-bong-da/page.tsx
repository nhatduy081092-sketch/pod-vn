import type { Metadata } from "next";
import Link from "next/link";
import { DESIGN_COLLECTIONS, effectiveBasePrice, GARMENT_PRODUCT, type NumberFont } from "@pod/shared";
import { getProduct } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { DesignFonts } from "@/components/designs/DesignFonts";
import { ReadyDesignCard, readyDesignHref } from "@/components/designs/ReadyDesignCard";
import { rise } from "@/components/landing/HomeSections";
import { NumberFontTry } from "@/components/seo/NumberFontTry";
import { Arrow, Breadcrumb, Faq, h2Big, rowLink } from "@/components/seo/SeoBlocks";
import { TOOL_LINKS } from "@/components/seo/ToolLinks";

export const revalidate = 600;

const PATH = "/font-so-ao-bong-da";
const designs = DESIGN_COLLECTIONS.find((c) => c.slug === "font-so")?.designs ?? [];
const title = `Font số áo bóng đá – ${designs.length} kiểu số in áo đội, gõ số để xem trước`;
const description = `So ${designs.length} font số áo bóng đá YALA đang in: Anton, Oswald, Montserrat, kiểu cổ điển, bo tròn, retro. Gõ số và tên để xem trước, bấm một lần là mở mẫu áo đội.`;
export const metadata: Metadata = { title: { absolute: `${title} | YALA` }, description, alternates: { canonical: PATH }, openGraph: { title, description } };

/** Lời tả từng font – chỉ các font có trong YALA Studio (thứ tự = thứ tự mẫu trong bộ "font-so") */
const NOTES: Record<NumberFont, { label: string; note: string }> = {
  Anton: { label: "Anton", note: "Cao, đậm, hẹp – kiểu số áo đấu quen thuộc; số 2 chữ số vẫn to." },
  Oswald: { label: "Oswald", note: "Cao, gọn, nét vừa – hiện đại, dễ đọc từ xa." },
  Montserrat: { label: "Montserrat", note: "Tròn, rộng – hợp áo tập, áo đội công ty." },
  "Be Vietnam Pro": { label: "Be Vietnam Pro", note: "Cân đối, dấu tiếng Việt rõ – hợp đội văn phòng." },
  "Playfair Display": { label: "Cổ điển (Playfair)", note: "Có chân, nét thanh đậm – kiểu áo đội retro." },
  Nunito: { label: "Bo tròn (Nunito)", note: "Góc tròn, thân thiện – đội thiếu nhi, gia đình." },
  Lobster: { label: "Retro (Lobster)", note: "Nét liền kiểu chữ ký – áo cổ động, áo kỷ niệm." },
};

const TIPS = [
  { title: "Dễ đọc từ xa trước, đẹp sau", body: "Số áo để trọng tài, đồng đội và người xem nhận ra trên sân. Font đậm, nét dày (Anton, Oswald, Montserrat) đọc rõ hơn font mảnh hay nét viết tay." },
  { title: "Số 2 chữ số: chọn font hẹp", body: "Số như 23, 88 chiếm gần gấp đôi bề ngang. Font cao và hẹp như Anton, Oswald giữ được số to mà không tràn khỏi vùng in." },
  { title: "Màu số tương phản với màu áo", body: "Áo sáng in số màu đậm, áo tối in số màu sáng. Trong Studio, đổi màu áo là chữ tự đổi màu cho dễ đọc – bạn vẫn chỉnh lại được." },
  { title: "Một font cho cả đội", body: "Cả đội dùng chung một font số và một font tên; chỉ số và tên khác nhau. Áo đồng bộ hơn và dễ kiểm tra trước khi in." },
];

const FAQ = [
  { q: "Có in đúng font số của CLB hay giải chuyên nghiệp không?", a: "Không. Font riêng của các CLB, giải đấu là tài sản của họ. YALA dùng font mở có hỗ trợ tiếng Việt – bạn chọn kiểu gần phong cách mong muốn trong 7 font ở trên." },
  { q: "In số và tên khác nhau cho từng người có tính thêm phí không?", a: "Không. Mẫu áo đội có ô số và ô tên: mỗi áo in đúng số, tên của từng người, cùng giá với áo in chung. Bạn xem trước từng áo trước khi đặt." },
  { q: "Đổi font sau khi mở mẫu được không?", a: "Được. Trong YALA Studio, chọn lớp số hoặc lớp tên rồi đổi font, cỡ chữ, màu. Mẫu chỉ là điểm bắt đầu." },
  { q: "Cả đội ghi số, size thế nào?", a: "Sửa mẫu xong bấm Hoàn tất → “Tạo link gom đơn nhóm”, gửi vào nhóm chat của đội. Mỗi người tự ghi tên, số, size; đội trưởng xem danh sách và đặt một đơn chung." },
  { q: "Áo in trên web có phải áo thi đấu không?", a: "Dòng YALA Everyday là áo cotton – hợp áo tập nhẹ, áo CLB, áo cổ động viên. Áo thi đấu vải thun lạnh/mè: gửi yêu cầu báo giá ở trang CLB thể thao." },
];

export default async function Page() {
  const p = await getProduct(GARMENT_PRODUCT.tshirt.slug).catch(() => null);
  const price = p ? { basePrice: effectiveBasePrice(p), compareAtPrice: p.compareAtPrice } : undefined;
  const items = designs.map((d) => {
    const font = (d.template.layers.find((l) => l.type === "text" && l.field === "number") as { font?: NumberFont } | undefined)?.font ?? "Anton";
    return { font, ...NOTES[font], href: readyDesignHref(d, undefined, undefined, PATH), bold: font !== "Anton" && font !== "Lobster" };
  });
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Font số áo bóng đá", item: `${SITE_URL}${PATH}` },
      ],
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DesignFonts designs={designs} />

      {/* Đầu trang: tiêu đề + ô gõ thử số của đội (vật thể chính là chính con số) */}
      <section className="bg-surface" aria-labelledby="font-title">
        <div className="container-site pb-[clamp(56px,9vh,110px)] pt-10 md:pt-16">
          <Breadcrumb name="Font số áo bóng đá" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
            <h1 id="font-title" className="font-display text-[clamp(40px,5vw,76px)] font-bold leading-[1.02] tracking-[-0.035em] [text-wrap:balance]">
              Font số áo bóng đá
            </h1>
            <p className="max-w-[34rem] text-lg leading-relaxed md:text-xl lg:pb-2">
              Gõ số và tên của bạn để so {designs.length} kiểu số YALA đang in. Bấm một kiểu là mở mẫu áo đội có ô số – tên riêng cho từng người.
            </p>
          </div>
          <div className="mt-10 md:mt-14">
            <NumberFontTry items={items} />
          </div>
        </div>
      </section>

      {/* Mẫu thật trên áo: cùng bố cục, mỗi mẫu một font */}
      <section className="container-site py-[clamp(72px,12vh,150px)]" aria-labelledby="mau-title">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
          <h2 id="mau-title" className={h2Big}>
            {designs.length} mẫu áo đội, mỗi mẫu một font số
          </h2>
          <p className="max-w-[34rem] text-base leading-relaxed md:text-lg lg:pb-1">Xem font trên áo thật: tên đội phía trên, số lớn giữa ngực, tên phía dưới. Giá hiển thị là giá áo in 1 mặt trước.</p>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:mt-14 md:gap-x-6 md:gap-y-12 lg:grid-cols-4">
          {designs.map((d, i) => (
            <li key={d.slug} {...rise(i % 4)}>
              <ReadyDesignCard d={d} back={PATH} price={price} />
            </li>
          ))}
        </ul>
      </section>

      {/* Cách chọn */}
      <section className="container-site grid gap-8 pb-[clamp(72px,12vh,150px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16" aria-labelledby="cach-chon">
        <h2 id="cach-chon" className={h2Big}>
          Chọn font số cho đội
        </h2>
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {TIPS.map((t, i) => (
            <div key={t.title} {...rise(i)}>
              <h3 className="text-xl font-bold leading-snug">{t.title}</h3>
              <p className="mt-2 text-base leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Faq items={FAQ} />

      {/* Đi tiếp: mẫu áo đội + công cụ khác */}
      <section className="container-site grid gap-14 pb-[clamp(72px,12vh,150px)] md:grid-cols-2 md:gap-12" aria-label="Mẫu áo đội và công cụ khác">
        <div>
          <h2 className="h-section">Làm áo cho cả đội</h2>
          <ul className="mt-6 space-y-2">
            {[
              { href: "/mau-ao-doi-bong", title: "Mẫu áo đội bóng, CLB", desc: "Tên đội, số và tên từng thành viên – in riêng từng áo." },
              { href: "/dong-phuc-the-thao", title: "Đồng phục CLB thể thao", desc: "Áo thi đấu vải thun lạnh, báo giá theo số lượng." },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={rowLink}>
                  <span>
                    <span className="block text-lg font-semibold">{l.title}</span>
                    <span className="mt-0.5 block text-[15px] opacity-80">{l.desc}</span>
                  </span>
                  <Arrow />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="h-section">Công cụ miễn phí</h2>
          <ul className="mt-6 space-y-2">
            {TOOL_LINKS.filter((l) => l.href !== PATH).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={rowLink}>
                  <span>
                    <span className="block text-lg font-semibold">{l.title}</span>
                    <span className="mt-0.5 block text-[15px] opacity-80">{l.desc}</span>
                  </span>
                  <Arrow />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
