"use client";
import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { areaGuides, DPI_LEVEL_LABEL, dpiLevel, effectiveDpi, layerBounds, type AreaDesign, type DesignLayer } from "@pod/shared";
import type { PrintArea } from "@/lib/types";
import { drawFlat, drawMockup, imgSize, measureText, printRectOnMockup, type ImageCache, type MockupAssets } from "./render";

type Rect = { x: number; y: number; w: number; h: number; k: number };
type Drag =
  | { kind: "move"; id: string; startX: number; startY: number; ox: number; oy: number }
  | { kind: "scale"; id: string; startDist: number; ow: number; oh: number; ofs?: number }
  | { kind: "rotate"; id: string; startAngle: number; orot: number }
  | { kind: "pinch"; id: string; startDist: number; startAngle: number; ow: number; oh: number; ofs?: number; orot: number }
  | null;

type Props = {
  area: PrintArea;
  design: AreaDesign;
  assets: MockupAssets;
  images: ImageCache;
  /** tăng khi ảnh/font vừa tải xong -> vẽ lại */
  version: number;
  selectedId: string | null;
  garmentColor?: string | null;
  /** Size đang xem: hệ số phóng từ vùng in gốc -> DPI thực tế = DPI / dpiScale */
  dpiScale?: number;
  /** Nhãn kích thước in đang hiển thị (theo size) */
  sizeLabel?: string;
  /** "flat": chỉnh trên bản phẳng (kèm ảnh xem trước nhỏ) · "mockup": chỉnh ngay trên ảnh sản phẩm */
  view?: "flat" | "mockup";
  onSelect: (id: string | null) => void;
  /** commit=false khi đang kéo (không ghi lịch sử), true khi thả tay */
  onChangeLayer: (id: string, patch: Partial<DesignLayer>, commit: boolean) => void;
  onCommit: () => void;
};

const SNAP_PX = 6; // ngưỡng hút (pixel màn hình)
const HANDLE = 22;

/** Chuyển điểm (mm) sang hệ toạ độ cục bộ của lớp (đã xoay) */
function toLocal(l: DesignLayer, x: number, y: number) {
  const r = (-(l.rotation ?? 0) * Math.PI) / 180;
  const dx = x - l.x;
  const dy = y - l.y;
  return { x: dx * Math.cos(r) - dy * Math.sin(r), y: dx * Math.sin(r) + dy * Math.cos(r) };
}

/** Hút về giữa / mép vùng in: trả về toạ độ tâm mới + vị trí đường gióng (mm) */
function snapAxis(center: number, halfExtent: number, size: number, tol: number): { v: number; guide: number | null } {
  const cands: { c: number; g: number }[] = [
    { c: size / 2, g: size / 2 },
    { c: halfExtent, g: 0 },
    { c: size - halfExtent, g: size },
  ];
  let best: { c: number; g: number } | null = null;
  for (const x of cands) if (Math.abs(center - x.c) < tol && (!best || Math.abs(center - x.c) < Math.abs(center - best.c))) best = x;
  return best ? { v: best.c, guide: best.g } : { v: center, guide: null };
}

export function Stage({ area, design, assets, images, version, selectedId, garmentColor, dpiScale = 1, sizeLabel, view = "mockup", onSelect, onChangeLayer, onCommit }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  /** bề ngang khung (CSS px) */
  const [size, setSize] = useState(0);
  /** chiều cao khung: = bề ngang trên laptop (vuông), điện thoại khung đứng cao ~2/3 màn hình */
  const [sizeH, setSizeH] = useState(0);
  const [pr, setPr] = useState<Rect | null>(null);
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null });
  /** Cận vùng in: phóng ảnh sản phẩm để vùng in chiếm phần lớn khung (mặc định bật – điện thoại & laptop) */
  const [focus, setFocus] = useState(true);
  const drag = useRef<Drag>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  // kích thước khung theo container (vuông trên laptop, đứng trên điện thoại)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const read = () => {
      setSize(Math.floor(el.clientWidth));
      setSizeH(Math.floor(el.clientHeight));
    };
    const ro = new ResizeObserver(read);
    ro.observe(el);
    read();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size || !sizeH) return;
    // vẽ thẳng ở độ phân giải màn hình (Retina 2–3x) -> ảnh và chữ nét, không bị phóng mờ
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const W = Math.round(size * dpr);
    const H = Math.round(sizeH * dpr);
    const M = Math.min(W, H);
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    let dev: Rect;
    if (view === "flat") {
      dev = drawFlat(ctx, W, H, area, design, images, { background: "#e9e9ec", padding: M * 0.06 });
    } else {
      // cận vùng in: dựng ảnh sản phẩm trên khung ảo lớn hơn rồi dời để vùng in nằm giữa
      let z = 1;
      let ox = 0;
      let oy = 0;
      if (focus && assets.mockup && !area.warp) {
        const ms = imgSize(assets.mockup);
        const pad = M * 0.03;
        const sc = Math.min((W - pad * 2) / ms.w, (H - pad * 2) / ms.h);
        const mock = { w: ms.w * sc, h: ms.h * sc, x: (W - ms.w * sc) / 2, y: (H - ms.h * sc) / 2 };
        const p0 = printRectOnMockup(area, mock);
        // vùng in chiếm ~72% bề ngang / 70% chiều cao khung, phóng tối đa 2,6 lần, khung ảo không quá ~2800px (giới hạn bộ nhớ điện thoại)
        z = Math.max(1, Math.min(2.6, (W * 0.72) / p0.w, (H * 0.7) / p0.h, 2800 / Math.max(W, H)));
        const cx = (p0.x + p0.w / 2) * z;
        const cy = (p0.y + p0.h / 2) * z;
        ox = Math.max(0, Math.min(W * z - W, cx - W / 2));
        oy = Math.max(0, Math.min(H * z - H, cy - H / 2));
      }
      const ZW = Math.round(W * z);
      const ZH = Math.round(H * z);
      ctx.save();
      ctx.translate(-ox, -oy);
      const r = drawMockup(ctx, ZW, ZH, area, design, assets, images, { background: "#f4f4f5", padding: Math.min(ZW, ZH) * 0.03, garmentColor, shading: 0.45 });
      ctx.restore();
      dev = { ...r.printRect, x: r.printRect.x - ox, y: r.printRect.y - oy };
    }
    // toạ độ màn hình (CSS px) cho thao tác kéo/thả và khung chọn
    const rr: Rect = { x: dev.x / dpr, y: dev.y / dpr, w: dev.w / dpr, h: dev.h / dpr, k: dev.k / dpr };
    const r = { printRect: rr };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // viền vùng in
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(29,29,31,.55)";
    ctx.strokeRect(r.printRect.x + 0.5, r.printRect.y + 0.5, r.printRect.w - 1, r.printRect.h - 1);
    // đường xén (đỏ) + vùng an toàn (xanh) cho sản phẩm có viền tràn
    const g = areaGuides(area);
    const pk = r.printRect.k;
    const box = (b: { left: number; top: number; right: number; bottom: number }) => [r.printRect.x + b.left * pk, r.printRect.y + b.top * pk, (b.right - b.left) * pk, (b.bottom - b.top) * pk] as const;
    if (g.bleed > 0) {
      ctx.strokeStyle = "rgba(225,29,72,.9)";
      ctx.setLineDash([]);
      ctx.strokeRect(...box(g.trim));
    }
    if (g.bleed + g.safeInset > 0 && g.safeInset > 0) {
      ctx.strokeStyle = "rgba(22,163,74,.9)";
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(...box(g.safe));
    }
    ctx.restore();
    setPr(r.printRect);
  }, [size, sizeH, area, design, assets, images, version, garmentColor, view, focus]);

  // ảnh xem trước nhỏ trên sản phẩm khi đang chỉnh bản phẳng
  useEffect(() => {
    const c = miniRef.current;
    if (!c || view !== "flat" || !size) return;
    const px = Math.round(Math.min(size, sizeH || size) * 0.3);
    const t = setTimeout(() => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = px * dpr;
      c.height = px * dpr;
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawMockup(ctx, px, px, area, design, assets, images, { background: "#ffffff", padding: px * 0.04, garmentColor, shading: 0.45 });
    }, 120);
    return () => clearTimeout(t);
  }, [size, sizeH, area, design, assets, images, version, garmentColor, view]);

  const pointMm = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const box = wrapRef.current!.getBoundingClientRect();
      if (!pr) return { x: 0, y: 0 };
      return { x: (e.clientX - box.left - pr.x) / pr.k, y: (e.clientY - box.top - pr.y) / pr.k };
    },
    [pr],
  );

  const selected = design.layers.find((l) => l.id === selectedId) ?? null;

  // Cuộn chuột trên khung khi đang chọn lớp: phóng to / thu nhỏ lớp (không cuộn trang)
  const wheelRef = useRef({ selected, commitTimer: 0 as unknown as ReturnType<typeof setTimeout> });
  wheelRef.current.selected = selected;
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const l = wheelRef.current.selected;
      if (!l || l.locked) return;
      e.preventDefault();
      const f = Math.exp(-Math.max(-60, Math.min(60, e.deltaY)) * 0.0025);
      onChangeLayer(l.id, scalePatch(l, f, { ow: l.w, oh: l.h, ofs: l.type === "text" ? l.fontSize : undefined }), false);
      clearTimeout(wheelRef.current.commitTimer);
      wheelRef.current.commitTimer = setTimeout(onCommit, 350);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onChangeLayer, onCommit]);

  /** Lớp trên cùng tại điểm bấm; lớp đã khoá được bỏ qua (bấm xuyên xuống lớp dưới) */
  function hitTest(x: number, y: number): DesignLayer | null {
    for (let i = design.layers.length - 1; i >= 0; i--) {
      const l = design.layers[i]!;
      if (l.locked) continue;
      const p = toLocal(l, x, y);
      const pad = 2 / (pr?.k ?? 1); // nới 2px cho dễ bấm
      if (Math.abs(p.x) <= l.w / 2 + pad && Math.abs(p.y) <= l.h / 2 + pad) return l;
    }
    return null;
  }

  function startPinch(l: DesignLayer) {
    const [a, b] = [...pointers.current.values()];
    if (!a || !b) return;
    drag.current = {
      kind: "pinch",
      id: l.id,
      startDist: Math.max(10, Math.hypot(b.x - a.x, b.y - a.y)),
      startAngle: Math.atan2(b.y - a.y, b.x - a.x),
      ow: l.w,
      oh: l.h,
      ofs: l.type === "text" ? l.fontSize : undefined,
      orot: l.rotation ?? 0,
    };
  }

  function onDown(e: RPointerEvent<HTMLDivElement>) {
    if (!pr) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    e.preventDefault();
    // 2 ngón: co giãn + xoay lớp đang chọn
    if (pointers.current.size === 2) {
      if (selected && !selected.locked) startPinch(selected);
      return;
    }
    const m = pointMm(e);
    const handle = (e.target as HTMLElement).dataset.handle;
    if (selected && !selected.locked && handle === "scale") {
      const p = toLocal(selected, m.x, m.y);
      drag.current = { kind: "scale", id: selected.id, startDist: Math.max(1, Math.hypot(p.x, p.y)), ow: selected.w, oh: selected.h, ofs: selected.type === "text" ? selected.fontSize : undefined };
    } else if (selected && !selected.locked && handle === "rotate") {
      drag.current = { kind: "rotate", id: selected.id, startAngle: Math.atan2(m.y - selected.y, m.x - selected.x), orot: selected.rotation ?? 0 };
    } else {
      const hit = hitTest(m.x, m.y);
      onSelect(hit?.id ?? null);
      if (!hit) return;
      drag.current = { kind: "move", id: hit.id, startX: m.x, startY: m.y, ox: hit.x, oy: hit.y };
    }
  }

  function scalePatch(l: DesignLayer, f: number, d: { ow: number; oh: number; ofs?: number }): Partial<DesignLayer> {
    if (l.type === "text" && d.ofs) {
      const fontSize = Math.max(1, Math.round(d.ofs * f * 10) / 10);
      return { fontSize, ...measureText({ ...l, fontSize }) } as Partial<DesignLayer>;
    }
    return { w: Math.max(2, d.ow * f), h: Math.max(2, d.oh * f) };
  }

  function onMove(e: RPointerEvent<HTMLDivElement>) {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const d = drag.current;
    if (!d || !pr) return;
    const l = design.layers.find((x) => x.id === d.id);
    if (!l) return;
    if (d.kind === "pinch") {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const f = Math.max(0.05, Math.hypot(b.x - a.x, b.y - a.y) / d.startDist);
      let deg = d.orot + ((Math.atan2(b.y - a.y, b.x - a.x) - d.startAngle) * 180) / Math.PI;
      deg = ((deg % 360) + 540) % 360 - 180;
      for (const t of [-180, -90, 0, 90, 180]) if (Math.abs(deg - t) < 4) deg = t;
      onChangeLayer(d.id, { ...scalePatch(l, f, d), rotation: Math.round(deg * 10) / 10 }, false);
      return;
    }
    const m = pointMm(e);
    if (d.kind === "move") {
      const tol = SNAP_PX / pr.k;
      const b = layerBounds({ ...l, x: 0, y: 0 });
      const sx = snapAxis(d.ox + (m.x - d.startX), b.right, area.widthMm, tol);
      const sy = snapAxis(d.oy + (m.y - d.startY), b.bottom, area.heightMm, tol);
      setGuides({ v: sx.guide, h: sy.guide });
      onChangeLayer(d.id, { x: sx.v, y: sy.v }, false);
    } else if (d.kind === "scale") {
      const p = toLocal(l, m.x, m.y);
      onChangeLayer(d.id, scalePatch(l, Math.max(0.05, Math.hypot(p.x, p.y) / d.startDist), d), false);
    } else if (d.kind === "rotate") {
      let deg = d.orot + ((Math.atan2(m.y - l.y, m.x - l.x) - d.startAngle) * 180) / Math.PI;
      deg = ((deg % 360) + 540) % 360 - 180;
      const step = e.shiftKey ? 15 : 0;
      if (step) deg = Math.round(deg / step) * step;
      else for (const t of [-180, -90, 0, 90, 180]) if (Math.abs(deg - t) < 4) deg = t;
      onChangeLayer(d.id, { rotation: Math.round(deg * 10) / 10 }, false);
    }
  }

  function onUp(e: RPointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    if (drag.current?.kind === "pinch" && pointers.current.size === 1) {
      // nhấc 1 ngón: kết thúc co giãn, không chuyển sang kéo để tránh nhảy lớp
      onCommit();
      drag.current = null;
      return;
    }
    if (pointers.current.size > 0) return;
    if (drag.current) onCommit();
    drag.current = null;
    setGuides({ v: null, h: null });
  }

  // khung chọn (px màn hình)
  let box: { cx: number; cy: number; w: number; h: number; rot: number } | null = null;
  if (selected && pr) box = { cx: pr.x + selected.x * pr.k, cy: pr.y + selected.y * pr.k, w: selected.w * pr.k, h: selected.h * pr.k, rot: selected.rotation ?? 0 };
  const dpi = selected?.type === "image" ? Math.round(effectiveDpi(selected) / dpiScale) : null;
  const locked = !!selected?.locked;

  return (
    <div ref={wrapRef} className="relative aspect-square w-full select-none overflow-hidden rounded-lg border border-line bg-[#f4f4f5] max-lg:aspect-auto max-lg:h-[min(62svh,calc(100svh-250px))]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ width: size, height: sizeH }} aria-label={`Khung thiết kế – ${area.name}`} />
      <div
        className="absolute inset-0 touch-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="application"
        aria-label="Kéo để di chuyển, kéo góc để đổi cỡ, kéo nút tròn để xoay, 2 ngón để phóng to và xoay"
      >
        {pr && guides.v !== null && <div className="pointer-events-none absolute w-px bg-[#e11d48]" style={{ left: pr.x + guides.v * pr.k, top: pr.y, height: pr.h }} />}
        {pr && guides.h !== null && <div className="pointer-events-none absolute h-px bg-[#e11d48]" style={{ top: pr.y + guides.h * pr.k, left: pr.x, width: pr.w }} />}
        {box && (
          <div
            className={`pointer-events-none absolute border-2 ${locked ? "border-dashed border-ink/50" : "border-[#2563eb]"}`}
            style={{ left: box.cx - box.w / 2, top: box.cy - box.h / 2, width: box.w, height: box.h, transform: `rotate(${box.rot}deg)` }}
          >
            {locked ? (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">🔒 Đã khoá</span>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </div>
      {dpi !== null && (
        <span
          className={`pointer-events-none absolute bottom-2 left-2 rounded px-2 py-0.5 text-[11px] font-bold text-white max-lg:bottom-11 ${
            { good: "bg-green-600", ok: "bg-amber-500", low: "bg-red-600" }[dpiLevel(dpi, area.dpi)]
          }`}
        >
          {dpi} DPI · {DPI_LEVEL_LABEL[dpiLevel(dpi, area.dpi)]}
        </span>
      )}
      {view === "flat" && assets.mockup && (
        <canvas
          ref={miniRef}
          className="pointer-events-none absolute left-2 top-2 rounded-md border border-ink/15 bg-white shadow"
          style={{ width: Math.round(Math.min(size, sizeH || size) * 0.3), height: Math.round(Math.min(size, sizeH || size) * 0.3) }}
          aria-label="Xem trước trên sản phẩm"
        />
      )}
      {view === "mockup" && assets.mockup && !area.warp && (
        <button
          type="button"
          onClick={() => setFocus((f) => !f)}
          className="absolute left-2 top-2 rounded-full border-2 border-ink/15 bg-white/95 px-2.5 py-0.5 text-[11px] font-bold shadow-sm hover:border-ink"
          aria-pressed={focus}
          title={focus ? "Xem cả sản phẩm" : "Phóng to vùng in"}
        >
          {focus ? "⤢ Cả áo" : "⊕ Cận vùng in"}
        </button>
      )}
      <span className="pointer-events-none absolute right-2 top-2 rounded bg-ink/80 px-2 py-0.5 text-[11px] font-semibold text-white">
        {area.name} · {sizeLabel ?? `${area.widthMm / 10}×${area.heightMm / 10} cm`}
      </span>
      {(area.bleedMm ?? 0) + (area.safeMm ?? 0) > 0 && (
        <span className="pointer-events-none absolute bottom-2 right-2 flex gap-2 rounded bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-ink/80 max-lg:bottom-auto max-lg:top-9">
          {(area.bleedMm ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <i className="inline-block h-0.5 w-3 bg-[#e11d48]" /> đường xén
            </span>
          )}
          {(area.safeMm ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <i className="inline-block h-0.5 w-3 border-t-2 border-dashed border-[#16a34a]" /> vùng an toàn
            </span>
          )}
        </span>
      )}
    </div>
  );
}
