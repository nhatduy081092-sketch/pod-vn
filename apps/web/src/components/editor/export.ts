"use client";
import { printPixelSize, usedAreas, type AreaDesign, type DesignFile, type DesignJson, type OrderDesign } from "@pod/shared";
import { canvasSafeImage } from "@/lib/config";
import type { PrintArea } from "@/lib/types";
import { drawArea, drawMockup, layerImageSrcs, loadImage, type ImageCache, type MockupAssets } from "./render";
import { ensureFonts } from "./fonts";

export async function loadLayerImages(design: AreaDesign, cache: ImageCache) {
  await Promise.all(
    layerImageSrcs(design)
      .filter((s) => !cache.has(s))
      .map((s) => loadImage(s).then((img) => cache.set(s, img))),
  );
}

export async function loadAreaAssets(area: PrintArea): Promise<MockupAssets> {
  const get = (p: string) => (p ? loadImage(canvasSafeImage(p)).catch(() => undefined) : Promise.resolve(undefined));
  const [mockup, mask, overlay] = await Promise.all([get(area.mockupImage), get(area.maskImage), get(area.overlayImage)]);
  return { mockup, mask, overlay };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Trình duyệt không xuất được ảnh"))), type, quality));
}

/** File in: PNG nền trong suốt (trừ khi có màu nền), đúng kích thước thật theo DPI của mặt in */
export async function renderPrintFile(area: PrintArea, design: AreaDesign, cache: ImageCache) {
  const size = printPixelSize(area);
  const canvas = document.createElement("canvas");
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Thiết bị không hỗ trợ xuất file in (thiếu bộ nhớ canvas)");
  drawArea(ctx, design, area.widthMm, area.heightMm, size.w / area.widthMm, cache);
  const blob = await toBlob(canvas, "image/png");
  canvas.width = canvas.height = 0; // giải phóng bộ nhớ (quan trọng trên iPhone)
  return { blob, ...size };
}

/** Ảnh xem trước trên sản phẩm (JPEG nền trắng) */
export async function renderPreview(area: PrintArea, design: AreaDesign, cache: ImageCache, assets: MockupAssets, px = 900) {
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  drawMockup(ctx, px, px, area, design, assets, cache, { background: "#ffffff", padding: px * 0.03 });
  const blob = await toBlob(canvas, "image/jpeg", 0.88);
  canvas.width = canvas.height = 0;
  return blob;
}

export async function uploadBlob(blob: Blob, filename: string, kind: "print" | "design"): Promise<string> {
  const fd = new FormData();
  fd.append("file", new File([blob], filename, { type: blob.type }));
  fd.append("kind", kind);
  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Tải file lên thất bại");
  return data.url;
}

/**
 * Xuất toàn bộ thiết kế: mỗi mặt có nội dung -> 1 file in + 1 ảnh xem trước, tải lên server.
 * Trả về OrderDesign để gắn vào giỏ hàng / báo giá / mẫu seller.
 */
export async function exportDesign(areas: PrintArea[], design: DesignJson, cache: ImageCache, onProgress?: (msg: string) => void): Promise<OrderDesign> {
  const used = usedAreas(design);
  if (!used.length) throw new Error("Thiết kế đang trống – thêm ảnh hoặc chữ trước");
  const files: DesignFile[] = [];
  let i = 0;
  for (const key of used) {
    i++;
    const area = areas.find((a) => a.key === key);
    const ad = design.areas[key];
    if (!area || !ad) continue;
    onProgress?.(`Đang xuất file in "${area.name}" (${i}/${used.length})…`);
    await ensureFonts(ad.layers);
    await loadLayerImages(ad, cache);
    const print = await renderPrintFile(area, ad, cache);
    const printUrl = await uploadBlob(print.blob, `${key}-print.png`, "print");
    onProgress?.(`Đang tạo ảnh xem trước "${area.name}" (${i}/${used.length})…`);
    const assets = await loadAreaAssets(area);
    const preview = await renderPreview(area, ad, cache, assets);
    const previewUrl = await uploadBlob(preview, `${key}-preview.jpg`, "design");
    files.push({ area: key, name: area.name, printUrl, previewUrl, widthPx: print.w, heightPx: print.h, dpi: print.dpi });
  }
  return { json: design, files };
}
