import Link from "next/link";
import { GARMENT_PRODUCT, GROUP_MIN_QTY, GROUP_STEPS, SEGMENTS } from "@pod/shared";
import { pastel } from "@/lib/pastel";
import { TeamLineup } from "../group/TeamLineup";

/**
 * Đầu trang chủ (định vị 10/2026): YALA làm áo & đồ in cho tập thể.
 * Lời hứa + ảnh minh hoạ áo in tên/số từng người + 4 lối vào theo nhóm khách.
 */
export function GroupHero({ zalo }: { zalo?: string }) {
  const sport = SEGMENTS.find((s) => s.key === "the-thao")!;
  return (
    <section className="border-b border-line bg-cream" aria-label="YALA làm áo nhóm">
      <div className="container-site grid items-center gap-6 pb-6 pt-7 md:grid-cols-[1.1fr_1fr] md:gap-10 md:pb-10 md:pt-12">
        <div>
          <p className="eyebrow">Đồng phục & áo nhóm in theo yêu cầu</p>
          <h1 className="mt-3 font-display text-[clamp(30px,4vw,50px)] font-extrabold leading-[1.15] tracking-[-0.02em] [font-stretch:86%] [text-wrap:balance]">
            Áo đồng phục cho cả tập thể – mỗi người đúng tên, đúng size
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/80 md:text-lg">
            Doanh nghiệp, CLB thể thao, lớp – hội nhóm, team building: thiết kế ngay trên web, gửi 1 link để mọi người tự ghi tên – size, YALA in và giao tận nơi. Đơn nhóm từ {GROUP_MIN_QTY} sản phẩm.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href={`/thiet-ke/${GARMENT_PRODUCT.tshirt.slug}`} className="btn-primary px-6 py-3">
              Thiết kế áo nhóm
            </Link>
            <Link href="/doanh-nghiep#bao-gia" className="btn-outline bg-white px-6 py-3">
              Nhận báo giá
            </Link>
            {zalo && (
              <a href={zalo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-3 text-sm font-semibold underline underline-offset-4 hover:text-brand">
                Chat Zalo
              </a>
            )}
          </div>
          <ul className="mt-6 flex max-w-xl flex-wrap gap-x-6 gap-y-2 text-[15px] text-ink/85">
            {["Xem mẫu trước khi đặt", "Có hoá đơn VAT", "Giao hàng toàn quốc"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-brand-dark" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m5 12 5 5L20 7" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-white px-3 py-4 shadow-sticker md:p-6">
          <TeamLineup team={sport.lineup.team} color={sport.lineup.color} people={sport.lineup.people} />
        </div>
      </div>

      {/* 4 lối vào theo nhóm khách */}
      <div className="container-site pb-8 md:pb-12">
        <p className="text-base font-semibold text-ink">Chọn theo đơn vị của bạn</p>
        <ul className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
          {SEGMENTS.map((s, i) => (
            <li key={s.key}>
              <Link href={s.href} className={`group flex h-full flex-col rounded-2xl border border-line p-3.5 shadow-sticker-sm transition hover:-translate-y-0.5 md:p-5 ${pastel(i)}`}>
                <span className="font-display text-[clamp(18px,2vw,26px)] font-extrabold leading-tight [font-stretch:88%]">{s.name}</span>
                <span className="mt-1 flex-1 text-sm leading-snug text-ink/75 md:text-[15px]">{s.pitch}</span>
                <span className="mt-3 text-sm font-bold">
                  Xem giải pháp <span className="inline-block transition group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** 4 bước đặt áo nhóm (link nhóm thu tên/size) */
export function GroupSteps() {
  return (
    <section className="bg-ink py-12 text-white md:py-16" aria-labelledby="cach-dat-ao-nhom">
      <div className="container-site">
        <p className="text-sm font-semibold text-brand">Cách đặt áo nhóm</p>
        <h2 id="cach-dat-ao-nhom" className="mt-1.5 max-w-3xl font-display text-[clamp(24px,3vw,36px)] font-extrabold leading-[1.15] tracking-[-0.02em] [font-stretch:88%] [text-wrap:balance]">
          Trưởng nhóm không phải gom tin nhắn hỏi size từng người
        </h2>
        <ol className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6 md:mt-8 md:gap-6 lg:grid-cols-4">
          {GROUP_STEPS.map((st, i) => (
            <li key={st.title}>
              <span className="font-display text-4xl font-extrabold text-brand md:text-5xl">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-1.5 text-[16px] font-bold leading-snug md:mt-2 md:text-lg">{st.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/70 md:text-[15px]">{st.desc}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/thiet-ke/${GARMENT_PRODUCT.tshirt.slug}`} className="btn-primary px-6 py-3">
            Bắt đầu thiết kế
          </Link>
          <Link href="/dong-phuc-the-thao" className="btn border-white/40 bg-transparent px-6 py-3 text-white hover:border-white">
            Xem áo đội in tên số
          </Link>
        </div>
      </div>
    </section>
  );
}
