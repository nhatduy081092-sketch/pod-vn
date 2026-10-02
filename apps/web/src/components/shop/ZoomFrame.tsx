"use client";
import { useRef, type PointerEvent } from "react";

/**
 * Khung ảnh sản phẩm: rê chuột -> phóng to đúng chỗ con trỏ (chỉ chuột/bút, không áp dụng chạm).
 * Ghi toạ độ vào biến CSS --zx/--zy (không re-render React), ảnh dùng transform-origin theo biến đó.
 */
export function ZoomFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const set = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--zx", `${Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))}%`);
      el.style.setProperty("--zy", `${Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100))}%`);
    });
  };
  return (
    <div
      ref={ref}
      className={`zoom-frame ${className}`}
      onPointerEnter={(e) => {
        set(e);
        if (e.pointerType !== "touch") ref.current?.classList.add("is-zoom");
      }}
      onPointerMove={set}
      onPointerLeave={() => ref.current?.classList.remove("is-zoom")}
    >
      {children}
    </div>
  );
}
