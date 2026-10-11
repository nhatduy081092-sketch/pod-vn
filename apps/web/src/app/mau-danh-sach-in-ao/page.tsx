import type { Metadata } from "next";
import Link from "next/link";
import { GARMENT_PRODUCT, GROUP_MIN_QTY, ROSTER_MAX_ROWS } from "@pod/shared";
import { SITE_URL } from "@/lib/config";
import { TOOL_LINKS } from "@/components/seo/ToolLinks";
import { DownloadButton } from "@/components/seo/DownloadButton";

export const revalidate = 3600;
const PATH = "/mau-danh-sach-in-ao";
const FILE = "/tai-ve/mau-danh-sach-in-ao-yala.xlsx";
const FILE_NAME = "mau-danh-sach-in-ao-yala.xlsx";
const title = "Mẫu danh sách in áo đồng phục: tên, số, size – tải file Excel miễn phí";
const description =
  "Tải file Excel mẫu danh sách in áo nhóm, áo lớp, áo đội bóng: cột tên in, số áo, size, ghi chú; có ô chọn size và tự đếm tổng theo size. Điền xong tải lên YALA là ra đơn, không cần gõ lại.";
export const metadata: Metadata = { title: { absolute: `${title} | YALA` }, description, alternates: { canonical: PATH }, openGraph: { title, description } };

const PRODUCT = `/san-pham/${GARMENT_PRODUCT.tshirt.slug}`;
const STUDIO = `/thiet-ke/${GARMENT_PRODUCT.tshirt.slug}`;

const EXAMPLE = [
  ["NGUYỄN AN", "10", "M", ""],
  ["TRẦN BÌNH", "07", "L", ""],
  ["LÊ CHI", "", "S", "Không in số"],
  ["PHẠM DŨNG", "99", "XL", "Đội trưởng"],
];

/** Quy tắc khớp đúng bộ đọc danh sách của web (packages/shared/src/roster.ts) */
const COLUMNS = [
  { t: "Tên in", d: "Tên in trên lưng áo, tối đa 30 ký tự, gõ có dấu bình thường. Để trống nếu áo đó không in tên." },
  { t: "Số áo", d: "Từ 0 đến 999. Gõ 07 thì in 07 – cột trong file đã để dạng chữ nên không mất số 0. Để trống nếu không in số." },
  { t: "Size", d: "Chọn trong ô thả xuống. Gõ “xxl”, “xl ” cũng được – web tự hiểu thành 2XL, XL." },
  { t: "Ghi chú", d: "Yêu cầu riêng cho áo đó: đội trưởng, không in số, in tên khác màu… (tối đa 60 ký tự)." },
];

const MISTAKES = [
  { t: "Mỗi người ghi một kiểu", d: "“Size L”, “L ạ”, “cỡ lớn” – chốt trước: chỉ ghi S, M, L, XL, 2XL. File mẫu có ô chọn sẵn nên không gõ sai." },
  { t: "Trùng số áo", d: "Đội bóng thường có quy định số áo không trùng. Sắp xếp cột Số áo để soát trước khi gửi." },
  { t: "Mất số 0 ở đầu", d: "Excel tự đổi 07 thành 7 nếu cột để dạng số. Dùng file mẫu (cột Số áo dạng chữ) hoặc gõ dấu nháy trước: '07." },
  { t: "Quên người, thừa người", d: "Đếm lại tổng ở sheet “Tổng size” và đối chiếu sĩ số trước khi chốt." },
  { t: "Tên quá dài", d: "Tên dài làm chữ trên lưng nhỏ khó đọc. Nên in tên gọi hoặc tên + chữ cái đầu họ (AN N.)." },
];

const FAQ = [
  { q: "File mẫu danh sách in áo có mất phí không?", a: "Không. Tải về dùng miễn phí, mở được bằng Excel, Google Sheets, WPS." },
  { q: "Điền xong gửi cho YALA bằng cách nào?", a: "Vào trang sản phẩm áo, tab “Đặt cho nhóm” → “Tải file Excel / CSV”. Web đọc file, báo dòng nào sai và đếm số áo theo size ngay. Không cần gửi file qua Zalo rồi chờ gõ lại." },
  { q: "Dùng Google Sheets được không?", a: "Được. Tệp → Nhập → tải file mẫu lên. Điền xong có thể bôi đen các cột → Ctrl+C → “Dán từ Excel” trên trang đặt hàng, hoặc Tải xuống dạng .xlsx rồi tải lên." },
  { q: "Không muốn tự gom size từng người?", a: "Tạo link gom đơn nhóm: thiết kế xong bấm Hoàn tất → “Tạo link gom đơn nhóm”, gửi vào nhóm chat. Mỗi người tự ghi tên, số, size; trưởng nhóm xem danh sách và đặt một đơn." },
  { q: "Danh sách tối đa bao nhiêu người?", a: `Một lần tải lên nhận tối đa ${ROSTER_MAX_ROWS.toLocaleString("vi-VN")} dòng. Đơn nhóm từ ${GROUP_MIN_QTY} sản phẩm; ít hơn vẫn đặt được, tính như mua lẻ.` },
  { q: "Chưa biết chọn size?", a: "Xem bảng size áo nhóm (số đo theo từng dòng áo) và cách đo trước khi cả nhóm ghi size." },
];

/** Công thức 2: tài nguyên tải được – đúng định dạng YALA nhận khi tải danh sách */
export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Mẫu danh sách in áo", item: `${SITE_URL}${PATH}` },
      ],
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-line bg-cream">
        <div className="container-site grid items-center gap-8 py-8 md:grid-cols-[1.1fr_1fr] md:py-12">
          <div>
            <nav className="text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-ink">
                Trang chủ
              </Link>{" "}
              / <span className="text-ink">Mẫu danh sách in áo</span>
            </nav>
            <h1 className="mt-3 font-display text-[clamp(28px,3.8vw,46px)] font-bold leading-[1.15] tracking-[-0.02em] [text-wrap:balance]">Mẫu danh sách in áo: tên, số, size</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink/80 md:text-lg">
              File Excel cho trưởng nhóm, lớp trưởng, HR: mỗi dòng một áo, ô chọn size sẵn, tự đếm tổng theo size. Điền xong tải thẳng lên YALA – web đọc file và báo dòng sai, không ai phải gõ lại.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <DownloadButton href={FILE} file={FILE_NAME} from={PATH} className="btn-primary px-6">
                Tải file Excel mẫu (.xlsx)
              </DownloadButton>
              <Link href={PRODUCT} className="btn-outline bg-white px-6">
                Tải danh sách lên để đặt áo
              </Link>
            </div>
            <p className="mt-3 text-sm text-muted">Miễn phí · mở bằng Excel, Google Sheets, WPS · 4 cột: Tên in, Số áo, Size, Ghi chú</p>
          </div>
          {/* Xem trước file */}
          <figure className="overflow-hidden rounded-2xl border border-line bg-white shadow-sticker">
            <figcaption className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5 text-sm font-semibold">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1d6f42]" aria-hidden /> {FILE_NAME}
            </figcaption>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[340px] text-left text-[13px] md:text-[14px]">
                <thead className="bg-ink text-white">
                  <tr>
                    {COLUMNS.map((c) => (
                      <th key={c.t} scope="col" className="whitespace-nowrap px-2.5 py-2 font-semibold md:px-3">
                        {c.t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EXAMPLE.map((r) => (
                    <tr key={r[0]} className="border-t border-line">
                      {r.map((c, i) => (
                        <td key={i} className={`px-2.5 py-2 md:px-3 ${i === 1 || i === 2 ? "text-center tabular-nums" : ""} ${i === 3 ? "text-muted" : ""}`}>
                          {c || <span className="text-ink/30">–</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line px-4 py-2.5 text-[13px] text-muted">Sheet trong file: Danh sách · Ví dụ · Tổng size · Hướng dẫn</p>
          </figure>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container-site">
          <h2 className="h-section">Cách điền từng cột</h2>
          <ul className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {COLUMNS.map((c) => (
              <li key={c.t} className="border-l-2 border-brand pl-4">
                <h3 className="text-lg font-bold">{c.t}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink/80">{c.d}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-ink/80">
            Chỉ điền ở sheet <b>Danh sách</b> và giữ nguyên dòng tiêu đề. Sheet <b>Tổng size</b> tự đếm số áo theo từng size để đối chiếu sĩ số trước khi đặt.
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-surface/60 py-10 md:py-14">
        <div className="container-site">
          <h2 className="h-section">3 cách gửi danh sách cho YALA</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            <li className="rounded-2xl border border-line bg-white p-5">
              <p className="text-sm font-semibold text-brand-dark">Cách 1 · Có sẵn file</p>
              <h3 className="mt-1 text-lg font-bold">Tải file Excel / CSV lên</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/80">Trang sản phẩm áo → tab “Đặt cho nhóm” → “Tải file Excel / CSV”. Web báo dòng sai và đếm size ngay.</p>
              <Link href={PRODUCT} className="mt-3 inline-block text-[15px] font-semibold underline underline-offset-4 hover:text-brand-dark">
                Mở trang đặt áo
              </Link>
            </li>
            <li className="rounded-2xl border border-line bg-white p-5">
              <p className="text-sm font-semibold text-brand-dark">Cách 2 · Đang ở Google Sheets</p>
              <h3 className="mt-1 text-lg font-bold">Copy – dán</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/80">Bôi đen các cột Tên in, Số áo, Size → Ctrl+C → bấm “Dán từ Excel” trên trang đặt áo → “Đọc danh sách”.</p>
            </li>
            <li className="rounded-2xl border border-line bg-white p-5">
              <p className="text-sm font-semibold text-brand-dark">Cách 3 · Chưa ai ghi size</p>
              <h3 className="mt-1 text-lg font-bold">Gửi 1 link cho cả nhóm</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/80">Thiết kế áo → Hoàn tất → “Tạo link gom đơn nhóm”. Mỗi người tự ghi tên, số, size; trưởng nhóm chốt và đặt một đơn.</p>
              <Link href={`${STUDIO}?back=${PATH}`} className="mt-3 inline-block text-[15px] font-semibold underline underline-offset-4 hover:text-brand-dark">
                Thiết kế và tạo link
              </Link>
            </li>
          </ol>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container-site max-w-3xl">
          <h2 className="h-section">Lỗi hay gặp khi gom danh sách</h2>
          <ul className="mt-6 space-y-4">
            {MISTAKES.map((m) => (
              <li key={m.t}>
                <h3 className="text-[17px] font-bold">{m.t}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink/80">{m.d}</p>
              </li>
            ))}
          </ul>
          <DownloadButton href={FILE} file={FILE_NAME} from={PATH} className="btn-primary mt-8 px-6">
            Tải file Excel mẫu
          </DownloadButton>
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
