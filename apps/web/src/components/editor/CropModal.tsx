"use client";
import { useRef, useState, type PointerEvent as RPE } from "react";
import type { ImageCrop } from "@pod/shared";

type Box = ImageCrop;
const RATIOS: { label: string; r: number | null }[] = [
  { label: "Tự do", r: null },
  { label: "1:1", r: 1 },
  { label: "4:3", r: 4 / 3 },
  { label: "3:4", r: 3 / 4 },
  { label: "16:9", r: 16 / 9 },
  { label: "2:3", r: 2 / 3 },
];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Cắt ảnh: kéo khung để di chuyển, kéo góc để đổi cỡ, chọn tỉ lệ có sẵn */
export function CropModal({ src, natW, natH, initial, onApply, onClose }: { src: string; natW: number; natH: number; initial?: ImageCrop; onApply: (c: ImageCrop | undefined) => void; onClose: () => void }) {
  const [box, setBox] = useState<Box>(initial ?? { x: 0, y: 0, w: 1, h: 1 });
  const [ratio, setRatio] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: "move" | "resize"; sx: number; sy: number; b: Box } | null>(null);
  const imgRatio = natW / natH;

  /** tỉ lệ khung (theo pixel thật) -> tỉ lệ theo toạ độ 0–1 */
  const fitRatio = (b: Box, r: number | null): Box => {
    if (!r) return b;
    const hNorm = (b.w * imgRatio) / r; // h (0–1) để w/h pixel = r
    let w = b.w;
    let h = hNorm;
    if (b.y + h > 1) {
      h = 1 - b.y;
      w = (h * r) / imgRatio;
    }
    if (b.x + w > 1) {
      w = 1 - b.x;
      h = (w * imgRatio) / r;
    }
    return { ...b, w: Math.max(0.02, w), h: Math.max(0.02, h) };
  };

  function start(e: RPE<HTMLElement>, mode: "move" | "resize") {
    e.stopPropagation();
    e.preventDefault();
    const r = ref.current!.getBoundingClientRect();
    drag.current = { mode, sx: (e.clientX - r.left) / r.width, sy: (e.clientY - r.top) / r.height, b: box };
    ref.current!.setPointerCapture(e.pointerId);
  }
  function move(e: RPE<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const r = ref.current!.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - d.sx;
    const dy = (e.clientY - r.top) / r.height - d.sy;
    if (d.mode === "move") setBox({ ...d.b, x: clamp(d.b.x + dx, 0, 1 - d.b.w), y: clamp(d.b.y + dy, 0, 1 - d.b.h) });
    else setBox(fitRatio({ ...d.b, w: clamp(d.b.w + dx, 0.02, 1 - d.b.x), h: clamp(d.b.h + dy, 0.02, 1 - d.b.y) }, ratio));
  }
  // khung hiển thị giữ đúng tỉ lệ ảnh, vừa màn hình
  const maxW = Math.min(460, (typeof window !== "undefined" ? window.innerWidth : 480) - 56);
  const maxH = Math.min(420, (typeof window !== "undefined" ? window.innerHeight : 800) * 0.55);
  const dispW = Math.min(maxW, maxH * imgRatio);
  const disp = { width: dispW, height: dispW / imgRatio };
  const pxW = Math.round(box.w * natW);
  const pxH = Math.round(box.h * natH);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="crop-title">
      <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
        <h2 id="crop-title" className="text-lg font-black">
          Cắt ảnh
        </h2>
        <div className="mt-2 flex flex-wrap gap-1 text-[11px] font-bold">
          {RATIOS.map((x) => (
            <button
              key={x.label}
              type="button"
              onClick={() => {
                setRatio(x.r);
                setBox((b) => fitRatio(x.r ? { ...b, x: 0, y: 0, w: 1 } : b, x.r));
              }}
              className={`rounded-full border-2 px-2.5 py-0.5 ${ratio === x.r ? "border-ink bg-brand" : "border-ink/15"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-center bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
          <div
            ref={ref}
            className="relative touch-none select-none"
            style={disp}
            onPointerMove={move}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          >
            <img src={src} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
            {/* phần bị cắt bỏ tối đi */}
            <div className="pointer-events-none absolute inset-0 bg-black/50" style={{ clipPath: `polygon(0 0,100% 0,100% 100%,0 100%,0 ${box.y * 100}%,${box.x * 100}% ${box.y * 100}%,${box.x * 100}% ${(box.y + box.h) * 100}%,${(box.x + box.w) * 100}% ${(box.y + box.h) * 100}%,${(box.x + box.w) * 100}% ${box.y * 100}%,0 ${box.y * 100}%)` }} />
            <div
              className="absolute cursor-move border-2 border-white shadow-[0_0_0_1px_#1d1d1f]"
              style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }}
              onPointerDown={(e) => start(e, "move")}
            >
              <span
                className="absolute -bottom-2.5 -right-2.5 h-5 w-5 cursor-nwse-resize rounded-sm border border-line bg-white"
                onPointerDown={(e) => start(e, "resize")}
                aria-label="Đổi cỡ vùng cắt"
              />
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink/60">
          Giữ lại {pxW}×{pxH} px. Cắt càng nhỏ thì ảnh in càng dễ vỡ.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button type="button" className="btn border-ink/20 bg-white px-2" onClick={() => onApply(undefined)}>
            Bỏ cắt
          </button>
          <button type="button" className="btn border-ink/20 bg-white px-2" onClick={onClose}>
            Huỷ
          </button>
          <button type="button" className="btn border-ink bg-brand px-2" onClick={() => onApply(box.w > 0.999 && box.h > 0.999 ? undefined : box)}>
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
