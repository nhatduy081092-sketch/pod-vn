"use client";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { GARMENT_ZONE, type LandingSettings } from "@pod/shared";
import { assetUrl } from "@/lib/config";

/**
 * Trước / sau: kéo thanh giữa để so sánh ảnh gốc của khách với áo in xong.
 * Chưa có ảnh "sau" -> tự ghép ảnh gốc vào vùng in ngực của phôi áo thun (minh hoạ, không cần chụp thật).
 */
export function BeforeAfter({ data }: { data: LandingSettings["beforeAfter"] }) {
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
    <section className="py-12 md:py-20" aria-label={data.title}>
      <div className="container-site grid items-center gap-8 md:grid-cols-[1fr_1.1fr] md:gap-14">
        <div>
          <p className="eyebrow">{data.eyebrow}</p>
          <h2 className="h-section mt-1.5">{data.title}</h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted md:text-base">{data.subtitle}</p>
          {data.points.length > 0 && (
            <ul className="mt-5 space-y-2 text-[15px]">
              {data.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          )}
          <Link href={data.href || "/thiet-ke"} className="btn-primary mt-6 px-6 py-3">
            {data.ctaLabel || "Thử ngay"} <span aria-hidden>→</span>
          </Link>
        </div>

        <div
          ref={box}
          className="relative aspect-square touch-pan-y select-none overflow-hidden rounded-2xl bg-surface"
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
                <image href="/shapes/basic/tshirt-trang.svg" width="400" height="400" />
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
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold">{data.beforeLabel}</span>
          <span className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">{data.afterLabel}</span>
          {/* thanh kéo */}
          <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.08)]" style={{ left: `${pos}%` }}>
            <button
              type="button"
              role="slider"
              aria-label="Kéo để so sánh trước và sau"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pos)}
              onKeyDown={onKey}
              className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full bg-white text-sm shadow-soft"
            >
              ⇆
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
