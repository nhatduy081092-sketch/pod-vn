"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { assetUrl } from "@/lib/config";

type Item = { name: string; slug: string; image: string; count: number };

/**
 * Carousel kính 3D (theo bộ Code XR glassy-carousel-v2, 11/2026) cho ngành hàng in logo ở khối doanh nghiệp.
 * Thẻ xếp trên vòng cung theo độ lệch so với thẻ giữa; chỉ dùng transform + opacity (CSS transition),
 * không thêm thư viện. Thẻ giữa là link sang danh sách mẫu của ngành, thẻ bên bấm vào để đưa ra giữa.
 * Vuốt ngang ≥ 45px để chuyển (dọc vẫn cuộn trang), phím ←/→ khi đang ở trong carousel.
 */
const ARC = [
  { x: 0, z: 0, r: 0, s: 1, o: 1 },
  { x: 1, z: -100, r: 22, s: 0.88, o: 0.88 },
  { x: 1.8, z: -200, r: 36, s: 0.74, o: 0.62 },
  { x: 2.5, z: -300, r: 46, s: 0.6, o: 0.32 },
];
const FAR = { x: 3, z: -400, r: 55, s: 0.45, o: 0 };
const SWIPE = 45;

export function GlassCarousel({ items }: { items: Item[] }) {
  const n = items.length;
  const [active, setActive] = useState(0);
  const [xo, setXo] = useState(250);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const go = useCallback((step: number) => setActive((a) => (a + step + n) % n), [n]);

  // khoảng cách giữa các thẻ theo bề rộng khung
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      setXo(w < 480 ? 150 : w < 768 ? 200 : w < 1100 ? 260 : 300);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  };
  const onUp = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) >= SWIPE && Math.abs(dx) > Math.abs(e.clientY - d.y)) {
      swiped.current = true; // chặn cú click ngay sau khi vuốt
      go(dx < 0 ? 1 : -1);
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") (e.preventDefault(), go(1));
    else if (e.key === "ArrowLeft") (e.preventDefault(), go(-1));
  };

  const cur = items[active];
  return (
    <div role="region" aria-roledescription="carousel" aria-label="Ngành hàng in logo" onKeyDown={onKey}>
      <div
        ref={stage}
        className="glass-stage relative h-[320px] select-none md:h-[366px]"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => (drag.current = null)}
        onClickCapture={(e) => {
          if (swiped.current) {
            e.preventDefault();
            e.stopPropagation();
            swiped.current = false;
          }
        }}
      >
        {items.map((t, i) => {
          let d = i - active;
          if (d > n / 2) d -= n;
          if (d < -n / 2) d += n;
          const a = Math.abs(d);
          const p = ARC[a] ?? FAR;
          const sign = Math.sign(d);
          const on = d === 0;
          return (
            <Link
              key={t.slug}
              href={`/doanh-nghiep/san-pham?nganh=${t.slug}`}
              draggable={false}
              tabIndex={on ? 0 : -1}
              aria-hidden={on ? undefined : true}
              data-on={on || undefined}
              onClick={(e) => {
                if (!on) {
                  e.preventDefault();
                  setActive(i);
                }
              }}
              className="glass-card group absolute left-1/2 top-0 block w-[240px] p-3 md:w-[290px]"
              style={{
                transform: `translateX(-50%) translateX(${sign * p.x * xo}px) translateZ(${p.z}px) rotateY(${-sign * p.r}deg) scale(${p.s})`,
                opacity: p.o,
                zIndex: 10 - a,
                pointerEvents: p.o === 0 ? "none" : undefined,
              }}
            >
              <span className="block aspect-square overflow-hidden rounded-[18px] bg-white">
                <img src={assetUrl(t.image)} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-contain p-[9%]" />
              </span>
              <span className="mt-3 block px-1 font-display text-[17px] font-bold leading-tight text-white">{t.name}</span>
              <span className="mt-0.5 block px-1 pb-1 text-[15px] text-white/70">{t.count} mẫu in được logo</span>
            </Link>
          );
        })}
      </div>

      {/* thanh điều khiển kính: trước – ngành đang chọn – sau */}
      {/* điện thoại: chừa 64px mép phải cho cột nút liên hệ nổi (Gọi lại, Messenger, Zalo) */}
      <div className="glass-dock mt-6 flex items-center gap-2 p-1.5 max-sm:mr-16 sm:mx-auto sm:w-full sm:max-w-[560px] md:mt-8">
        <button type="button" onClick={() => go(-1)} aria-label="Ngành trước" className="glass-dock-btn">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <Link href={`/doanh-nghiep/san-pham?nganh=${cur.slug}`} className="group/dock flex min-w-0 flex-1 items-center gap-3 rounded-full px-1" aria-live="polite">
          <img src={assetUrl(cur.image)} alt="" className="hidden h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-0.5 sm:block" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold leading-tight">{cur.name}</span>
            <span className="block text-[13px] tabular-nums text-white/70">
              {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
              <span className="font-semibold text-white sm:hidden"> · Xem mẫu →</span>
            </span>
          </span>
          <span className="hidden shrink-0 rounded-full bg-brand-dark px-4 py-2.5 text-[15px] font-semibold text-white transition-colors group-hover/dock:bg-white group-hover/dock:text-ink sm:block">
            Xem mẫu
          </span>
        </Link>
        <button type="button" onClick={() => go(1)} aria-label="Ngành sau" className="glass-dock-btn">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
    </div>
  );
}
