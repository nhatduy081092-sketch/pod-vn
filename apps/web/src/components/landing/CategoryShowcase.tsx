"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import {
  isVeryLight,
  MOCK_SHAPES,
  pickShowcaseColors,
  readableInk,
  showcaseAspect,
  showcaseMdSpans,
  showcaseSpans,
  type LandingSettings,
  type ShowcaseColor,
  type ShowcaseTile,
} from "@pod/shared";
import { assetUrl } from "@/lib/config";
import { track } from "@/lib/track";

type Props = {
  data: LandingSettings["showcase"];
  counts?: Record<string, number>;
  colors?: Record<string, ShowcaseColor[]>;
};

// Tailwind cần tên class đầy đủ lúc build
const LG_SPAN: Record<number, string> = { 2: "lg:col-span-2", 3: "lg:col-span-3", 6: "lg:col-span-6" };
const MD_SPAN: Record<number, string> = { 1: "md:col-span-1", 2: "md:col-span-2" };

/** Link ô: link riêng > trang danh mục (nếu danh mục có hàng) > tìm theo tên; kèm ?mau= khi đã chọn màu */
function tileHref(t: ShowcaseTile, exists: boolean, color?: string) {
  const base = t.href || (t.categorySlug && exists ? `/danh-muc/${t.categorySlug}` : `/san-pham?q=${encodeURIComponent(t.title)}`);
  if (!color) return base;
  const [path, qs = ""] = base.split("?");
  const p = new URLSearchParams(qs);
  p.set("mau", color);
  return `${path}?${p.toString()}`;
}

/** Khối "Dòng sản phẩm": ảnh người mẫu + dải màu áo thật, chọn màu -> vào thẳng danh mục đã lọc màu */
export function CategoryShowcase({ data, counts = {}, colors = {} }: Props) {
  const ref = useRef<HTMLElement>(null);
  const tiles = data.tiles;
  const spans = showcaseSpans(tiles.length);
  const mdSpans = showcaseMdSpans(tiles.length);

  // view_promotion 1 lần khi khối lọt vào màn hình (mẫu số cho CTR từng ô)
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        track.viewPromotion(tiles.map((t, i) => ({ id: t.categorySlug || t.title, name: t.title, slot: `showcase_${i + 1}` })));
        io.disconnect();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [tiles]);

  if (!data.enabled || !tiles.length) return null;
  return (
    <section ref={ref} className="bg-cream pb-8 md:pb-12" aria-labelledby="showcase-title">
      <div className="container-site">
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-ink/55 md:text-sm">{data.eyebrow}</p>
        <h2 id="showcase-title" className="mt-1 text-center text-[clamp(22px,5.5vw,36px)] font-black leading-tight tracking-tight">
          {data.title}
        </h2>
        <ul className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:items-stretch md:mt-6 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-6 lg:gap-5">
          {tiles.map((t, i) => (
            <li key={`${t.title}-${i}`} className={`w-[84%] shrink-0 snap-start sm:w-[62%] md:w-auto ${MD_SPAN[mdSpans[i]!]} ${LG_SPAN[spans[i]!]}`}>
              <Tile
                tile={t}
                index={i}
                lgSpan={spans[i]!}
                mdSpan={mdSpans[i]!}
                count={t.categorySlug ? counts[t.categorySlug] : undefined}
                colors={pickShowcaseColors(colors[t.categorySlug], t.colors, data.autoColors)}
                filterable={data.autoColors && (colors[t.categorySlug]?.length ?? 0) >= 2}
                eager={i < 2}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * filterable = dải màu lấy từ phân loại thật -> chọn màu sẽ lọc danh mục theo màu đó.
 * Không filterable (VD áo in toàn thân chỉ có màu "Theo thiết kế") -> dải màu chỉ để tham khảo,
 * không cho chọn, tránh dẫn khách tới trang lọc 0 sản phẩm.
 */
function Tile({ tile: t, index, lgSpan, mdSpan, count, colors, filterable, eager }: { tile: ShowcaseTile; index: number; lgSpan: number; mdSpan: number; count?: number; colors: ShowcaseColor[]; filterable: boolean; eager: boolean }) {
  const [sel, setSel] = useState(-1);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const ink = readableInk(t.bg);
  const exists = count !== undefined && count > 0;
  const chosen = filterable && sel >= 0 ? colors[sel] : undefined;
  const href = tileHref(t, exists, chosen?.name);
  const shape = t.shape in MOCK_SHAPES ? t.shape : "tshirt";
  const max = lgSpan >= 3 ? 9 : 7;
  const shown = colors.length > max ? colors.slice(0, max - 1) : colors;
  const more = colors.length - shown.length;

  // Khung ngang (≥ 1.5:1) → chữ bên trái, nền mờ ngang; khung vuông/4:3 → chữ dải trên, nền mờ dọc
  // (người mẫu nằm giữa/phải-dưới như ảnh gốc). Tính riêng từng breakpoint vì tỉ lệ khung đổi theo màn hình.
  // Mobile giữ đúng bố cục ảnh như desktop (ảnh ngang 16:10 / ảnh vuông 1:1) để chữ không đè người mẫu
  const aspects = { sm: showcaseAspect(Math.min(lgSpan, 3)), md: mdSpan === 2 ? "2 / 1" : "1 / 1", lg: showcaseAspect(lgSpan) };
  const vars: Record<string, string> = { backgroundColor: t.bg };
  for (const [bp, a] of Object.entries(aspects)) {
    const [w, h] = a.split("/").map(Number);
    const side = w! / h! >= 1.5;
    vars[`--a-${bp}`] = a;
    vars[`--jc-${bp}`] = side ? "center" : "flex-start";
    vars[`--mw-${bp}`] = side ? "58%" : "78%";
    vars[`--sc-${bp}`] = side
      ? `linear-gradient(90deg, ${t.bg} 0%, ${t.bg}b3 30%, ${t.bg}00 60%)`
      : `linear-gradient(180deg, ${t.bg}e6 0%, ${t.bg}80 20%, ${t.bg}00 42%)`;
  }
  const box = vars as CSSProperties;

  // Radio group: ← → chọn màu kế bên, Home/End đầu/cuối (roving tabindex)
  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number | null = null;
    const cur = Math.max(0, sel);
    if (e.key in keys) next = (cur + keys[e.key]! + shown.length) % shown.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = shown.length - 1;
    if (next === null) return;
    e.preventDefault();
    setSel(next);
    btns.current[next]?.focus();
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[14px] border-2 border-ink bg-white shadow-[4px_4px_0_#1d1d1f]">
      {/* Ảnh + chữ: cả vùng ảnh bấm được (::after của nút CTA phủ khung – khung "isolate" để ảnh/nền nằm dưới chữ) */}
      <div className="group relative isolate aspect-[var(--a-sm)] overflow-hidden border-b-2 border-ink [container-type:inline-size] md:aspect-[var(--a-md)] lg:aspect-[var(--a-lg)]" style={box}>
        <img
          src={assetUrl(t.image)}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-500 [@media(hover:hover)]:group-hover:scale-[1.04]"
          style={{ objectPosition: t.focus || "50% 50%" }}
        />
        {/* lớp nền mờ phía chữ – giữ chữ đọc được dù ảnh bị cắt khác nhau theo màn hình */}
        <div className="pointer-events-none absolute inset-0 -z-10 [background:var(--sc-sm)] md:[background:var(--sc-md)] lg:[background:var(--sc-lg)]" aria-hidden />
        <div
          className="flex h-full max-w-[var(--mw-sm)] flex-col [justify-content:var(--jc-sm)] gap-[2cqw] p-[5cqw] md:max-w-[var(--mw-md)] md:[justify-content:var(--jc-md)] lg:max-w-[var(--mw-lg)] lg:[justify-content:var(--jc-lg)]"
          style={{ color: ink }}
        >
          {exists && <p className="text-[clamp(10px,2.6cqw,13px)] font-bold uppercase tracking-wider opacity-70">{count} mẫu</p>}
          <h3 className="text-[clamp(20px,7.2cqw,40px)] font-black leading-[1.05] tracking-tight">{t.title}</h3>
          {t.subtitle && <p className="text-[clamp(12px,3.4cqw,17px)] font-medium leading-snug opacity-85">{t.subtitle}</p>}
          <Link
            href={href}
            onClick={() => track.selectPromotion({ id: t.categorySlug || t.title, name: t.title, slot: `showcase_${index + 1}`, color: chosen?.name })}
            className={`mt-[1.5cqw] inline-flex w-fit items-center gap-1.5 rounded-full border-2 px-[clamp(12px,3.6cqw,20px)] py-[clamp(6px,1.6cqw,9px)] text-[clamp(12px,3.2cqw,15px)] font-extrabold transition after:absolute after:inset-0 after:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              ink === "#ffffff" ? "border-white bg-white text-ink group-hover:bg-brand" : "border-ink bg-ink text-white group-hover:bg-white group-hover:text-ink"
            }`}
          >
            {chosen ? `Xem màu ${chosen.name}` : t.ctaLabel || "Xem ngay"} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {/* Dải màu: áo tô đúng màu thật, chọn màu -> nút CTA đổi sang link đã lọc */}
      <div className="flex flex-1 flex-col justify-between gap-2 p-3 md:p-3.5">
        {shown.length > 0 && !filterable && (
          <ul className="flex items-center gap-1.5" aria-label={`Màu tham khảo ${t.title}`}>
            {shown.map((c, k) => (
              <li key={`${c.name}-${k}`} title={c.name} className="relative aspect-square min-w-0 flex-[0_1_44px] rounded-lg border-2 border-transparent bg-[#f6f6f7]">
                <SwatchShape shape={shape} hex={c.hex} />
                <span className="sr-only">{c.name}</span>
              </li>
            ))}
            {more > 0 && (
              <li className="flex aspect-square min-w-0 flex-[0_1_44px] items-center justify-center text-xs font-bold text-ink/60" aria-label={`và ${more} màu khác`}>
                +{more}
              </li>
            )}
          </ul>
        )}
        {shown.length > 0 && filterable && (
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label={`Màu ${t.title}`} onKeyDown={onKey}>
            {shown.map((c, k) => (
              <button
                key={`${c.name}-${k}`}
                ref={(el) => {
                  btns.current[k] = el;
                }}
                type="button"
                role="radio"
                aria-checked={sel === k}
                aria-label={c.count ? `${c.name} – ${c.count} mẫu` : c.name}
                title={c.name}
                tabIndex={sel === k || (sel < 0 && k === 0) ? 0 : -1}
                onClick={() => setSel(sel === k ? -1 : k)}
                className={`relative aspect-square min-w-0 flex-[0_1_44px] rounded-lg border-2 bg-[#f6f6f7] transition ${
                  sel === k ? "border-ink shadow-[2px_2px_0_#1d1d1f]" : "border-transparent hover:border-ink/30"
                }`}
              >
                <SwatchShape shape={shape} hex={c.hex} />
              </button>
            ))}
            {more > 0 && (
              <Link href={tileHref(t, exists)} className="flex aspect-square min-w-0 flex-[0_1_44px] items-center justify-center rounded-lg border-2 border-dashed border-ink/25 text-xs font-bold text-ink/70 hover:border-ink" aria-label={`Xem thêm ${more} màu`}>
                +{more}
              </Link>
            )}
          </div>
        )}
        <p className="text-xs leading-snug text-ink/65 md:text-[13px]" aria-live="polite">
          {chosen ? (
            <>
              Đã chọn <b className="text-ink">{chosen.name}</b>
              {chosen.count ? ` · ${chosen.count} mẫu có màu này` : ""}
            </>
          ) : (
            t.tagline
          )}
        </p>
      </div>
    </article>
  );
}

/** Dáng áo tô màu (mask SVG) + nét viền/đổ bóng */
function SwatchShape({ shape, hex }: { shape: string; hex: string }) {
  return (
    <>
      <span
        className="absolute inset-[9%]"
        style={{
          backgroundColor: hex,
          WebkitMask: `url(/shapes/mask-${shape}.svg) center / contain no-repeat`,
          mask: `url(/shapes/mask-${shape}.svg) center / contain no-repeat`,
        }}
        aria-hidden
      />
      <img src={`/shapes/line-${shape}.svg`} alt="" className={`absolute inset-[9%] h-[82%] w-[82%] ${isVeryLight(hex) ? "" : "opacity-80"}`} aria-hidden />
    </>
  );
}
