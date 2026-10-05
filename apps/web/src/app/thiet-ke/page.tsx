import type { Metadata } from "next";
import Link from "next/link";
import { formatVND } from "@pod/shared";
import { getFacets, getProducts, getSettings } from "@/lib/api";
import { assetUrl, shortPriceLabel } from "@/lib/config";
import type { ProductCardData } from "@/lib/types";
import { Img } from "@/components/ui/Img";
import { IconEye, IconGrid, IconImage, IconLayers, IconPalette, IconSparkle, IconText, IconUsers } from "@/components/ui/icons";
import { findReadyDesign, READY_DESIGNS } from "@pod/shared";
import { DesignPreview } from "@/components/designs/DesignPreview";
import { DesignFonts } from "@/components/designs/DesignFonts";
import { pastel, tiltOf } from "@/lib/pastel";
import { basicPrices } from "@/lib/basic-prices";
import type { GarmentKey } from "@pod/shared";

/** Phôi YALA Everyday nổi bật đầu danh sách (khách lẻ in 1 chiếc) */
const EVERYDAY: { slug: string; name: string; garment: GarmentKey; blank: string; photo: string; pos: string }[] = [
  { slug: "ao-thun-relaxed-fit-yala-everyday", name: "Áo thun Relaxed Fit", garment: "tshirt", blank: "tshirt-trang", photo: "/showcase/ao-thun.webp", pos: "32% 30%" },
  { slug: "ao-hoodie-ni-bong-yala-everyday", name: "Hoodie nỉ bông", garment: "hoodie", blank: "hoodie-den", photo: "/showcase/hoodie.webp", pos: "36% 30%" },
];

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
  { icon: IconGrid, title: "Mẫu có sẵn & gợi ý chữ", desc: "Thư viện hình, mẫu chữ tiếng Việt theo chủ đề – chọn là dùng." },
  { icon: IconPalette, title: "Đổi màu áo tức thì", desc: "Xem thiết kế trên từng màu áo trước khi quyết định." },
  { icon: IconUsers, title: "In tên & số từng người", desc: "Đồng phục lớp, team, công ty: mỗi áo một tên, một số – chung 1 đơn." },
  { icon: IconEye, title: "Xem trước & chia sẻ", desc: "Xem mọi mặt in trên sản phẩm, tải ảnh gửi bạn bè góp ý." },
];

export default async function StudioPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const category = sp["danh-muc"] || undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const [settings, list, facets] = await Promise.all([
    getSettings(),
    // chỉ sản phẩm có ảnh thật (theo Cài đặt → Hình ảnh); phôi YALA Everyday tự hiện lại khi có ảnh phôi thật
    getProducts({ "thiet-ke": "1", "anh-that": "1", sort: "danh-muc", category, page: String(page), pageSize: "24" }).catch(() => null),
    getFacets({ "thiet-ke": "1", "anh-that": "1" }),
  ]);
  const items = list?.items ?? [];
  const total = list?.total ?? 0;
  const pages = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1;
  const cats = facets.categories.filter((c) => c.count > 0);
  const brand = settings.brand.name;
  const zalo = settings.brand.zalo ? `https://zalo.me/${settings.brand.zalo.replace(/\D/g, "")}` : "";
  const qs = (next: { cat?: string; page?: number }) => {
    const u = new URLSearchParams();
    if (next.cat) u.set("danh-muc", next.cat);
    if (next.page && next.page > 1) u.set("page", String(next.page));
    const s = u.toString();
    return `/thiet-ke${s ? `?${s}` : ""}#chon-san-pham`;
  };

  const demo = [findReadyDesign("chuyen-phong-gym-1"), findReadyDesign("cap-doi-1"), findReadyDesign("tet-li-xi-1")].filter((d): d is NonNullable<typeof d> => !!d);
  // chưa có ảnh phôi thật -> hero dùng ảnh chụp thật (không dùng hình vẽ áo)
  const blanks = settings.media.blanks;
  const photoHero = !(blanks["tshirt-trang"] && blanks["tshirt-den"]);
  const HERO_PHOTOS = ["/showcase/hoodie.webp", "/showcase/the-thao.webp"];
  const prices = await basicPrices();

  return (
    <>
      <DesignFonts designs={demo} />
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute -left-[8%] bottom-0 hidden h-[70%] w-[45%] bg-sun md:block [clip-path:polygon(0_0,72%_0,100%_100%,0_100%)]" aria-hidden />
        <div className="container-site relative grid items-center gap-10 pb-14 pt-8 md:grid-cols-[1fr_1.05fr] md:pb-20 md:pt-14">
          <div className="relative">
            <span className="chip-sticker -rotate-2 bg-brand text-white">{brand} Studio</span>
            <h1 className="mt-5 font-display text-[clamp(44px,6.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.035em] [font-stretch:86%]">
              <span className="block">Tự thiết kế.</span>
              <span className="block">In từ 1 chiếc.</span>
            </h1>
            <p className="mt-5 max-w-[32rem] text-[16px] leading-relaxed text-ink/75 md:text-lg">
              Ngay trên điện thoại hoặc máy tính, không cần biết Photoshop. Thêm ảnh, chữ, mẫu có sẵn – xem trước trên sản phẩm, đặt in trong vài phút.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#chon-san-pham" className="btn-primary px-7 py-3.5 text-base">
                Chọn sản phẩm để thiết kế
              </a>
              <Link href="/bo-suu-tap" className="btn-outline px-7 py-3.5 text-base">
                Dùng mẫu có sẵn
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2 text-[13px] font-bold">
              {["Miễn phí dùng công cụ", "Tự lưu nháp", "COD toàn quốc"].map((t, i) => (
                <li key={t} className={`chip-sticker shadow-none ${pastel(i + 1)}`}>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Mô phỏng Studio: khung sticker + áo mẫu + thanh công cụ */}
          <div className="relative mx-auto w-full max-w-[520px]" aria-hidden>
            <div className="sticker tilt overflow-hidden bg-white shadow-sticker-lg" style={{ ["--r" as string]: "1.5deg" }}>
              <div className="flex h-11 items-center gap-2 border-b-2 border-ink px-3">
                <span className="font-display text-[15px] font-extrabold">Áo thun · Mặt trước</span>
                <span className="ml-auto rounded-full border-2 border-ink bg-brand px-3 py-0.5 text-[12px] font-bold text-white">Hoàn tất</span>
              </div>
              <div className="grid grid-cols-[56px_1fr]">
                <div className="flex flex-col items-center gap-2 border-r-2 border-ink/10 py-3">
                  {[IconImage, IconGrid, IconText, IconPalette, IconLayers].map((I, i) => (
                    <span key={i} className={`grid h-10 w-10 place-items-center rounded-xl border-2 ${i === 2 ? "border-ink bg-sun" : "border-transparent"}`}>
                      <I className="h-5 w-5" />
                    </span>
                  ))}
                </div>
                <div className="relative aspect-square bg-surface">
                  {photoHero ? (
                    <>
                      <img src="/showcase/ao-thun.webp" alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "34% 30%" }} fetchPriority="high" />
                      <span className="absolute left-[37%] top-[47%] h-[24%] w-[25%] rounded border-2 border-dashed border-brand bg-white/10" />
                      <span className="absolute left-[37%] top-[40%] rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">Vùng in</span>
                    </>
                  ) : (
                    <>
                      {demo[0] && <DesignPreview design={demo[0]} className="absolute inset-0 h-full w-full" />}
                      <span className="absolute left-[30%] top-[33%] h-[34%] w-[40%] rounded border-2 border-dashed border-brand" />
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 border-t-2 border-ink/10 px-3 py-2.5">
                {["#f7f6f2", "#1f1f22", "#ece2cf", "#a7a9ad", "#233049"].map((c, i) => (
                  <span key={c} className={`h-6 w-6 rounded-full border-2 ${i === (photoHero ? 0 : 1) ? "border-ink ring-2 ring-brand" : "border-ink/20"}`} style={{ backgroundColor: c }} />
                ))}
                <span className="ml-auto text-[12px] font-bold text-ink/60">Đổi màu áo</span>
              </div>
            </div>
            {demo.slice(1).map((d, i) => (
              <span
                key={d.slug}
                className={`pop-in absolute w-[34%] ${i === 0 ? "-left-[8%] top-[52%]" : "-right-[6%] -top-[6%]"}`}
                style={{ ["--r" as string]: i === 0 ? "-8deg" : "7deg", animationDelay: `${300 + i * 200}ms` }}
              >
                <span className={`float-${i === 0 ? "a" : "b"} sticker block aspect-square overflow-hidden ${pastel(i + 2)}`}>
                  {photoHero ? (
                    <img src={HERO_PHOTOS[i]} alt="" loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: i === 0 ? "30% 40%" : "40% 35%" }} />
                  ) : (
                    <DesignPreview design={d} className="h-full w-full" />
                  )}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 3 cách bắt đầu ---------- */}
      <section className="py-12 md:py-16" aria-label="Cách bắt đầu">
        <div className="container-site">
          <h2 className="h-section">Bắt đầu theo cách của bạn</h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { t: "Có sẵn ảnh, logo", d: "Chọn sản phẩm, tải ảnh lên, kéo thả & xoá nền ngay trong Studio.", href: "#chon-san-pham", cta: "Chọn sản phẩm", Icon: IconImage },
              { t: "Chưa có ý tưởng", d: `${READY_DESIGNS.length} mẫu chữ tiếng Việt theo chủ đề – chọn mẫu rồi sửa chữ theo ý.`, href: "/bo-suu-tap", cta: "Xem mẫu có sẵn", Icon: IconGrid },
              { t: "Áo nhóm, đồng phục", d: "Mỗi áo một tên, một số – nhập danh sách, đặt chung 1 đơn.", href: "#dong-phuc", cta: "Xem cách làm", Icon: IconUsers },
            ].map((x, i) => (
              <li key={x.t} data-reveal="pop" style={{ ["--d" as string]: `${i * 80}ms` }}>
                <a href={x.href} className={`sticker tilt hover-wiggle flex h-full flex-col p-6 ${pastel(i)}`} style={{ ["--r" as string]: `${tiltOf(i)}deg` }}>
                  <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-ink bg-white">
                    <x.Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-extrabold leading-tight">{x.t}</h3>
                  <p className="mt-1.5 flex-1 text-[15px] leading-relaxed text-ink/80">{x.d}</p>
                  <span className="mt-4 text-sm font-bold underline decoration-2 underline-offset-4">{x.cta}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Chọn sản phẩm ---------- */}
      <section id="chon-san-pham" className="scroll-mt-28 border-y-2 border-ink bg-surface py-12 md:py-16">
        <div className="container-site">
          <h2 className="h-section">Chọn sản phẩm để thiết kế</h2>
          <p className="mt-2 text-[15px] text-ink/70">{total > 0 ? `${total} sản phẩm tự thiết kế được` : "Đang cập nhật sản phẩm"}</p>

          {/* Phôi YALA in từ 1 chiếc – ảnh chụp thật (ảnh phôi trơn khi đã có, không thì ảnh người mẫu) */}
          {!category && page === 1 && (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {EVERYDAY.map((e, i) => {
                const photo = blanks[e.blank] ?? e.photo;
                const price = prices[e.garment];
                return (
                  <li key={e.slug}>
                    <Link href={`/thiet-ke/${e.slug}`} className={`sticker tilt hover-wiggle grid grid-cols-[42%_1fr] overflow-hidden ${pastel(i + 1)}`} style={{ ["--r" as string]: `${i ? 1 : -1}deg` }}>
                      <img src={assetUrl(photo)} alt={e.name} loading="lazy" className="h-full min-h-[150px] w-full border-r-2 border-ink object-cover" style={{ objectPosition: e.pos }} />
                      <span className="flex flex-col justify-center gap-1 p-4 md:p-5">
                        <span className="text-[12px] font-bold uppercase tracking-wide text-ink/60">Phôi YALA · in từ 1 chiếc</span>
                        <span className="font-display text-[clamp(20px,2.2vw,28px)] font-extrabold leading-tight">{e.name}</span>
                        {price && <span className="text-[15px] font-semibold">Từ {formatVND(price.basePrice)}</span>}
                        <span className="mt-1 text-sm font-bold underline decoration-2 underline-offset-4">Thiết kế ngay →</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {cats.length > 1 && (
            <nav className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2" aria-label="Lọc theo danh mục">
              <Chip href={qs({})} active={!category}>
                Tất cả
              </Chip>
              {cats.map((c) => (
                <Chip key={c.slug} href={qs({ cat: c.slug })} active={category === c.slug}>
                  {c.name} <span className="opacity-50">{c.count}</span>
                </Chip>
              ))}
            </nav>
          )}

          {items.length ? (
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
              {items.map((p, i) => (
                <li key={p.id}>
                  <StudioCard p={p} priority={i < 4} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 rounded-2xl border-2 border-dashed border-ink/20 bg-white p-8 text-center text-ink/60">
              Chưa có sản phẩm trong mục này. <Link href="/san-pham" className="font-bold underline">Xem tất cả sản phẩm</Link>
            </p>
          )}

          {pages > 1 && (
            <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={qs({ cat: category, page: n })}
                  aria-current={n === page ? "page" : undefined}
                  className={`grid h-10 min-w-10 place-items-center rounded-full border-2 px-3 text-sm font-bold ${n === page ? "border-ink bg-ink text-white" : "border-ink/15 bg-white hover:border-ink"}`}
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      {/* ---------- Tính năng ---------- */}
      <section className="py-12 md:py-16" aria-labelledby="studio-features" data-reveal>
        <div className="container-site">
          <h2 id="studio-features" className="h-section">
            Mọi thứ để có món đồ “chỉ mình có”
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
            {FEATURES.map((f, i) => (
              <li key={f.title}>
                <span className={`sticker inline-grid h-12 w-12 place-items-center rounded-xl shadow-sticker-sm ${pastel(i)}`}>
                  <f.icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-3 font-display text-[17px] font-bold leading-tight">{f.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink/65 md:text-sm">{f.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Đồng phục in tên & số ---------- */}
      <section id="dong-phuc" className="scroll-mt-28 border-y-2 border-ink bg-ink py-14 text-white md:py-20">
        <div className="container-site grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="chip-sticker -rotate-2 bg-sun text-ink">Đồng phục nhóm</span>
            <h2 className="mt-4 font-display text-[clamp(32px,4.2vw,54px)] font-extrabold leading-[1.0] tracking-[-0.02em] [font-stretch:86%]">Mỗi áo một tên, một số – đặt chung 1 đơn</h2>
            <ol className="mt-6 space-y-3 text-[15px] text-white/85">
              {[
                <>Trong Studio, thêm chữ rồi chọn <b className="text-sun">Tên thành viên</b> hoặc <b className="text-sun">Số áo</b>.</>,
                <>Ở trang sản phẩm, nhập danh sách: tên, số, size từng người (hoặc tải file Excel).</>,
                <>Xem trước từng chiếc – xưởng in đúng tên, đúng số cho từng người.</>,
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-white bg-brand font-display font-extrabold">{i + 1}</span>
                  <span className="pt-1">{t}</span>
                </li>
              ))}
            </ol>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#chon-san-pham" className="btn-primary px-6 py-3">
                Chọn áo đồng phục
              </a>
              {zalo && (
                <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn border-white bg-transparent px-6 py-3 text-white hover:bg-white hover:text-ink">
                  Cần tư vấn? Nhắn Zalo
                </a>
              )}
            </div>
          </div>
          <ul className="grid grid-cols-3 gap-4" aria-hidden>
            {[
              ["MINH", "7", "#E4570B"],
              ["LAN", "10", "#8FD3FF"],
              ["HÙNG", "23", "#A6E58A"],
            ].map(([n, no, bg], i) => (
              <li key={n} className="sticker tilt bg-white p-2 text-ink" style={{ ["--r" as string]: `${[-4, 2, 5][i]}deg` }}>
                <svg viewBox="0 0 100 100" className="w-full">
                  <path d="M30 14 12 24l8 16 8-4v52h44V36l8 4 8-16-18-10h-12a8 8 0 0 1-16 0H30Z" fill={bg} stroke="#1d1d1f" strokeWidth="2.5" strokeLinejoin="round" />
                  <text x="50" y="45" textAnchor="middle" fontSize="10" fontWeight="800" fill="#1d1d1f" fontFamily="inherit">
                    {n}
                  </text>
                  <text x="50" y="76" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff" stroke="#1d1d1f" strokeWidth="1.5" paintOrder="stroke" fontFamily="inherit">
                    {no}
                  </text>
                </svg>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Hỏi nhanh ---------- */}
      <section className="py-12 md:py-16" aria-labelledby="studio-faq">
        <div className="container-site max-w-[820px]">
          <h2 id="studio-faq" className="h-section">
            Hỏi nhanh
          </h2>
          <div className="mt-7 space-y-3">
            {[
              ["Ảnh thế nào thì in đẹp?", "Ảnh càng lớn càng nét. Studio tự báo khi ảnh chưa đủ độ phân giải cho kích thước in. Logo nên dùng PNG nền trong suốt, hoặc bấm Xoá nền ngay trong Studio."],
              ["Thiết kế có bị mất khi đóng trang?", "Không. Studio tự lưu nháp trên máy của bạn, mở lại là làm tiếp. Đăng nhập để lưu vào tài khoản và mở trên máy khác."],
              ["Sản phẩm in có giống bản xem trước?", "Xưởng in đúng file từ thiết kế của bạn. Màu thực tế có thể chênh nhẹ so với màn hình tuỳ chất liệu."],
              ["Không tự thiết kế được thì sao?", "Nhắn Zalo kèm ý tưởng hoặc ảnh – đội ngũ YALA hỗ trợ lên mẫu."],
            ].map(([q, a]) => (
              <details key={q} className="group rounded-2xl border-2 border-ink bg-white px-5 py-4 shadow-sticker-sm open:bg-peach">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-[17px] font-bold">
                  {q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink text-lg leading-none transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/75">{a}</p>
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
      className={`shrink-0 whitespace-nowrap rounded-full border-2 px-4 py-2 text-sm font-bold transition ${active ? "border-ink bg-ink text-white" : "border-ink bg-white hover:bg-sun"}`}
    >
      {children}
    </Link>
  );
}

function StudioCard({ p, priority }: { p: ProductCardData; priority: boolean }) {
  return (
    <div className="group flex h-full flex-col">
      <Link href={`/thiet-ke/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-2xl border-2 border-transparent bg-white transition-[transform,box-shadow,border-color] duration-200 group-hover:-translate-y-1 group-hover:border-ink group-hover:shadow-sticker">
        <Img src={p.images[0]} alt={p.name} priority={priority} sizes="(min-width:1024px) 280px, (min-width:640px) 30vw, 46vw" className="object-contain p-[6%] transition duration-300 group-hover:scale-105" />
        <span className="absolute left-2.5 top-2.5 rounded-lg border-2 border-ink bg-sun px-2 py-0.5 text-[11px] font-bold">{p.category.name}</span>
      </Link>
      <h3 className="mt-3 line-clamp-2 min-h-[2.6em] text-[13px] font-medium leading-[1.3] md:text-[15px]">
        <Link href={`/san-pham/${p.slug}`} className="hover:underline">
          {p.name}
        </Link>
      </h3>
      <p className="mt-1 text-[15px] font-semibold md:text-base">{shortPriceLabel(p, formatVND)}</p>
      <p className={`mb-2 min-h-[1.4em] text-[12px] font-semibold ${p.minQty && p.minQty > 1 ? "text-ink/55" : "text-[#15803d]"}`}>
        {p.minQty && p.minQty > 1 ? `Đặt từ ${p.minQty} sản phẩm` : p.basePrice > 0 ? "In từ 1 chiếc" : ""}
      </p>
      <Link href={`/thiet-ke/${p.slug}`} className="btn-primary mt-auto w-full py-2 text-[13px] md:text-sm">
        <IconSparkle className="h-3.5 w-3.5" aria-hidden /> Thiết kế ngay
      </Link>
    </div>
  );
}
