"use client";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { GARMENT_ZONE, type LandingSettings } from "@pod/shared";
import { assetUrl } from "@/lib/config";

/**
 * Trước / sau: kéo thanh giữa để so sánh ảnh gốc của khách với áo in xong.
 * Chưa có ảnh "sau" -> tự ghép ảnh gốc vào vùng in ngực của phôi áo thun (minh hoạ, không cần chụp thật).
 */
export function BeforeAfter({ data, steps = [], blank }: { data: LandingSettings["beforeAfter"]; steps?: LandingSettings["steps"]; /** ảnh thật áo thun trắng (AI) */ blank?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const drag = useRef(false);
  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (r) setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  const onDown = (e: PointerEvent) => {
    drag.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    move(e.clientX);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
    if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
  };
  const z = GARMENT_ZONE.tshirt;

  return (
    <section className="relative overflow-hidden bg-sun py-14 md:py-24" aria-label={data.title}>
      <div className="container-site grid items-center gap-10 md:grid-cols-[1fr_1.1fr] md:gap-14">
        <div data-reveal>
          <h2 className="h-section">{data.title}</h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink/80 md:text-base">{data.subtitle}</p>
          {steps.length > 0 && (
            <ol className="mt-6 space-y-3">
              {steps.map((st, i) => (
                <li key={st.title} className="flex items-center gap-3 text-[15px] font-semibold">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-white font-display text-base font-extrabold">{i + 1}</span>
                  {st.title}
                </li>
              ))}
            </ol>
          )}
          {data.points.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {data.points.map((p) => (
                <li key={p} className="chip-sticker bg-white text-[13px] shadow-none">
                  {p}
                </li>
              ))}
            </ul>
          )}
          <Link href={data.href || "/thiet-ke"} className="btn-primary mt-7 px-7 py-3.5 text-base">
            {data.ctaLabel || "Thử ngay"}
          </Link>
        </div>
        <div
          ref={box}
          data-reveal="pop"
          className="sticker relative aspect-square touch-pan-y select-none overflow-hidden bg-white shadow-sticker-lg"
          onPointerDown={onDown}
          onPointerMove={(e) => drag.current && move(e.clientX)}
          onPointerUp={() => (drag.current = false)}
          onPointerCancel={() => (drag.current = false)}
        >
          {/* SAU: áo in xong */}
          <div className="absolute inset-0">
            {data.after ? (
              <img src={assetUrl(data.after)} alt={data.afterLabel} className="h-full w-full object-cover" draggable={false} />
            ) : (
              <svg viewBox="92 58 216 216" className="h-full w-full" role="img" aria-label={data.afterLabel}>
                <image href={blank ? assetUrl(blank) : "/shapes/basic/tshirt-trang.svg"} width="400" height="400" preserveAspectRatio="xMidYMid slice" />
                <defs>
                  <clipPath id="ba-zone">
                    <rect x={z.x * 400} y={z.y * 400} width={z.w * 400} height={z.w * 400 * 1.1} rx="3" />
                  </clipPath>
                </defs>
                {data.before && (
                  <image
                    href={assetUrl(data.before)}
                    x={z.x * 400}
                    y={z.y * 400}
                    width={z.w * 400}
                    height={z.w * 400 * 1.1}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="url(#ba-zone)"
                    style={{ mixBlendMode: "multiply" }}
                  />
                )}
              </svg>
            )}
          </div>
          {/* TRƯỚC: ảnh gốc, cắt theo thanh kéo */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            {data.before && <img src={assetUrl(data.before)} alt={data.beforeLabel} className="h-full w-full object-cover" draggable={false} />}
          </div>
          <span className="chip-sticker absolute left-3 top-3 -rotate-3 bg-white text-xs">{data.beforeLabel}</span>
          <span className="chip-sticker absolute right-3 top-3 rotate-3 bg-brand text-xs text-white">{data.afterLabel}</span>
          {/* thanh kéo */}
          <div className="absolute inset-y-0 w-1 -translate-x-1/2 bg-ink" style={{ left: `${pos}%` }}>
            <button
              type="button"
              role="slider"
              aria-label="Kéo để so sánh trước và sau"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pos)}
              onKeyDown={onKey}
              className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border-2 border-ink bg-white text-base font-bold shadow-sticker-sm"
            >
              ⇆
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
