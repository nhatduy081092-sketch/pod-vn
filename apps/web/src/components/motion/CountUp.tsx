"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Số liệu đếm từ 0 lên khi cuộn tới (count-up: 1.6s, power2.out, giữ phần chữ "+ năm" đứng yên).
 * Máy chủ luôn trả giá trị cuối ("15+ năm") -> Google / không JS / giảm chuyển động đều đọc đúng.
 * Không phải số ("Từ 10 áo"?) vẫn đếm phần số đầu tiên; chuỗi không có số thì hiện nguyên.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const m = value.match(/^(\D*?)(\d[\d.,]*)(.*)$/s);
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState<string | null>(null); // null = hiện giá trị cuối

  useEffect(() => {
    const el = ref.current;
    if (!m || !el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const digits = m[2]!;
    const sep = digits.includes(".") && /\.\d{3}/.test(digits) ? "." : digits.includes(",") ? "," : "";
    const target = Number(digits.replace(/[.,]/g, ""));
    if (!Number.isFinite(target) || target === 0) return;
    const fmt = (v: number) => (sep ? Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(Math.round(v)));
    let raf = 0;
    let first = true;
    const io = new IntersectionObserver(
      ([e]) => {
        if (first) {
          first = false;
          if (e!.isIntersecting) return io.disconnect(); // đã thấy sẵn khi tải: không đếm lại cho đỡ nháy
          setN("0");
          return;
        }
        if (!e!.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now() + 150;
        const tick = (now: number) => {
          const t = Math.min(1, Math.max(0, (now - t0) / 1600));
          const eased = 1 - (1 - t) * (1 - t); // power2.out
          setN(t >= 1 ? null : fmt(target * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!m) return <span className={className}>{value}</span>;
  return (
    <span ref={ref} className={className}>
      {m[1]}
      {/* số cuối nằm ẩn chồng cùng ô -> giữ đúng bề rộng thật, chữ phía sau không bị đẩy, hết đếm không còn khe trống */}
      <span className="inline-grid [font-variant-numeric:tabular-nums]">
        <span className="invisible col-start-1 row-start-1" aria-hidden>{m[2]}</span>
        <span className="col-start-1 row-start-1">{n ?? m[2]}</span>
      </span>
      {m[3]}
    </span>
  );
}
