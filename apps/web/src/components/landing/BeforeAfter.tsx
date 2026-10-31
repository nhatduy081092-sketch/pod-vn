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
    <section className="relative overflow-hidden bg-sky py-[clamp(80px,14vh,170px)]" aria-labelledby="anh-thanh-ao">
      <div className="container-site grid items-center gap-10 md:grid-cols-[1fr_1.1fr] md:gap-14">
        <div data-reveal="rise">
          <h2 id="anh-thanh-ao" className="font-display text-[clamp(30px,3.6vw,52px)] font-bold leading-[1.06] tracking-[-0.03em] [text-wrap:balance]">{data.title}</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink/80 md:text-lg">{data.subtitle}</p>
          {steps.length > 0 && (
            <ol className="mt-8 list-decimal space-y-2.5 pl-6 marker:font-bold">
              {steps.map((st) => (
                <li key={st.title} className="pl-1 text-base font-semibold md:text-[17px]">
                  {st.title}
                </li>
              ))}
            </ol>
          )}
          {data.points.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {data.points.map((p) => (
                <li key={p} className="rounded-md bg-white px-3 py-1.5 text-[15px] font-semibold">
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
          data-reveal="rise"
          className="relative aspect-square touch-pan-y select-none overflow-hidden rounded-lg bg-white"
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
          <span className="absolute left-3 top-3 rounded-md bg-white px-2.5 py-1 text-sm font-semibold">{data.beforeLabel}</span>
          <span className="absolute right-3 top-3 rounded-md bg-ink px-2.5 py-1 text-sm font-semibold text-white">{data.afterLabel}</span>
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
              className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border-2 border-ink bg-white text-base font-bold"
            >
              ⇆
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
