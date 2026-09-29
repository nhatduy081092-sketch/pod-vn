"use client";
import { designFields, personalizeArea, printPixelSize, usedAreas, type AreaDesign, type DesignFile, type DesignJson, type OrderDesign } from "@pod/shared";
import { canvasSafeImage } from "@/lib/config";
import type { PrintArea } from "@/lib/types";
import { canvasToBlob, createCanvas, drawMockup, hasTransparency, layerImageSrcs, loadImage, renderAreaPng, type ImageCache, type MockupAssets, type MockupOptions } from "./render";
import { ensureFonts } from "./fonts";

export async function loadLayerImages(design: AreaDesign, cache: ImageCache) {
  await Promise.all(
    layerImageSrcs(design)
      .filter((s) => !cache.has(s))
      .map((s) => loadImage(s).then((img) => cache.set(s, img))),
  );
}

const assetCache = new Map<string, Promise<MockupAssets>>();

/** Ảnh sản phẩm + mask + viền của 1 mặt in (có nhớ đệm) */
export function loadAreaAssets(area: PrintArea): Promise<MockupAssets> {
  const key = [area.mockupImage, area.maskImage, area.overlayImage].join("|");
  const hit = assetCache.get(key);
  if (hit) return hit;
  const get = (p: string) => (p ? loadImage(canvasSafeImage(p)).catch(() => undefined) : Promise.resolve(undefined));
  const p = Promise.all([get(area.mockupImage), get(area.maskImage), get(area.overlayImage)]).then(([mockup, mask, overlay]) => ({
    mockup,
    mask,
    overlay,
    mockupIsPhoto: !!mockup && !/\.svg(\?|$)/i.test(area.mockupImage),
    mockupHasAlpha: !!mockup && !mask && hasTransparency(mockup),
  }));
  assetCache.set(key, p);
  return p;
}

/** File in khách xuất: đúng kích thước thật theo DPI. Ô tên/số đồng phục được bỏ ra (xưởng dựng file riêng từng người). */
export async function renderPrintFile(area: PrintArea, design: AreaDesign, cache: ImageCache) {
  const size = printPixelSize(area);
  const blob = await renderAreaPng(personalizeArea(design, null), area, size, cache);
  return { blob, ...size };
}

/** Ảnh xem trước trên sản phẩm (JPEG nền trắng) */
export async function renderPreview(area: PrintArea, design: AreaDesign, cache: ImageCache, assets: MockupAssets, px = 900, opts: MockupOptions = {}) {
  const canvas = createCanvas(px, px);
  const ctx = canvas.getContext("2d")!;
  drawMockup(ctx, px, px, area, design, assets, cache, { background: "#ffffff", padding: px * 0.03, shading: 0.45, ...opts });
  try {
    return await canvasToBlob(canvas, "image/jpeg", 0.88);
  } finally {
    canvas.width = canvas.height = 0;
  }
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
export async function exportDesign(areas: PrintArea[], design: DesignJson, cache: ImageCache, onProgress?: (msg: string) => void, opts: { garmentColor?: string | null } = {}): Promise<OrderDesign> {
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
    const preview = await renderPreview(area, ad, cache, assets, 900, { garmentColor: opts.garmentColor });
    const previewUrl = await uploadBlob(preview, `${key}-preview.jpg`, "design");
    files.push({ area: key, name: area.name, printUrl, previewUrl, widthPx: print.w, heightPx: print.h, dpi: print.dpi });
  }
  return { json: design, files };
}

/** Thiết kế có ô tên/số đồng phục không */
export const hasTeamFields = (d: DesignJson) => designFields(d).length > 0;
