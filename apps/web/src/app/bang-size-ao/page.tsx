import type { Metadata } from "next";
import Link from "next/link";
import { GARMENT_PRODUCT, resolveSizeChart, type GarmentKey } from "@pod/shared";
import { getProduct, getSettings } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { TOOL_LINKS } from "@/components/seo/ToolLinks";

export const revalidate = 600;
const PATH = "/bang-size-ao";
const title = "Bảng size áo nhóm, áo lớp, đồng phục – cách đo và chọn size cho cả nhóm";
const description = "Bảng size áo thun, hoodie, sweater YALA Everyday; cách đo áo đang mặc để chọn size, mẹo chọn size cho cả lớp, đội, công ty và cách thu size bằng 1 link.";
export const metadata: Metadata = { title: { absolute: `${title} | YALA` }, description, alternates: { canonical: PATH }, openGraph: { title, description } };

const GARMENTS: GarmentKey[] = ["tshirt", "longsleeve", "sweater", "hoodie"];
const FAQ = [
  { q: "Áo YALA Everyday có những size nào?", a: "Áo thun, áo dài tay, sweater, hoodie YALA Everyday có size S, M, L, XL, 2XL. Size từng sản phẩm hiện trong trang sản phẩm khi chọn." },
  { q: "Đang phân vân giữa 2 size thì chọn size nào?", a: "Áo thun YALA Everyday là form rộng vừa (relaxed fit): thích mặc vừa người thì chọn size nhỏ hơn, thích rộng thoải mái thì chọn size lớn hơn. Cách chắc nhất là đo một chiếc áo bạn đang mặc vừa và so với bảng size." },
  { q: "Cả nhóm khác size nhau đặt thế nào?", a: "Dùng link gom đơn nhóm: mỗi người tự chọn size, danh sách tự đếm số áo theo từng size để trưởng nhóm đặt một đơn." },
];

/** Công thức 2: tài nguyên bảng size – số đo lấy từ CMS (không tự bịa số đo) */
export default async function Page() {
  const [settings, products] = await Promise.all([getSettings(), Promise.all(GARMENTS.map((g) => getProduct(GARMENT_PRODUCT[g].slug).catch(() => null)))]);
  const charts = GARMENTS.map((g, i) => ({ g, p: products[i], chart: products[i] ? resolveSizeChart(products[i]!.sizeChart, products[i]!.category.sizeChart) : null }));
  const has = charts.filter((c) => c.chart && c.chart.rows.length);
  const zalo = settings.brand.zalo ? `https://zalo.me/${settings.brand.zalo.replace(/\D/g, "")}` : "";
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Bảng size áo", item: `${SITE_URL}${PATH}` },
      ],
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-line bg-cream">
        <div className="container-site py-8 md:py-12">
          <nav className="text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink">
              Trang chủ
            </Link>{" "}
            / <span className="text-ink">Bảng size áo</span>
          </nav>
          <h1 className="mt-3 max-w-4xl font-display text-[clamp(28px,3.8vw,46px)] font-bold leading-[1.15] tracking-[-0.02em] [text-wrap:balance]">Bảng size áo nhóm & cách chọn size cho cả nhóm</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/80 md:text-lg">Số đo từng size áo YALA Everyday, cách đo áo đang mặc để chọn đúng, và cách thu size cả lớp, cả đội mà không phải nhắn từng người.</p>
        </div>
      </section>

      <div className="container-site max-w-4xl py-10 md:py-14">
        <h2 className="h-section">Số đo từng size</h2>
        {has.length ? (
          <div className="mt-6 space-y-8">
            {has.map(({ g, p, chart }) => (
              <div key={g}>
                <h3 className="text-lg font-bold">
                  <Link href={`/san-pham/${p!.slug}`} className="hover:text-brand-dark">
                    {p!.name}
                  </Link>
                </h3>
                <div className="mt-3 overflow-x-auto rounded-xl border border-line">
                  <table className="w-full min-w-[420px] text-left text-[15px]">
                    <thead className="bg-surface text-sm text-muted">
                      <tr>
                        {chart!.headers.map((h, i) => (
                          <th key={i} className="px-4 py-3 font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chart!.rows.map((r, i) => (
                        <tr key={i} className="border-t border-line">
                          {r.map((c, j) => (
                            <td key={j} className={`px-4 py-3 ${j === 0 ? "font-semibold" : ""}`}>
                              {c}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {chart!.notes.map((n) => (
                  <p key={n} className="mt-2 text-sm text-muted">
                    {n}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-surface px-5 py-4 text-[15px] leading-relaxed">
            YALA đang cập nhật số đo chính xác từng size (S, M, L, XL, 2XL) cho dòng YALA Everyday.{" "}
            {zalo ? (
              <a href={zalo} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-dark underline underline-offset-4">
                Nhắn Zalo để nhận bảng size
              </a>
            ) : (
              "Liên hệ hotline để nhận bảng size"
            )}{" "}
            trước khi chốt đơn nhóm.
          </p>
        )}

        <h2 className="h-section mt-12">Cách đo để chọn đúng size</h2>
        <ol className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink/85">
          <li>
            <b>1. Lấy một chiếc áo thun bạn đang mặc vừa ý</b>, trải phẳng trên mặt bàn, vuốt cho hết nếp.
          </li>
          <li>
            <b>2. Đo rộng ngực:</b> thước đặt ngang, từ đường may nách bên này sang nách bên kia (đo 1 lớp vải).
          </li>
          <li>
            <b>3. Đo dài áo:</b> từ điểm cao nhất của vai (sát cổ) thẳng xuống gấu áo.
          </li>
          <li>
            <b>4. So với bảng size:</b> chọn size có số đo gần nhất; nằm giữa 2 size thì chọn theo cách bạn thích mặc – vừa hay rộng.
          </li>
        </ol>

        <h2 className="h-section mt-12">Chọn size cho cả nhóm</h2>
        <ul className="mt-5 space-y-3 text-[15px] leading-relaxed text-ink/85">
          <li>• Để mỗi người tự chọn size thay vì trưởng nhóm đoán hộ – ít áo không vừa, ít phải đổi.</li>
          <li>• Gửi kèm trang này cho cả nhóm để ai cũng đo cùng một cách.</li>
          <li>
            • Dùng <b>link gom đơn nhóm</b> (Studio → Hoàn tất → Tạo link gom đơn nhóm): mỗi người ghi tên và size, danh sách tự đếm số áo theo size.
          </li>
          <li>• Áo có in tên từng người: kiểm tra lại cặp tên – size trong danh sách trước khi chốt, vì mỗi áo là duy nhất.</li>
        </ul>

        <div className="mt-10 flex flex-wrap gap-2.5">
          <Link href="/mau-ao-lop" className="btn-primary px-6">
            Xem mẫu áo nhóm
          </Link>
          <Link href="/thiet-ke-ao-lop-online" className="btn-outline px-6">
            Thiết kế áo lớp online
          </Link>
        </div>
      </div>

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
