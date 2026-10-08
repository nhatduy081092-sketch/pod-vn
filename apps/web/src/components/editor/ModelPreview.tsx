"use client";
import { useEffect, useRef, useState } from "react";
import type { AreaDesign, ModelPhoto } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import { drawMockup, loadImage, type ImageCache } from "./render";
import { ensureFonts } from "./fonts";
import type { PrintArea } from "@/lib/types";

/** Độ đậm nếp vải: áo tối thì nhân bóng rất nhẹ (nhân mạnh làm thiết kế đen sì), áo sáng nhân rõ */
function zoneShading(img: HTMLImageElement, m: ModelPhoto): number {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 16;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, m.x * img.naturalWidth, m.y * img.naturalHeight, m.w * img.naturalWidth, m.h * img.naturalHeight, 0, 0, 16, 16);
    const d = ctx.getImageData(0, 0, 16, 16).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += (0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!) / 255;
    const L = sum / 256;
    return L < 0.25 ? 0.12 : L < 0.5 ? 0.3 : 0.6;
  } catch {
    return 0.4;
  }
}

/**
 * Xem thiết kế trên người mẫu: ảnh người mẫu mặc áo trơn + vùng in đánh dấu trong CMS,
 * thiết kế vẽ bằng cùng bộ vẽ của Studio, nhân bóng nếp vải từ ảnh để trông như in thật. Chỉ để xem (không kéo thả).
 */
export function ModelPreview({ model, area, design, images, version }: { model: ModelPhoto; area: PrintArea; design: AreaDesign; images: ImageCache; version: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let alive = true;
    setImg(null);
    loadImage(assetUrl(model.photo))
      .then((i) => alive && setImg(i))
      .catch(() => alive && setErr(true));
    return () => {
      alive = false;
    };
  }, [model.photo]);

  useEffect(() => {
    const c = ref.current;
    if (!c || !img) return;
    let alive = true;
    void ensureFonts(design.layers).then(() => {
      if (!alive) return;
      const W = 1000;
      const H = Math.round((W * img.naturalHeight) / img.naturalWidth);
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);
      drawMockup(ctx, W, H, { zoneX: model.x, zoneY: model.y, zoneW: model.w, zoneH: model.h, widthMm: area.widthMm, heightMm: area.heightMm }, design, { mockup: img, mockupIsPhoto: true }, images, { shading: zoneShading(img, model) });
    });
    return () => {
      alive = false;
    };
  }, [img, model, area.widthMm, area.heightMm, design, images, version]);

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-ink/10 bg-[#f4f2ef]">
      {err ? <p className="p-10 text-center text-sm text-ink/60">Không tải được ảnh người mẫu.</p> : <canvas ref={ref} className="mx-auto block max-h-[calc(100svh-190px)] w-auto max-w-full max-lg:max-h-[min(62svh,calc(100svh-250px))]" aria-label="Thiết kế trên người mẫu" />}
      {!img && !err && <p className="absolute inset-0 flex items-center justify-center text-sm text-ink/60">Đang tải ảnh người mẫu…</p>}
      <span className="absolute left-2 top-2 rounded bg-ink/80 px-2 py-0.5 text-[11px] font-bold text-white">Ảnh minh hoạ · chỉ xem</span>
    </div>
  );
}
