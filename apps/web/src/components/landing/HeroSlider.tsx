"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { readableInk, type HeroSlide } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import { track } from "@/lib/track";

/**
 * Banner slider theo chiến dịch: cuộn ngang bằng scroll-snap (vuốt mượt trên mobile, không thư viện),
 * tự chạy khi đang hiển thị & người dùng không tương tác, tôn trọng "giảm chuyển động".
 */
export function HeroSlider({ slides, intervalMs = 6000 }: { slides: HeroSlide[]; intervalMs?: number }) {
  const track_ = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const paused = useRef(false);
  const n = slides.length;

  const go = useCallback((i: number) => {
    const el = track_.current;
    if (!el) return;
    const next = (i + n) % n;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }, [n]);

  // chỉ số slide theo vị trí cuộn (cả khi người dùng tự vuốt)
  useEffect(() => {
    const el = track_.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // tự chạy: dừng khi rê chuột/focus/chạm, khi tab ẩn, khi bật giảm chuyển động
  useEffect(() => {
    if (n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!paused.current && document.visibilityState === "visible") go(idx + 1);
    }, intervalMs);
    return () => clearInterval(t);
  }, [idx, n, intervalMs, go]);

  // đo lượt hiển thị từng slide (GA4 view_promotion)
  const seen = useRef(new Set<number>());
  useEffect(() => {
    if (seen.current.has(idx) || !slides[idx]) return;
    seen.current.add(idx);
    track.viewPromotion([{ id: slides[idx].href, name: slides[idx].title, slot: `hero_${idx + 1}` }]);
  }, [idx, slides]);

  if (!n) return null;
  const hold = (v: boolean) => () => (paused.current = v);

  return (
    <section
      className="relative"
      aria-roledescription="carousel"
      aria-label="Chiến dịch nổi bật"
      onMouseEnter={hold(true)}
      onMouseLeave={hold(false)}
      onFocusCapture={hold(true)}
      onBlurCapture={hold(false)}
      onTouchStart={hold(true)}
    >
      <div ref={track_} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
        {slides.map((s, i) => {
          const ink = readableInk(s.bg);
          const Title = i === 0 ? "h1" : "h2";
          return (
            <article key={i} className="w-full shrink-0 snap-start" style={{ backgroundColor: s.bg, color: ink }} aria-roledescription="slide" aria-label={`${i + 1} / ${n}: ${s.title}`}>
              <div className="container-site grid items-center gap-5 py-5 md:grid-cols-[1fr_1.15fr] md:gap-10 md:py-10">
                <div className="order-2 md:order-1">
                  {s.eyebrow && <p className="text-[13px] font-semibold opacity-75 md:text-sm">{s.eyebrow}</p>}
                  <Title className="mt-2 text-[clamp(30px,4.6vw,56px)] font-bold leading-[1.05] tracking-[-0.025em]">{s.title}</Title>
                  {s.subtitle && <p className="mt-3 max-w-md text-[15px] leading-relaxed opacity-85 md:text-lg">{s.subtitle}</p>}
                  {s.ctaLabel && s.href && (
                    <Link
                      href={s.href}
                      onClick={() => track.selectPromotion({ id: s.href, name: s.title, slot: `hero_${i + 1}` })}
                      className="btn-primary mt-5 px-6 py-3 text-[15px] md:mt-7"
                      tabIndex={i === idx ? 0 : -1}
                    >
                      {s.ctaLabel} <span aria-hidden>→</span>
                    </Link>
                  )}
                </div>
                <div className="relative order-1 aspect-[16/11] overflow-hidden rounded-2xl md:order-2 md:aspect-[5/4]">
                  {s.image && (
                    <img
                      src={assetUrl(s.image)}
                      alt=""
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ objectPosition: s.focus || "50% 50%" }}
                    />
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {n > 1 && (
        <div className="container-site flex items-center justify-between py-3">
          <div className="flex gap-1.5" role="tablist" aria-label="Chọn slide">
            {slides.map((s, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === idx}
                aria-label={`Slide ${i + 1}: ${s.title}`}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-7 bg-ink" : "w-3 bg-ink/25 hover:bg-ink/50"}`}
              />
            ))}
          </div>
          <div className="hidden gap-2 md:flex">
            <button type="button" onClick={() => go(idx - 1)} className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink hover:border-ink" aria-label="Slide trước">
              ←
            </button>
            <button type="button" onClick={() => go(idx + 1)} className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink hover:border-ink" aria-label="Slide sau">
              →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
