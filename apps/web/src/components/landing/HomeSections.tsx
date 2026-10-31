import Link from "next/link";
import { DESIGN_HUBS, GARMENT_PRODUCT, GROUP_MIN_QTY, GROUP_STEPS, SEGMENTS } from "@pod/shared";
import { TOOL_LINKS } from "../seo/ToolLinks";
import { TeamLineup } from "../group/TeamLineup";

/*
 * Trang chủ (redesign 31/10/2026 – hướng "vật thể thật to"): áo nhóm in tên từng người là vật thể chính,
 * phóng to tràn mép phải; các khối sau là danh sách chữ lớn, không thẻ icon, không viền, không bóng.
 * Khối nào cũng có tiêu đề riêng; chuyển động = data-reveal="rise" (tắt khi giảm chuyển động).
 */

const rise = (i: number) => ({ "data-reveal": "rise", style: { ["--d" as string]: `${i * 70}ms` } });

/** Đầu trang: tiêu đề + 1 câu + 2 nút bên trái, 3 áo in tên/số phóng to tràn mép phải */
export function HomeHero({ zalo }: { zalo?: string }) {
  const sport = SEGMENTS.find((s) => s.key === "the-thao")!;
  return (
    <section className="relative overflow-hidden bg-surface" aria-labelledby="home-title">
      <div className="container-site grid items-center gap-6 pt-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-4 md:pt-16 lg:min-h-[min(74svh,720px)]">
        <div className="relative z-10 md:pb-16">
          <h1 id="home-title" className="font-display text-[clamp(40px,5vw,76px)] font-bold leading-[1.02] tracking-[-0.035em] [text-wrap:balance]">
            Áo nhóm, mỗi người đúng tên
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink md:text-xl">
            Doanh nghiệp, CLB, lớp, team building: thiết kế trên web, gửi 1 link để cả nhóm tự ghi tên – size. YALA in và giao tận nơi, đơn nhóm từ {GROUP_MIN_QTY} sản phẩm.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={`/thiet-ke/${GARMENT_PRODUCT.tshirt.slug}`} className="btn-primary px-7 py-3.5 text-base">
              Thiết kế áo nhóm
            </Link>
            <Link href="/doanh-nghiep#bao-gia" className="btn-outline px-7 py-3.5 text-base">
              Nhận báo giá
            </Link>
            {zalo && (
              <a href={zalo} target="_blank" rel="noopener noreferrer" className="px-2 py-3 text-base font-semibold underline underline-offset-4 transition-colors hover:text-brand-dark">
                Chat Zalo
              </a>
            )}
          </div>
          <p className="mt-7 text-base text-ink/80">Xem mẫu trước khi đặt · Có hoá đơn VAT · Giao hàng toàn quốc</p>
        </div>
        {/* vật thể: rộng hơn cột, tràn mép phải + bị cắt đáy */}
        <div className="home-shutter relative -mx-4 -mb-[6%] md:-mr-[6vw] md:ml-0 md:self-end">
          <div className="w-[118%] max-w-none md:w-[112%]">
            <TeamLineup team={sport.lineup.team} color={sport.lineup.color} people={sport.lineup.people} />
          </div>
          <span className="absolute bottom-[12%] left-4 z-10 rounded-md bg-white px-2 py-0.5 text-[13px] font-semibold text-ink/80 md:left-2">Minh hoạ</span>
        </div>
      </div>
    </section>
  );
}

/** 4 lối vào theo nhóm khách: danh sách chữ lớn, mô tả ở cột phải */
export function HomeSegments() {
  return (
    <section className="container-site py-[clamp(72px,12vh,150px)]" aria-labelledby="don-vi">
      <h2 id="don-vi" className="font-display text-[clamp(30px,4.4vw,64px)] font-bold leading-[1.04] tracking-[-0.03em] text-muted">
        Chọn theo đơn vị của bạn
      </h2>
      <ul className="mt-6 md:mt-8">
        {SEGMENTS.map((s, i) => (
          <li key={s.key} {...rise(i)}>
            <Link href={s.href} className="group grid gap-x-10 gap-y-1.5 py-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-baseline md:py-4">
              <span className="font-display text-[clamp(30px,4.4vw,64px)] font-bold leading-[1.04] tracking-[-0.03em] transition-colors group-hover:text-brand-dark">
                {s.name}
                <span aria-hidden className="ml-3 inline-block text-[0.6em] transition-transform duration-200 group-hover:translate-x-2">
                  →
                </span>
              </span>
              <span className="max-w-md text-base leading-relaxed text-ink/80 md:text-lg">{s.pitch}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const VERBS = ["Thiết kế", "Gửi link", "Chốt đơn", "In & giao"];

/** Cách đặt áo nhóm: mỗi bước 1 động từ cỡ rất lớn, mô tả bên phải */
export function HomeSteps() {
  return (
    <section className="bg-ink py-[clamp(80px,14vh,170px)] text-white" aria-labelledby="cach-dat-ao-nhom">
      <div className="container-site">
        <h2 id="cach-dat-ao-nhom" className="max-w-4xl font-display text-[clamp(28px,3.4vw,48px)] font-bold leading-[1.1] tracking-[-0.025em] [text-wrap:balance]">
          Không phải gom tin nhắn hỏi size
        </h2>
        <ol className="mt-12 space-y-12 md:mt-16 md:space-y-16">
          {GROUP_STEPS.map((st, i) => (
            <li key={st.title} className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-end md:gap-12" {...rise(0)}>
              <p aria-hidden className="font-display text-[clamp(56px,9vw,136px)] font-bold leading-[0.9] tracking-[-0.045em]">
                {VERBS[i]}
              </p>
              <div className="md:pb-3">
                <h3 className="text-xl font-bold leading-snug">{st.title}</h3>
                <p className="mt-2 max-w-md text-base leading-relaxed text-white/80 md:text-lg">{st.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-14 flex flex-wrap gap-3">
          <Link href={`/thiet-ke/${GARMENT_PRODUCT.tshirt.slug}`} className="btn-primary px-7 py-3.5 text-base">
            Bắt đầu thiết kế
          </Link>
          <Link href="/dong-phuc-the-thao" className="btn border-white/60 bg-transparent px-7 py-3.5 text-base text-white hover:border-white hover:bg-white hover:text-ink">
            Xem áo đội in tên số
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Mẫu áo nhóm có sẵn + công cụ miễn phí (liên kết nội bộ cho SEO): 2 cột dòng nền nhạt, không kẻ viền */
export function HomeQuickStart() {
  const row = "group flex items-center justify-between gap-4 rounded-lg bg-surface px-5 py-4 transition-colors hover:bg-ink hover:text-white";
  const arrow = (
    <span aria-hidden className="shrink-0 text-lg transition-transform duration-200 group-hover:translate-x-1">
      →
    </span>
  );
  return (
    <section className="container-site grid gap-14 py-[clamp(72px,12vh,150px)] md:grid-cols-2 md:gap-12" aria-label="Bắt đầu nhanh">
      <div>
        <h2 id="bat-dau-nhanh" className="h-section">
          Mẫu áo nhóm có sẵn
        </h2>
        <p className="mt-2 text-base text-ink/80 md:text-lg">Sửa chữ, đổi màu áo, thêm tên từng người.</p>
        <ul className="mt-6 space-y-2">
          {DESIGN_HUBS.map((h, i) => (
            <li key={h.slug} {...rise(i)}>
              <Link href={`/${h.slug}`} className={`${row} text-lg font-semibold`}>
                {h.name}
                {arrow}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="h-section">Công cụ miễn phí</h2>
        <p className="mt-2 text-base text-ink/80 md:text-lg">Cho trưởng nhóm, lớp trưởng, HR chuẩn bị đơn.</p>
        <ul className="mt-6 space-y-2">
          {TOOL_LINKS.map((l, i) => (
            <li key={l.href} {...rise(i)}>
              <Link href={l.href} className={row}>
                <span>
                  <span className="block text-lg font-semibold">{l.title}</span>
                  <span className="mt-0.5 block text-[15px] opacity-80">{l.desc}</span>
                </span>
                {arrow}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
