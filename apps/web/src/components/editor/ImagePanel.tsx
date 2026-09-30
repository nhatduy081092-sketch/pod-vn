"use client";
import { useState } from "react";
import { IMAGE_MASK_LABEL, IMAGE_MASKS, TILE_MODE_LABEL, TILE_MODES, type ImageCrop, type ImageLayer, type ImageMask, type TileMode } from "@pod/shared";
import type { PrintArea } from "@/lib/types";
import { CropModal } from "./CropModal";
import { Slider } from "./ui";

type Props = {
  layer: ImageLayer;
  area: Pick<PrintArea, "widthMm" | "heightMm">;
  /** commit=false: đang kéo thanh trượt (chưa ghi lịch sử) */
  onPatch: (p: Partial<ImageLayer>, commit: boolean) => void;
  onEnd: () => void;
  onRemoveBg: () => void;
  onRestore: () => void;
  bgSupported: boolean;
};

type Fit = "cover" | "contain" | "width" | "height";
const FITS: { k: Fit; label: string; title: string }[] = [
  { k: "cover", label: "Phủ kín", title: "Phủ kín toàn bộ vùng in (có thể cắt bớt mép ảnh)" },
  { k: "contain", label: "Vừa khung", title: "Hiện trọn ảnh trong vùng in" },
  { k: "width", label: "Phủ ngang", title: "Rộng bằng vùng in" },
  { k: "height", label: "Phủ dọc", title: "Cao bằng vùng in" },
];

/** Mẫu minh hoạ nhỏ cho từng kiểu lặp */
function TileIcon({ mode }: { mode: TileMode }) {
  const cells: [number, number, number][] = [];
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 3; i++) {
      const x = i * 8 + (mode === "brick" && j % 2 ? 4 : 0);
      const y = j * 8 + (mode === "halfDrop" && i % 2 ? 4 : 0);
      const r = mode === "mirror" ? (i % 2 ? 180 : 0) + (j % 2 ? 90 : 0) : mode === "random" ? [0, 90, 180, 270][(i * 7 + j * 3) % 4]! : 0;
      cells.push([x, y, r]);
    }
  return (
    <svg viewBox="0 0 26 26" className="h-7 w-7" aria-hidden>
      {cells.map(([x, y, r], i) => (
        <path key={i} d="M0 -2.5 L2.5 2 L-2.5 2Z" transform={`translate(${x + 5} ${y + 5}) rotate(${r})`} fill="currentColor" />
      ))}
    </svg>
  );
}

export function ImagePanel({ layer: l, area, onPatch, onEnd, onRemoveBg, onRestore, bgSupported }: Props) {
  const [crop, setCrop] = useState(false);
  const W = area.widthMm;
  const H = area.heightMm;
  const aspect = (l.natW * (l.crop?.w ?? 1)) / (l.natH * (l.crop?.h ?? 1));

  function fit(k: Fit) {
    const w = k === "cover" ? Math.max(W, H * aspect) : k === "contain" ? Math.min(W, H * aspect) : k === "width" ? W : H * aspect;
    onPatch({ w, h: w / aspect, x: W / 2, y: H / 2, rotation: 0, tile: false }, true);
  }

  function tileOn(mode: TileMode) {
    if (l.tile) return onPatch({ tileMode: mode }, true);
    const cell = Math.min(W, H) / 4;
    const w = aspect >= 1 ? cell : cell * aspect;
    onPatch({ tile: true, tileMode: mode, w, h: w / aspect, x: W / 2, y: H / 2, mask: l.mask }, true);
  }

  function applyCrop(c: ImageCrop | undefined) {
    setCrop(false);
    const old = l.crop ?? { x: 0, y: 0, w: 1, h: 1 };
    const next = c ?? { x: 0, y: 0, w: 1, h: 1 };
    const mmPerPx = l.w / (l.natW * old.w);
    onPatch({ crop: c, w: l.natW * next.w * mmPerPx, h: l.natH * next.h * mmPerPx }, true);
  }

  const cellMax = Math.round(Math.min(W, H));
  const size = Math.round(Math.max(l.w, l.h));

  return (
    <div className="space-y-3 border-t border-ink/10 pt-3">
      <p className="text-xs font-bold text-ink/70">Ảnh đang chọn</p>

      <div>
        <p className="mb-1 text-[11px] font-semibold text-ink/60">Đặt ảnh</p>
        <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
          {FITS.map((f) => (
            <button key={f.k} type="button" className="btn-sm px-1" title={f.title} onClick={() => fit(f.k)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-semibold text-ink/60">Chỉnh ảnh</p>
        <div className="grid grid-cols-2 gap-1 text-[11px] font-bold">
          <button type="button" className="btn-sm" onClick={() => setCrop(true)}>
            ✂ Cắt ảnh{l.crop ? " ✓" : ""}
          </button>
          {l.origSrc ? (
            <button type="button" className="btn-sm" onClick={onRestore} title="Trả lại ảnh gốc trước khi xoá nền">
              ↺ Ảnh gốc
            </button>
          ) : (
            <button type="button" className="btn-sm" onClick={onRemoveBg} disabled={!bgSupported} title={bgSupported ? "Xoá nền ngay trên máy của bạn" : "Trình duyệt chưa hỗ trợ"}>
              🪄 Xoá nền
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-semibold text-ink/60">Cắt theo hình</p>
        <div className="flex flex-wrap gap-1 text-[11px] font-bold" role="radiogroup" aria-label="Cắt theo hình">
          {[undefined, ...IMAGE_MASKS].map((m) => (
            <button
              key={m ?? "none"}
              type="button"
              role="radio"
              aria-checked={l.mask === m}
              onClick={() => onPatch({ mask: m as ImageMask | undefined }, true)}
              className={`rounded-full border-2 px-2 py-0.5 ${l.mask === m ? "border-ink bg-brand" : "border-ink/15"}`}
            >
              {m ? IMAGE_MASK_LABEL[m] : "Không"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-ink/60">Lặp họa tiết</p>
          {l.tile && (
            <button type="button" className="text-[11px] font-bold underline" onClick={() => onPatch({ tile: false }, true)}>
              Tắt lặp
            </button>
          )}
        </div>
        <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label="Kiểu lặp">
          {TILE_MODES.map((m) => {
            const on = !!l.tile && (l.tileMode ?? "grid") === m;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => tileOn(m)}
                className={`flex flex-col items-center gap-0.5 rounded-md border-2 px-0.5 py-1 text-[10px] font-bold leading-tight ${on ? "border-ink bg-brand" : "border-ink/15 hover:border-ink/40"}`}
                title={TILE_MODE_LABEL[m]}
              >
                <TileIcon mode={m} />
                {TILE_MODE_LABEL[m]}
              </button>
            );
          })}
        </div>
        {l.tile && (
          <div className="mt-2 space-y-2">
            <Slider
              label="Cỡ ô lặp"
              value={size}
              min={5}
              max={cellMax}
              onChange={(v) => {
                const f = v / Math.max(l.w, l.h);
                onPatch({ w: l.w * f, h: l.h * f }, false);
              }}
              onEnd={onEnd}
              fmt={(v) => `${v} mm`}
            />
            <Slider label="Khoảng cách ngang" value={Math.round(l.tileGapX ?? 0)} min={0} max={Math.round(cellMax / 2)} onChange={(v) => onPatch({ tileGapX: v || undefined }, false)} onEnd={onEnd} fmt={(v) => `${v} mm`} />
            <Slider label="Khoảng cách dọc" value={Math.round(l.tileGapY ?? 0)} min={0} max={Math.round(cellMax / 2)} onChange={(v) => onPatch({ tileGapY: v || undefined }, false)} onEnd={onEnd} fmt={(v) => `${v} mm`} />
            {l.tileMode === "random" && (
              <button type="button" className="btn-sm w-full text-[11px] font-bold" onClick={() => onPatch({ tileSeed: Math.floor(Math.random() * 999_999) + 1 }, true)}>
                🎲 Xáo lại
              </button>
            )}
          </div>
        )}
      </div>

      <Slider label="Độ đậm" value={Math.round((l.opacity ?? 1) * 100)} min={10} max={100} onChange={(v) => onPatch({ opacity: v / 100 }, false)} onEnd={onEnd} fmt={(v) => `${v}%`} />
      <p className="text-[11px] text-ink/60">
        {l.tile ? "Mỗi ô" : "Kích thước in"}: {(l.w / 10).toFixed(1)} × {(l.h / 10).toFixed(1)} cm
      </p>

      {crop && <CropModal src={l.src} natW={l.natW} natH={l.natH} initial={l.crop} onApply={applyCrop} onClose={() => setCrop(false)} />}
    </div>
  );
}
