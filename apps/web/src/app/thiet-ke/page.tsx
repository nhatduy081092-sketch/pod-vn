import type { Metadata } from "next";
import Link from "next/link";
import { formatVND } from "@pod/shared";
import { getFacets, getProducts, getSettings } from "@/lib/api";
import { shortPriceLabel } from "@/lib/config";
import type { ProductCardData } from "@/lib/types";
import { Img } from "@/components/ui/Img";
import { IconArrow, IconEye, IconImage, IconLayers, IconPalette, IconSave, IconSparkle, IconText, IconUsers } from "@/components/ui/icons";

export const revalidate = 60;

type Search = Promise<{ "danh-muc"?: string; page?: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = `${s.brand.name} Studio – Tự thiết kế áo & phụ kiện online`;
  const description = `Tự thiết kế áo thun, hoodie, đồng phục, túi, phụ kiện ngay trên trình duyệt: thêm ảnh, chữ, sticker, in tên & số từng người, xem trước tức thì. In từ 1 chiếc, giao toàn quốc.`;
  return { title: { absolute: title }, description, alternates: { canonical: "/thiet-ke" }, openGraph: { title, description } };
}

const FEATURES = [
  { icon: IconImage, title: "Tải ảnh của bạn", desc: "Kéo thả, xoay, phóng to. Tự cảnh báo khi ảnh không đủ nét để in." },
  { icon: IconText, title: "Chữ nghệ thuật", desc: "Nhiều font tiếng Việt, kiểu chữ có sẵn, uốn cong, viền, giãn chữ." },
  { icon: IconLayers, title: "Sticker & mẫu có sẵn", desc: "Thư viện hình và mẫu thiết kế – chọn là dùng, sửa lại theo ý." },
  { icon: IconPalette, title: "Đổi màu áo tức thì", desc: "Xem thiết kế trên từng màu áo trước khi quyết định." },
  { icon: IconUsers, title: "In tên & số từng người", desc: "Đồng phục lớp, team, công ty: mỗi áo một tên, một số – chung 1 đơn." },
  { icon: IconEye, title: "Xem trước mọi mặt in", desc: "Trước, sau, tay áo… trên ảnh sản phẩm thật. Tự lưu nháp khi đang làm." },
];

const HOW = [
  { title: "Chọn sản phẩm", desc: "Áo, hoodie, túi, phụ kiện – chọn mẫu bên dưới." },
  { title: "Thiết kế trong YALA Studio", desc: "Thêm ảnh, chữ, sticker; căn chỉnh và xem trước." },
  { title: "Đặt hàng", desc: "Chọn màu, size, số lượng – thanh toán COD hoặc VietQR. Xưởng in đúng file bạn thiết kế." },
];

export default async function StudioPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const category = sp["danh-muc"] || undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const [settings, list, facets] = await Promise.all([
    getSettings(),
    getProducts({ "thiet-ke": "1", category, page: String(page), pageSize: "24" }).catch(() => null),
    getFacets({ "thiet-ke": "1" }),
  ]);
  const items = list?.items ?? [];
  const total = list?.total ?? 0;
  const pages = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1;
  const cats = facets.categories.filter((c) => c.count > 0);
  const heroProduct = items.find((p) => p.images[0]);
  const brand = settings.brand.name;
  const zalo = settings.brand.zalo ? `https://zalo.me/${settings.brand.zalo.replace(/\D/g, "")}` : "";
  const qs = (next: { cat?: string; page?: number }) => {
    const u = new URLSearchParams();
    if (next.cat) u.set("danh-muc", next.cat);
    if (next.page && next.page > 1) u.set("page", String(next.page));
    const s = u.toString();
    return `/thiet-ke${s ? `?${s}` : ""}#chon-san-pham`;
  };

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="overflow-hidden bg-cream">
        <div className="container-site grid items-center gap-8 py-8 md:grid-cols-[1.05fr_1fr] md:py-14">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-extrabold tracking-wide shadow-hard">
              <IconSparkle className="h-3.5 w-3.5 text-accent" aria-hidden /> {brand.toUpperCase()} STUDIO
            </p>
            <h1 className="mt-4 text-[clamp(30px,6.2vw,56px)] font-black leading-[1.05] tracking-tight text-ink">
              Áo của bạn,
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">ý tưởng của bạn.</span>
                <span className="absolute inset-x-0 bottom-[0.08em] z-0 h-[0.32em] -rotate-1 bg-brand" aria-hidden />
              </span>
            </h1>
            <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-ink/75 md:text-base">
              Tự thiết kế ngay trên điện thoại hoặc máy tính – không cần biết Photoshop. Xem trước trên sản phẩm thật, in từ 1 chiếc, giao toàn quốc.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#chon-san-pham" className="btn-primary px-6 py-3 text-base">
                Bắt đầu thiết kế <IconArrow className="h-5 w-5" />
              </a>
              <a href="#dong-phuc" className="btn-outline px-5 py-3 text-base">
                Đồng phục in tên &amp; số
              </a>
            </div>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] font-semibold text-ink/70">
              <li>✓ Miễn phí dùng công cụ</li>
              <li>✓ In từ 1 chiếc</li>
              <li>✓ COD toàn quốc</li>
            </ul>
          </div>

          {/* Mô phỏng giao diện Studio */}
          <div className="relative mx-auto w-full max-w-[480px]" aria-hidden>
            <div className="rounded-[14px] border-2 border-ink bg-white shadow-[5px_5px_0_#1d1d1f]">
              <div className="flex h-9 items-center justify-between border-b-2 border-ink px-3">
                <span className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full border-[1.5px] border-ink bg-white" />
                  <span className="h-3 w-3 rounded-full border-[1.5px] border-ink bg-brand-badge" />
                  <span className="h-3 w-3 rounded-full border-[1.5px] border-ink bg-brand-dark" />
                </span>
                <span className="text-[11px] font-extrabold">{brand} Studio · Mặt trước</span>
                <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-extrabold text-brand-badge">Đặt in</span>
              </div>
              <div className="grid grid-cols-[52px_1fr]">
                <div className="flex flex-col items-center gap-2 border-r-2 border-ink py-3">
                  {[IconImage, IconText, IconLayers, IconPalette, IconSave].map((I, i) => (
                    <span key={i} className={`flex h-9 w-9 items-center justify-center rounded-md border-2 ${i === 1 ? "border-ink bg-brand-badge" : "border-transparent"}`}>
                      <I className="h-5 w-5" />
                    </span>
                  ))}
                </div>
                <div className="relative aspect-square bg-[#f4f4f5]">
                  {heroProduct ? (
                    <Img src={heroProduct.images[0]} alt="" sizes="(min-width:768px) 420px, 80vw" className="object-contain p-4" priority />
                  ) : (
                    <img src="/mock/tee-geo-night.svg" alt="" className="absolute inset-0 h-full w-full object-contain p-6" />
                  )}
                  <div className="absolute left-1/2 top-[30%] flex h-[42%] w-[34%] -translate-x-1/2 flex-col items-center justify-center rounded border-2 border-dashed border-accent bg-white/70 text-center backdrop-blur-[1px]">
                    <span className="text-[clamp(11px,2.6vw,15px)] font-black uppercase leading-none tracking-tight text-ink">Tên của bạn</span>
                    <span className="mt-1 text-[clamp(28px,7vw,46px)] font-black leading-none text-accent [-webkit-text-stroke:1.5px_#1d1d1f]">10</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t-2 border-ink px-3 py-2">
                {["#ffffff", "#1d1d1f", "#1C4D99", "#e11d48", "#16a34a", "#FFA415"].map((c) => (
                  <span key={c} className="h-5 w-5 rounded-full border-2 border-ink" style={{ backgroundColor: c }} />
                ))}
                <span className="ml-auto text-[11px] font-bold text-ink/60">Màu áo</span>
              </div>
            </div>
            <IconSparkle className="absolute -right-2 -top-4 h-9 w-9 text-brand-badge drop-shadow-[2px_2px_0_#1d1d1f]" />
          </div>
        </div>
      </section>

      {/* ---------- Tính năng ---------- */}
      <section className="border-y-2 border-ink bg-white py-10 md:py-14" aria-labelledby="studio-features">
        <div className="container-site">
          <h2 id="studio-features" className="text-center text-[clamp(22px,4vw,34px)] font-black tracking-tight">
            Mọi thứ để có chiếc áo “chỉ mình có”
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3 rounded-xl border-2 border-ink/10 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-brand-badge">
                  <f.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-extrabold">{f.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink/70">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Chọn sản phẩm ---------- */}
      <section id="chon-san-pham" className="scroll-mt-28 bg-cream py-10 md:py-14">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[clamp(22px,4vw,34px)] font-black tracking-tight">Chọn sản phẩm để bắt đầu</h2>
              <p className="mt-1 text-sm text-ink/65">{total > 0 ? `${total} sản phẩm tự thiết kế được` : "Đang cập nhật sản phẩm"}</p>
            </div>
          </div>

          {cats.length > 1 && (
            <nav className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Lọc theo danh mục">
              <Chip href={qs({})} active={!category}>
                Tất cả
              </Chip>
              {cats.map((c) => (
                <Chip key={c.slug} href={qs({ cat: c.slug })} active={category === c.slug}>
                  {c.name} <span className="text-ink/45">{c.count}</span>
                </Chip>
              ))}
            </nav>
          )}

          {items.length ? (
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {items.map((p, i) => (
                <li key={p.id}>
                  <StudioCard p={p} priority={i < 4} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 rounded-xl border-2 border-dashed border-ink/20 bg-white p-8 text-center text-ink/60">
              Chưa có sản phẩm trong mục này. <Link href="/san-pham" className="font-bold text-navy underline">Xem tất cả sản phẩm</Link>
            </p>
          )}

          {pages > 1 && (
            <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={qs({ cat: category, page: n })}
                  aria-current={n === page ? "page" : undefined}
                  className={`flex h-10 min-w-10 items-center justify-center rounded-md border-2 px-2 text-sm font-extrabold ${
                    n === page ? "border-ink bg-ink text-white" : "border-ink/15 bg-white hover:border-ink"
                  }`}
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      {/* ---------- 3 bước ---------- */}
      <section className="bg-white py-10 md:py-14" aria-labelledby="studio-how">
        <div className="container-site">
          <h2 id="studio-how" className="text-center text-[clamp(22px,4vw,34px)] font-black tracking-tight">
            3 bước là xong
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {HOW.map((h, i) => (
              <li key={h.title} className="relative rounded-xl border-2 border-ink bg-cream p-5 pt-7 shadow-hard">
                <span className="absolute -top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-brand-badge text-sm font-black">
                  {i + 1}
                </span>
                <h3 className="font-extrabold">{h.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/70">{h.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Đồng phục in tên & số ---------- */}
      <section id="dong-phuc" className="scroll-mt-28 bg-navy-dark py-10 text-white md:py-14">
        <div className="container-site grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="text-xs font-extrabold tracking-widest text-accent">ĐỒNG PHỤC NHÓM</p>
            <h2 className="mt-2 text-[clamp(22px,4vw,34px)] font-black leading-tight tracking-tight">Mỗi áo một tên, một số – đặt chung 1 đơn</h2>
            <ol className="mt-5 space-y-3 text-[15px] text-white/85">
              <li>
                <b className="text-white">1.</b> Trong Studio, thêm chữ và bấm <b className="text-brand-badge">“Tên”</b> hoặc <b className="text-brand-badge">“Số”</b> để biến nó thành ô điền riêng.
              </li>
              <li>
                <b className="text-white">2.</b> Ở trang sản phẩm, nhập danh sách thành viên: tên, số, size từng người.
              </li>
              <li>
                <b className="text-white">3.</b> Xem trước từng chiếc áo – xưởng in đúng tên, đúng số cho từng người.
              </li>
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#chon-san-pham" className="btn border-white bg-accent text-white shadow-[3px_3px_0_#fff]">
                Chọn áo đồng phục <IconArrow className="h-4 w-4" />
              </a>
              {zalo && (
                <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn border-white bg-transparent text-white hover:bg-white/10">
                  Cần tư vấn? Nhắn Zalo
                </a>
              )}
            </div>
          </div>
          <ul className="grid grid-cols-3 gap-3" aria-hidden>
            {[
              ["MINH", "7"],
              ["LAN", "10"],
              ["HÙNG", "23"],
            ].map(([n, no], i) => (
              <li key={n} className={`rounded-xl border-2 border-white/80 bg-white p-2 text-ink ${i === 1 ? "-translate-y-3" : ""}`}>
                <svg viewBox="0 0 100 100" className="w-full">
                  <path
                    d="M30 14 12 24l8 16 8-4v52h44V36l8 4 8-16-18-10h-12a8 8 0 0 1-16 0H30Z"
                    fill={["#1C4D99", "#F88125", "#1d1d1f"][i]}
                    stroke="#1d1d1f"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  <text x="50" y="45" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff" fontFamily="inherit">
                    {n}
                  </text>
                  <text x="50" y="74" textAnchor="middle" fontSize="26" fontWeight="900" fill="#FFE44D" fontFamily="inherit">
                    {no}
                  </text>
                </svg>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Hỏi nhanh ---------- */}
      <section className="bg-white py-10 md:py-14" aria-labelledby="studio-faq">
        <div className="container-site max-w-[820px]">
          <h2 id="studio-faq" className="text-center text-[clamp(22px,4vw,30px)] font-black tracking-tight">
            Hỏi nhanh
          </h2>
          <div className="mt-6 divide-y-2 divide-ink/10 rounded-xl border-2 border-ink/10">
            {[
              ["Ảnh thế nào thì in đẹp?", "Ảnh càng lớn càng nét. Studio tự báo khi ảnh chưa đủ độ phân giải cho kích thước in. Logo nên dùng PNG nền trong suốt."],
              ["Thiết kế có bị mất khi đóng trang?", "Không. Studio tự lưu nháp trên máy của bạn, mở lại là làm tiếp."],
              ["Sản phẩm in có giống bản xem trước?", "Xưởng in đúng file từ thiết kế của bạn. Màu thực tế có thể chênh nhẹ so với màn hình tuỳ chất liệu."],
              ["Không tự thiết kế được thì sao?", "Nhắn Zalo cho chúng tôi kèm ý tưởng hoặc ảnh – đội ngũ sẽ hỗ trợ lên mẫu."],
            ].map(([q, a]) => (
              <details key={q} className="group px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-extrabold">
                  {q}
                  <span className="text-xl leading-none transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`shrink-0 whitespace-nowrap rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition ${
        active ? "border-ink bg-ink text-white" : "border-ink/15 bg-white hover:border-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function StudioCard({ p, priority }: { p: ProductCardData; priority: boolean }) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border-2 border-ink bg-white transition hover:-translate-y-0.5 hover:shadow-hard">
      <Link href={`/thiet-ke/${p.slug}`} className="relative block aspect-square bg-[#f6f6f7]">
        <Img src={p.images[0]} alt={p.name} priority={priority} sizes="(min-width:1024px) 280px, (min-width:640px) 30vw, 46vw" className="object-contain p-2 transition duration-300 group-hover:scale-105" />
        <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-extrabold text-brand-badge md:text-[11px]">{p.category.name}</span>
      </Link>
      <div className="flex flex-1 flex-col p-2.5 md:p-3">
        <h3 className="line-clamp-2 min-h-[2.6em] text-[12.5px] font-bold leading-[1.3] md:text-sm">
          <Link href={`/san-pham/${p.slug}`} className="hover:underline">
            {p.name}
          </Link>
        </h3>
        <p className="mt-1 text-[15px] font-black md:text-base">{shortPriceLabel(p, formatVND)}</p>
        <Link
          href={`/thiet-ke/${p.slug}`}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border-2 border-ink bg-brand-badge py-2 text-[13px] font-extrabold transition group-hover:bg-brand md:text-sm"
        >
          <IconSparkle className="h-3.5 w-3.5" aria-hidden /> Thiết kế ngay
        </Link>
      </div>
    </div>
  );
}
