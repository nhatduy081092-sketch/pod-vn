"use client";
import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { DPI_LEVEL_LABEL, dpiLevel, effectiveDpi, type AreaDesign, type DesignLayer } from "@pod/shared";
import type { PrintArea } from "@/lib/types";
import { drawMockup, measureText, type ImageCache, type MockupAssets } from "./render";

type Rect = { x: number; y: number; w: number; h: number; k: number };
type Drag =
  | { kind: "move"; id: string; startX: number; startY: number; ox: number; oy: number }
  | { kind: "scale"; id: string; startDist: number; ow: number; oh: number; ofs?: number }
  | { kind: "rotate"; id: string; startAngle: number; orot: number }
  | null;

type Props = {
  area: PrintArea;
  design: AreaDesign;
  assets: MockupAssets;
  images: ImageCache;
  /** tăng khi ảnh/font vừa tải xong -> vẽ lại */
  version: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** commit=false khi đang kéo (không ghi lịch sử), true khi thả tay */
  onChangeLayer: (id: string, patch: Partial<DesignLayer>, commit: boolean) => void;
  onCommit: () => void;
};

const SNAP_MM_PX = 6; // ngưỡng bắt tâm tính theo pixel màn hình
const HANDLE = 22;

/** Chuyển điểm (mm) sang hệ toạ độ cục bộ của lớp (đã xoay) */
function toLocal(l: DesignLayer, x: number, y: number) {
  const r = (-(l.rotation ?? 0) * Math.PI) / 180;
  const dx = x - l.x;
  const dy = y - l.y;
  return { x: dx * Math.cos(r) - dy * Math.sin(r), y: dx * Math.sin(r) + dy * Math.cos(r) };
}

export function Stage({ area, design, assets, images, version, selectedId, onSelect, onChangeLayer, onCommit }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(0);
  const [pr, setPr] = useState<Rect | null>(null);
  const [guides, setGuides] = useState<{ v: boolean; h: boolean }>({ v: false, h: false });
  const drag = useRef<Drag>(null);

  // khung vuông theo bề ngang container
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize(Math.floor(el.clientWidth)));
    ro.observe(el);
    setSize(Math.floor(el.clientWidth));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = size * dpr;
    c.height = size * dpr;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const r = drawMockup(ctx, size, size, area, design, assets, images, { background: "#f4f4f5", padding: size * 0.03 });
    // viền vùng in
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(29,29,31,.55)";
    ctx.strokeRect(r.printRect.x + 0.5, r.printRect.y + 0.5, r.printRect.w - 1, r.printRect.h - 1);
    ctx.restore();
    setPr(r.printRect);
  }, [size, area, design, assets, images, version]);

  const pointMm = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const box = wrapRef.current!.getBoundingClientRect();
      if (!pr) return { x: 0, y: 0 };
      return { x: (e.clientX - box.left - pr.x) / pr.k, y: (e.clientY - box.top - pr.y) / pr.k };
    },
    [pr],
  );

  const selected = design.layers.find((l) => l.id === selectedId) ?? null;

  function hitTest(x: number, y: number): DesignLayer | null {
    for (let i = design.layers.length - 1; i >= 0; i--) {
      const l = design.layers[i]!;
      const p = toLocal(l, x, y);
      const pad = 2 / (pr?.k ?? 1); // nới 2px cho dễ bấm
      if (Math.abs(p.x) <= l.w / 2 + pad && Math.abs(p.y) <= l.h / 2 + pad) return l;
    }
    return null;
  }

  function onDown(e: RPointerEvent<HTMLDivElement>) {
    if (!pr) return;
    const m = pointMm(e);
    const handle = (e.target as HTMLElement).dataset.handle;
    if (selected && handle === "scale") {
      const p = toLocal(selected, m.x, m.y);
      drag.current = { kind: "scale", id: selected.id, startDist: Math.max(1, Math.hypot(p.x, p.y)), ow: selected.w, oh: selected.h, ofs: selected.type === "text" ? selected.fontSize : undefined };
    } else if (selected && handle === "rotate") {
      drag.current = { kind: "rotate", id: selected.id, startAngle: Math.atan2(m.y - selected.y, m.x - selected.x), orot: selected.rotation ?? 0 };
    } else {
      const hit = hitTest(m.x, m.y);
      onSelect(hit?.id ?? null);
      if (!hit) return;
      drag.current = { kind: "move", id: hit.id, startX: m.x, startY: m.y, ox: hit.x, oy: hit.y };
    }
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onMove(e: RPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || !pr) return;
    const m = pointMm(e);
    const l = design.layers.find((x) => x.id === d.id);
    if (!l) return;
    if (d.kind === "move") {
      let x = d.ox + (m.x - d.startX);
      let y = d.oy + (m.y - d.startY);
      const snap = SNAP_MM_PX / pr.k;
      const v = Math.abs(x - area.widthMm / 2) < snap;
      const h = Math.abs(y - area.heightMm / 2) < snap;
      if (v) x = area.widthMm / 2;
      if (h) y = area.heightMm / 2;
      setGuides({ v, h });
      onChangeLayer(d.id, { x, y }, false);
    } else if (d.kind === "scale") {
      const p = toLocal(l, m.x, m.y);
      const f = Math.max(0.05, Math.hypot(p.x, p.y) / d.startDist);
      if (l.type === "text" && d.ofs) {
        const fontSize = Math.max(1, Math.round(d.ofs * f * 10) / 10);
        onChangeLayer(d.id, { fontSize, ...measureText({ ...l, fontSize }) } as Partial<DesignLayer>, false);
      } else {
        onChangeLayer(d.id, { w: Math.max(2, d.ow * f), h: Math.max(2, d.oh * f) }, false);
      }
    } else if (d.kind === "rotate") {
      let deg = d.orot + ((Math.atan2(m.y - l.y, m.x - l.x) - d.startAngle) * 180) / Math.PI;
      deg = ((deg % 360) + 540) % 360 - 180;
      const step = e.shiftKey ? 15 : 0;
      if (step) deg = Math.round(deg / step) * step;
      else for (const t of [-180, -90, 0, 90, 180]) if (Math.abs(deg - t) < 4) deg = t;
      onChangeLayer(d.id, { rotation: Math.round(deg * 10) / 10 }, false);
    }
  }

  function onUp() {
    if (drag.current) onCommit();
    drag.current = null;
    setGuides({ v: false, h: false });
  }

  // khung chọn (px màn hình)
  let box: { cx: number; cy: number; w: number; h: number; rot: number } | null = null;
  if (selected && pr) box = { cx: pr.x + selected.x * pr.k, cy: pr.y + selected.y * pr.k, w: selected.w * pr.k, h: selected.h * pr.k, rot: selected.rotation ?? 0 };
  const dpi = selected?.type === "image" && !selected.tile ? effectiveDpi(selected) : null;

  return (
    <div ref={wrapRef} className="relative aspect-square w-full select-none overflow-hidden rounded-lg border-2 border-ink bg-[#f4f4f5]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ width: size, height: size }} aria-label={`Khung thiết kế – ${area.name}`} />
      <div
        className="absolute inset-0 touch-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="application"
        aria-label="Kéo để di chuyển, kéo góc để đổi cỡ, kéo nút tròn để xoay"
      >
        {pr && guides.v && <div className="pointer-events-none absolute w-px bg-[#e11d48]" style={{ left: pr.x + pr.w / 2, top: pr.y, height: pr.h }} />}
        {pr && guides.h && <div className="pointer-events-none absolute h-px bg-[#e11d48]" style={{ top: pr.y + pr.h / 2, left: pr.x, width: pr.w }} />}
        {box && (
          <div
            className="pointer-events-none absolute border-2 border-[#2563eb]"
            style={{ left: box.cx - box.w / 2, top: box.cy - box.h / 2, width: box.w, height: box.h, transform: `rotate(${box.rot}deg)` }}
          >
            {/* nút xoay */}
            <span
              data-handle="rotate"
              className="pointer-events-auto absolute left-1/2 -translate-x-1/2 cursor-grab rounded-full border-2 border-[#2563eb] bg-white"
              style={{ top: -HANDLE - 14, width: HANDLE, height: HANDLE }}
              title="Xoay"
            />
            <span className="absolute left-1/2 w-px bg-[#2563eb]" style={{ top: -14, height: 14 }} />
            {/* nút co giãn 4 góc */}
            {[
              ["-left-3 -top-3", "nwse-resize"],
              ["-right-3 -top-3", "nesw-resize"],
              ["-left-3 -bottom-3", "nesw-resize"],
              ["-right-3 -bottom-3", "nwse-resize"],
            ].map(([pos, cur]) => (
              <span
                key={pos}
                data-handle="scale"
                className={`pointer-events-auto absolute ${pos} rounded-sm border-2 border-[#2563eb] bg-white`}
                style={{ width: HANDLE - 4, height: HANDLE - 4, cursor: cur }}
              />
            ))}
          </div>
        )}
      </div>
      {dpi !== null && (
        <span
          className={`pointer-events-none absolute bottom-2 left-2 rounded px-2 py-0.5 text-[11px] font-bold text-white ${
            { good: "bg-green-600", ok: "bg-amber-500", low: "bg-red-600" }[dpiLevel(dpi, area.dpi)]
          }`}
        >
          {dpi} DPI · {DPI_LEVEL_LABEL[dpiLevel(dpi, area.dpi)]}
        </span>
      )}
      <span className="pointer-events-none absolute right-2 top-2 rounded bg-ink/80 px-2 py-0.5 text-[11px] font-semibold text-white">
        {area.name} · {area.widthMm / 10}×{area.heightMm / 10} cm
      </span>
    </div>
  );
}
