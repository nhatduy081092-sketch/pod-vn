"use client";
import { useEffect, useRef } from "react";

/**
 * Nút "Thêm vào giỏ" có xe đẩy (theo bộ Code XR add-to-cart-button, 11/2026), nền đen + chấm cam YALA.
 * Rê chuột / focus / chạm: chữ trượt sang phải, xe trống trượt ra, xe có hàng trượt vào (lò xo, nghiêng theo quán tính).
 * Chỉ là phần hình: bấm gọi onAdd() của trang như cũ; chỉ khi onAdd trả về true (đã thêm thật) thì
 * xe mới "nhận hàng" (nhún + bóng số bật lên). Số trên bóng là tổng số sản phẩm thật trong giỏ.
 */
const SLIDE = { k: 100, c: 8 };
const LEAN = { k: 300, c: 30 };
const ITEM = { k: 260, c: 15 };
const STEP = 1 / 240;
const TOUCH_HOLD_MS = 1100;
type S = { x: number; v: number };
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const step = (s: S, t: number, { k, c }: { k: number; c: number }, dt: number) => {
  s.v += (-k * (s.x - t) - c * s.v) * dt;
  s.x += s.v * dt;
};
const settled = (s: S, t: number) => Math.abs(s.x - t) < 1e-3 && Math.abs(s.v) < 1e-3;

export function CartButton({
  label,
  count,
  onAdd,
  className = "",
}: {
  label: string;
  /** tổng số sản phẩm trong giỏ (hiện trên bóng cam) */
  count: number;
  /** thêm vào giỏ; trả true nếu đã thêm (qua được kiểm tra) */
  onAdd: () => boolean | void;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const ballRef = useRef<SVGGElement>(null);
  const m = useRef({ slide: { x: 0, v: 0 }, lean: { x: 0, v: 0 }, sink: { x: 0, v: 0 }, target: 0, raf: 0, last: 0 });
  const inp = useRef({ hover: false, focus: false, touch: false, timer: 0 as ReturnType<typeof setTimeout> | 0 });
  const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const paint = () => {
    const el = ref.current;
    if (!el) return;
    const s = m.current;
    el.style.setProperty("--p", s.slide.x.toFixed(4));
    el.style.setProperty("--lean", `${s.lean.x.toFixed(2)}deg`);
    el.style.setProperty("--sink", `${s.sink.x.toFixed(2)}px`);
  };
  const tick = (now: number) => {
    const s = m.current;
    let dt = Math.min((now - s.last) / 1000, 1 / 20);
    s.last = now;
    while (dt > 0) {
      const h = Math.min(STEP, dt);
      const inertia = SLIDE.k * (s.slide.x - s.target) + SLIDE.c * s.slide.v;
      step(s.slide, s.target, SLIDE, h);
      step(s.lean, clamp(inertia * 0.34, -12, 12), LEAN, h);
      step(s.sink, clamp(inertia * 0.11, -2.5, 3), ITEM, h);
      dt -= h;
    }
    if (settled(s.slide, s.target) && settled(s.lean, 0) && settled(s.sink, 0)) {
      s.slide = { x: s.target, v: 0 };
      s.lean = { x: 0, v: 0 };
      s.sink = { x: 0, v: 0 };
      paint();
      s.raf = 0;
      return;
    }
    paint();
    s.raf = requestAnimationFrame(tick);
  };
  const start = () => {
    const s = m.current;
    if (s.raf) return;
    s.last = performance.now();
    s.raf = requestAnimationFrame(tick);
  };
  const sync = () => {
    const { hover, focus, touch } = inp.current;
    const t = hover || focus || touch ? 1 : 0;
    const s = m.current;
    if (t === s.target) return;
    s.target = t;
    if (reduced()) {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      s.slide = { x: t, v: 0 };
      paint();
      return;
    }
    start();
  };

  useEffect(() => {
    const s = m.current;
    const i = inp.current;
    return () => {
      cancelAnimationFrame(s.raf);
      if (i.timer) clearTimeout(i.timer);
    };
  }, []);

  // giỏ tăng -> bóng số bật lên (chạy lại animation bằng cách gỡ/gắn class)
  const prev = useRef(count);
  useEffect(() => {
    const b = ballRef.current;
    if (count > prev.current && b && !reduced()) {
      b.classList.remove("is-popping");
      void b.getBoundingClientRect();
      b.classList.add("is-popping");
    }
    prev.current = count;
  }, [count]);

  const label99 = count > 99 ? "99+" : count > 0 ? String(count) : "+";
  const fs = label99.length === 1 ? 5.8 : label99.length === 2 ? 4.6 : 3.6;

  return (
    <button
      ref={ref}
      type="button"
      className={`atc ${className}`}
      onPointerEnter={(e) => {
        if (e.pointerType === "touch") return;
        inp.current.hover = true;
        sync();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "touch") return;
        inp.current.hover = false;
        sync();
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "touch") return;
        if (inp.current.timer) clearTimeout(inp.current.timer);
        inp.current.touch = true;
        sync();
      }}
      onFocus={(e) => {
        inp.current.focus = e.currentTarget.matches(":focus-visible");
        sync();
      }}
      onBlur={() => {
        inp.current.focus = false;
        sync();
      }}
      onClick={() => {
        const ok = onAdd() === true;
        if (ok && !reduced()) {
          m.current.sink.v += 60;
          m.current.lean.v += 80;
          start();
        }
        if (inp.current.touch) {
          if (inp.current.timer) clearTimeout(inp.current.timer);
          inp.current.timer = setTimeout(() => {
            inp.current.touch = false;
            sync();
          }, TOUCH_HOLD_MS);
        }
      }}
    >
      <span className="atc__inner">
        <span className="atc__group atc__group--in" aria-hidden>
          <svg className="atc__icon" viewBox="0 0 24 24" overflow="visible">
            <g className="atc__item">
              <g ref={ballRef} className="atc__ball">
                <circle cx="13.7" cy="4" r="4.8" fill="#E4570B" />
                <text x="13.7" y="4" dy="0.36em" textAnchor="middle" fontSize={fs} fontWeight="700" fill="#fff">
                  {label99}
                </text>
              </g>
            </g>
            <g fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.05 2.05h2l2.66 12.42" fill="none" strokeWidth="2" />
              <path d="M5.4 6.3h16.3l-1.72 7.9a2 2 0 0 1-1.95 1.57H8.86a2 2 0 0 1-1.96-1.6Z" strokeWidth="1.6" />
              <circle cx="8" cy="21" r="1.9" stroke="none" />
              <circle cx="19" cy="21" r="1.9" stroke="none" />
            </g>
          </svg>
          <span className="atc__divider" />
        </span>
        <span className="atc__label">{label}</span>
        <span className="atc__group atc__group--out" aria-hidden>
          <span className="atc__divider" />
          <svg className="atc__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        </span>
      </span>
    </button>
  );
}
