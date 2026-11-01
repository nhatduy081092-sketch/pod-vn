import type { ReactNode } from "react";
import { BASIC_COLORS, GARMENT_ZONE, type ColorKey, type GarmentKey } from "@pod/shared";

/*
 * Mockup in trên áo trơn thật (/blanks/*.webp, nền trong suốt 1200×1200) – thay ảnh người mẫu AI.
 * Hình in không dán phẳng: bộ lọc SVG lấy chính ảnh áo làm bản đồ nếp vải để
 *  1) đổ sáng/tối của nếp vải lên mực (soft-light), 2) rỗ mực nhẹ như in thật (feTurbulence).
 * Áo sáng: mực nhân màu (multiply) với vải; áo tối: mực phủ.
 * Không uốn bằng feDisplacementMap: Chrome xé ngang nét chữ (thử tới stdDeviation 35 vẫn xé) – uốn thật để cho
 * Studio (canvas, applyFabric trong @pod/shared/render).
 * Không cần JS – dùng được trong server component.
 */

const S = 1000; // khung áo vuông, đơn vị người dùng

/**
 * Độ sáng trung bình + độ lệch của vải trong vùng in (đo trên ảnh phôi, giống nhau giữa các dáng áo).
 * Dùng để kéo giãn nếp vải quanh mức 0.5: vải phẳng = xám giữa (soft-light không đổi màu mực), nếp = sáng/tối hơn.
 */
const FABRIC: Record<ColorKey, { lum: number; sd: number }> = {
  trang: { lum: 0.925, sd: 0.018 },
  den: { lum: 0.162, sd: 0.009 },
  kem: { lum: 0.863, sd: 0.017 },
  xam: { lum: 0.642, sd: 0.012 },
  navy: { lum: 0.221, sd: 0.011 },
  hong: { lum: 0.776, sd: 0.015 },
};

/** Bản đồ nếp: xám hoá ảnh áo rồi kéo giãn tuyến tính để độ lệch chuẩn ≈ `spread` quanh 0.5 */
function Relief({ c, spread, result }: { c: ColorKey; spread: number; result: string }) {
  const f = FABRIC[c];
  const slope = spread / f.sd;
  const fn = { type: "linear" as const, slope, intercept: 0.5 - slope * f.lum };
  return (
    <>
      <feColorMatrix in="fab" type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
      <feComponentTransfer result={result}>
        <feFuncR {...fn} />
        <feFuncG {...fn} />
        <feFuncB {...fn} />
      </feComponentTransfer>
    </>
  );
}

export function GarmentMockup({
  id,
  garment,
  color,
  children,
  view = [0, 0, 1, 1],
  src: srcOverride,
  label,
  className = "",
}: {
  /** duy nhất trên trang (id bộ lọc SVG) */
  id: string;
  garment: GarmentKey;
  color: ColorKey;
  /** hình in, vẽ theo milimét của vùng in thật (VD áo thun 300×380) */
  children: ReactNode;
  /** khung cắt [x, y, w, h] theo tỉ lệ 0–1 của ảnh áo, để phóng vào ngực */
  view?: [number, number, number, number];
  /** ảnh phôi khác /blanks (VD ảnh phôi tải lên CMS) – cùng dáng, cùng màu */
  src?: string;
  /** bỏ trống khi khối cha đã có nhãn ảnh -> ẩn khỏi trình đọc màn hình */
  label?: string;
  className?: string;
}) {
  const z = GARMENT_ZONE[garment];
  const dark = BASIC_COLORS[color].dark;
  const src = srcOverride || `/blanks/${garment}-${color}.webp`;
  const f = `${id}-ink`;
  return (
    <svg viewBox={view.map((v) => v * S).join(" ")} className={className} {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })} preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id={f} filterUnits="userSpaceOnUse" x={0} y={0} width={S} height={S} colorInterpolationFilters="sRGB">
          <feImage href={src} x={0} y={0} width={S} height={S} preserveAspectRatio="xMidYMid meet" result="fab" />
          <Relief c={color} spread={0.14} result="shade" />
          <feBlend in="shade" in2="SourceGraphic" mode="soft-light" result="lit" />
          <feComposite in="lit" in2="SourceGraphic" operator="in" result="litIn" />
          <feTurbulence type="fractalNoise" baseFrequency={0.6} numOctaves={2} seed={7} result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.2 0 0 0 1.08" result="grain" />
          <feComposite in="litIn" in2="grain" operator="in" />
        </filter>
      </defs>
      <image href={src} x={0} y={0} width={S} height={S} />
      <g filter={`url(#${f})`} style={{ mixBlendMode: dark ? "normal" : "multiply" }} opacity={dark ? 0.94 : 1}>
        <svg x={z.x * S} y={z.y * S} width={z.w * S} height={z.h * S} viewBox={`0 0 ${z.widthMm} ${z.heightMm}`} overflow="visible">
          {children}
        </svg>
      </g>
    </svg>
  );
}

/** Chữ in dùng font hiển thị của trang, căn giữa theo trục x */
export function PrintText({ x, y, size, children, weight = 800, fill, spacing = 0, stretch }: { x: number; y: number; size: number; children: ReactNode; weight?: number; fill: string; spacing?: number; stretch?: number }) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={weight}
      fill={fill}
      textAnchor="middle"
      letterSpacing={spacing}
      style={{ fontFamily: "var(--font-sans), 'Be Vietnam Pro', sans-serif", fontStretch: stretch ? `${stretch}%` : undefined }}
    >
      {children}
    </text>
  );
}
