import Link from "next/link";
import type { ReactNode } from "react";
import { DESIGN_HUBS, GARMENT_PRODUCT, GROUP_MIN_QTY, GROUP_STEPS, SEGMENTS, type ColorKey, type GarmentKey, type Segment } from "@pod/shared";
import { GarmentMockup, PrintText } from "../designs/GarmentMockup";
import { TOOL_LINKS } from "../seo/ToolLinks";
import { TeamLineup } from "../group/TeamLineup";

/*
 * Trang chủ (redesign 31/10/2026 – hướng "vật thể thật to"): áo nhóm in tên từng người là vật thể chính,
 * phóng to tràn mép phải; các khối sau là danh sách chữ lớn, không thẻ icon, không viền, không bóng.
 * Khối nào cũng có tiêu đề riêng; chuyển động = data-reveal="rise" (tắt khi giảm chuyển động).
 */

export const rise = (i: number) => ({ "data-reveal": "rise", style: { ["--d" as string]: `${i * 70}ms` } });

/**
 * Khuôn đầu trang "vật thể thật to" (trang chủ, trang SEO mẫu áo, trang nhóm khách): tiêu đề + nội dung bên trái,
 * 3 áo in tên/số phóng to tràn mép phải, mở kiểu màn trập. `before` = đường dẫn (breadcrumb) phía trên tiêu đề.
 */
export function ObjectHero({ id, title, lineup, before, children }: { id: string; title: ReactNode; lineup: Segment["lineup"]; before?: ReactNode; children: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-surface" aria-labelledby={id}>
      <div className="container-site grid items-center gap-6 pt-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-4 md:pt-16 lg:min-h-[min(74svh,720px)]">
        <div className="relative z-10 md:pb-16">
          {before}
          <h1 id={id} className="font-display text-[clamp(40px,5vw,76px)] font-bold leading-[1.02] tracking-[-0.035em] [text-wrap:balance]">
            {title}
          </h1>
          {children}
        </div>
        {/* vật thể: rộng hơn cột, tràn mép phải + bị cắt đáy */}
        <div className="home-shutter relative -mx-4 -mb-[6%] md:-mr-[6vw] md:ml-0 md:self-end">
          <div className="w-[118%] max-w-none md:w-[112%]">
            <TeamLineup team={lineup.team} color={lineup.color} people={lineup.people} />
          </div>
          <span className="absolute bottom-[12%] left-4 z-10 rounded-md bg-white px-2 py-0.5 text-[13px] font-semibold text-ink/80 md:left-2">Minh hoạ</span>
        </div>
      </div>
    </section>
  );
}

/** Câu đỡ ngay dưới tiêu đề + hàng nút */
export const heroLead = "mt-6 max-w-[34rem] text-lg leading-relaxed text-ink md:text-xl";
export const heroActions = "mt-8 flex flex-wrap items-center gap-3";

/** Đầu trang chủ: áo đội in tên/số */
export function HomeHero({ zalo }: { zalo?: string }) {
  const sport = SEGMENTS.find((s) => s.key === "the-thao")!;
  return (
    <ObjectHero id="home-title" title="Áo nhóm, mỗi người đúng tên" lineup={sport.lineup}>
      <p className={heroLead}>
        Doanh nghiệp, CLB, lớp, team building: thiết kế trên web, gửi 1 link để cả nhóm tự ghi tên – size. YALA in và giao tận nơi, đơn nhóm từ {GROUP_MIN_QTY} sản phẩm.
      </p>
      <div className={heroActions}>
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
    </ObjectHero>
  );
}

const INK = "#1f1f22";
const CHALK = "#f4f2ee";
const ORANGE = "#E4570B";
/** phóng vào thân áo (4:5) để hình in đủ to trong ô */
const CHEST: [number, number, number, number] = [0.2, 0.12, 0.6, 0.75];

/**
 * Mockup in trên áo trơn thật cho từng nhóm khách (thay ảnh người mẫu AI) – tên đội/lớp lấy từ lineup mẫu của nhóm,
 * không phải khách thật. Hình in vẽ theo mm của vùng in (áo thun 300×380, hoodie 300×250).
 */
const SEGMENT_MOCKUP: Record<string, { garment: GarmentKey; color: ColorKey; print: ReactNode }> = {
  // logo ngực trái (bên phải người xem), trắng + dấu cam trên áo đen
  "doanh-nghiep": {
    garment: "tshirt",
    color: "den",
    print: (
      <g>
        <circle cx={218} cy={46} r={22} fill={ORANGE} />
        <path d="M205 46h26M218 33v26" stroke={CHALK} strokeWidth={4.5} />
        <PrintText x={218} y={94} size={15} fill={CHALK} spacing={1.5}>
          CÔNG TY BẠN
        </PrintText>
      </g>
    ),
  },
  "the-thao": {
    garment: "tshirt",
    color: "navy",
    print: (
      <g>
        <PrintText x={150} y={46} size={26} fill={CHALK} spacing={3}>
          YALA FC
        </PrintText>
        <PrintText x={150} y={232} size={190} fill={CHALK} spacing={-6} stretch={80}>
          10
        </PrintText>
        <PrintText x={150} y={290} size={40} fill={ORANGE} spacing={2}>
          TÙNG
        </PrintText>
      </g>
    ),
  },
  "hoi-nhom": {
    garment: "tshirt",
    color: "trang",
    print: (
      <g>
        <PrintText x={150} y={140} size={108} fill={INK} spacing={-4}>
          12A1
        </PrintText>
        <rect x={60} y={162} width={180} height={5} fill={ORANGE} />
        <PrintText x={150} y={204} size={24} weight={700} fill={INK} spacing={5}>
          NIÊN KHOÁ 2026
        </PrintText>
        <PrintText x={150} y={250} size={30} fill={INK} spacing={2}>
          HÀ
        </PrintText>
      </g>
    ),
  },
  "su-kien": {
    garment: "hoodie",
    color: "xam",
    print: (
      <g>
        <path d="M70 92l52-62 30 34 22-22 56 50" fill="none" stroke={ORANGE} strokeWidth={9} strokeLinejoin="round" />
        <PrintText x={150} y={160} size={64} fill={INK} spacing={-1}>
          TRIP 2026
        </PrintText>
        <PrintText x={150} y={204} size={26} weight={700} fill={INK} spacing={6}>
          ĐỘI XÁM
        </PrintText>
      </g>
    ),
  },
};

/** 4 lối vào theo nhóm khách: mockup áo lớn + tên nhóm, không câu mô tả (mô tả nằm ở trang của từng nhóm) */
export function HomeSegments() {
  return (
    <section className="container-site py-[clamp(72px,12vh,150px)]" aria-labelledby="don-vi">
      <h2 id="don-vi" className="font-display text-[clamp(28px,3.2vw,44px)] font-bold leading-[1.1] tracking-[-0.025em]">
        Chọn theo đơn vị của bạn
      </h2>
      <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:mt-10 md:gap-x-5 lg:grid-cols-4">
        {SEGMENTS.map((s, i) => {
          const mk = SEGMENT_MOCKUP[s.key];
          return (
            <li key={s.key} {...rise(i)}>
              <Link href={s.href} className="group block" title={s.pitch}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-sun">
                  {mk && (
                    <GarmentMockup
                      id={`seg-${s.key}`}
                      garment={mk.garment}
                      color={mk.color}
                      view={CHEST}
                      label={`Mẫu áo ${s.name.toLowerCase()} in trên áo trơn`}
                      className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
                    >
                      {mk.print}
                    </GarmentMockup>
                  )}
                  <span className="absolute right-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[13px] font-semibold text-ink/75">Minh hoạ</span>
                </div>
                <p className="mt-3 font-display text-[clamp(20px,1.9vw,28px)] font-bold leading-tight tracking-[-0.02em] transition-colors group-hover:text-brand-dark">
                  {s.name}
                  <span aria-hidden className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1.5">
                    →
                  </span>
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const VERBS = ["Thiết kế", "Gửi link", "Chốt đơn", "In & giao"];

/**
 * Cách đặt áo nhóm (trang chủ + trang SEO mẫu áo, nhóm khách): 4 cột ngang, vạch cam vẽ dần theo thứ tự bước,
 * động từ cỡ vừa màu trắng đá (không trắng tinh, không ngả vàng) và mô tả xám ấm -> nền đen đỡ chói, cam chỉ ở vạch + nhãn bước + nút.
 */
export function HomeSteps() {
  return (
    <section className="bg-ink py-[clamp(72px,12vh,140px)] text-[#e8e6e3]" aria-labelledby="cach-dat-ao-nhom">
      <div className="container-site">
        <h2 id="cach-dat-ao-nhom" className="max-w-4xl font-display text-[clamp(28px,3.2vw,44px)] font-bold leading-[1.1] tracking-[-0.025em] [text-wrap:balance]">
          Không phải gom tin nhắn hỏi size
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#e8e6e3]/80 md:text-lg">Bốn bước, một đường link: cả nhóm tự ghi tên và size, trưởng nhóm chỉ việc chốt đơn.</p>
        {/* thứ tự đọc ra từ vị trí + vạch cam vẽ lần lượt, không cần nhãn "Bước n" */}
        <ol className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
          {GROUP_STEPS.map((st, i) => (
            <li key={st.title} {...rise(i + 1)}>
              <span className="draw-rule mb-5 bg-brand" aria-hidden />
              <p aria-hidden className="font-display text-[clamp(30px,2.6vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]">
                {VERBS[i]}
              </p>
              <h3 className="mt-3 max-w-xs text-[17px] font-semibold leading-snug text-[#e8e6e3]/80">{st.title}</h3>
            </li>
          ))}
        </ol>
        <div className="mt-14 flex flex-wrap gap-3">
          <Link href={`/thiet-ke/${GARMENT_PRODUCT.tshirt.slug}`} className="btn-primary px-7 py-3.5 text-base">
            Bắt đầu thiết kế
          </Link>
          <Link href="/dong-phuc-the-thao" className="btn border-white/30 bg-transparent px-7 py-3.5 text-base text-[#e8e6e3] hover:border-white hover:bg-white hover:text-ink">
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
                <span className="text-lg font-semibold">{l.title}</span>
                {arrow}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
