import { applyTemplate, GARMENT_ZONE, type ColorKey, type GarmentKey, type ReadyDesign, type TextLayer } from "@pod/shared";

/**
 * Ảnh xem trước mẫu có sẵn: phôi YALA Everyday + chữ vẽ bằng SVG (render phía server, không cần JS).
 * Cùng quy tắc với YALA Studio: mẫu co giãn vào vùng in ngực, (x, y) = tâm lớp, cỡ chữ theo mm.
 * Chữ cong ước lượng độ rộng (0,56 × cỡ chữ / ký tự) – đủ gần để xem trước; file in thật do Studio vẽ.
 */
export function DesignPreview({ design, garment, color, className = "", title, zoom = true }: { design: ReadyDesign; garment?: GarmentKey; color?: ColorKey; className?: string; title?: string; /** cận ngực áo (như ảnh chụp sản phẩm) thay vì cả áo */ zoom?: boolean }) {
  const g = garment ?? design.garment;
  const c = color ?? design.color;
  const z = GARMENT_ZONE[g];
  const layers = applyTemplate(design.template, { widthMm: z.widthMm, heightMm: z.heightMm }, () => "p");
  const k = (z.w * 400) / z.widthMm; // px (hệ 400) / mm
  let n = 0;
  // khung cận: vuông, tâm = tâm vùng in, cạnh ≈ 2,5 × bề ngang vùng in
  const side = Math.min(400, z.w * 400 * 2.5);
  const cx = (z.x + z.w / 2) * 400;
  const cy = (z.y + z.h / 2) * 400;
  const vb = zoom ? `${Math.max(0, Math.min(400 - side, cx - side / 2))} ${Math.max(0, Math.min(400 - side, cy - side / 2 + 6))} ${side} ${side}` : "0 0 400 400";
  return (
    <svg viewBox={vb} className={className} role="img" aria-label={title ?? design.title}>
      <image href={`/shapes/basic/${g}-${c}.svg`} width="400" height="400" />
      <g transform={`translate(${z.x * 400} ${z.y * 400}) scale(${k})`}>
        {layers.map((l) => (l.type === "text" ? <Text key={n++} l={l} id={`${design.slug}-${n}`} /> : null))}
      </g>
    </svg>
  );
}

/** Như curveGeometry của bộ vẽ Studio (packages/shared/src/render.ts) – chép lại để không kéo cả bộ vẽ canvas vào trang */
function curveGeometry(textWmm: number, fontMm: number, curve: number) {
  const theta = (Math.min(100, Math.abs(curve)) / 100) * 2 * Math.PI;
  if (theta < 0.02 || textWmm <= 0) return null;
  const R = textWmm / theta;
  const half = theta / 2;
  return { theta, R, h: R * (1 - Math.cos(half)) + fontMm };
}

function Text({ l, id }: { l: TextLayer; id: string }) {
  const style = {
    fontFamily: `"${l.font}", "Be Vietnam Pro", sans-serif`,
    fontWeight: l.bold ? 700 : 400,
    fontStyle: l.italic ? "italic" : "normal",
    letterSpacing: `${(l.letterSpacing ?? 0) * l.fontSize}px`,
  } as const;
  const paint = {
    fill: l.color,
    ...(l.stroke?.width ? { stroke: l.stroke.color, strokeWidth: l.stroke.width * 2, paintOrder: "stroke" as const, strokeLinejoin: "round" as const } : {}),
  };
  const transform = l.rotation ? `rotate(${l.rotation} ${l.x} ${l.y})` : undefined;

  if (l.curve && Math.abs(l.curve) >= 1) {
    const text = l.text.replace(/\s*\n+\s*/g, " ");
    const widthMm = [...text].length * l.fontSize * 0.56 + [...text].length * (l.letterSpacing ?? 0) * l.fontSize;
    const geo = curveGeometry(widthMm, l.fontSize, l.curve);
    if (geo) {
      const dir = l.curve > 0 ? 1 : -1;
      const cx = l.x;
      const cy = l.y + dir * (geo.R + l.fontSize / 2 - geo.h / 2);
      const a0 = (dir > 0 ? -Math.PI / 2 : Math.PI / 2) - geo.theta / 2;
      const a1 = a0 + geo.theta;
      const p = (a: number) => `${cx + geo.R * Math.cos(a)} ${cy + geo.R * Math.sin(a)}`;
      // cong xuống: đi ngược chiều để chữ không bị lộn ngược
      const d = dir > 0 ? `M ${p(a0)} A ${geo.R} ${geo.R} 0 ${geo.theta > Math.PI ? 1 : 0} 1 ${p(a1)}` : `M ${p(a1)} A ${geo.R} ${geo.R} 0 ${geo.theta > Math.PI ? 1 : 0} 0 ${p(a0)}`;
      return (
        <g transform={transform}>
          <path id={id} d={d} fill="none" />
          <text fontSize={l.fontSize} style={style} {...paint} dominantBaseline="central">
            <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
              {text}
            </textPath>
          </text>
        </g>
      );
    }
  }

  const rows = l.text.split("\n");
  const step = l.fontSize * (l.lineHeight ?? 1.15);
  const anchor = l.align === "left" ? "start" : l.align === "right" ? "end" : "middle";
  const x = l.align === "left" ? l.x - l.w / 2 : l.align === "right" ? l.x + l.w / 2 : l.x;
  return (
    <text fontSize={l.fontSize} style={style} {...paint} textAnchor={anchor} dominantBaseline="central" transform={transform}>
      {rows.map((r, i) => (
        <tspan key={i} x={x} y={l.y + (i - (rows.length - 1) / 2) * step}>
          {r || " "}
        </tspan>
      ))}
    </text>
  );
}
