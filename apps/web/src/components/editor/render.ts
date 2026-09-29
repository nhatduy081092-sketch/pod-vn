import type { AreaDesign, DesignLayer, TextLayer } from "@pod/shared";

/**
 * Bộ vẽ DUY NHẤT cho: khung soạn thảo, file in, ảnh xem trước.
 * Cùng 1 hàm vẽ -> thứ khách thấy = thứ xưởng in (WYSIWYG).
 * Đơn vị thiết kế: mm. k = số pixel / 1mm ở canvas đích.
 */

export type ImageCache = Map<string, HTMLImageElement>;

const loading = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (!src) return Promise.reject(new Error("Thiếu ảnh"));
  const hit = loading.get(src);
  if (hit) return hit;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    if (/^https?:\/\//.test(src)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      loading.delete(src);
      reject(new Error(`Không tải được ảnh: ${src.slice(0, 80)}`));
    };
    img.src = src;
  });
  loading.set(src, p);
  return p;
}

/** Kích thước ảnh (SVG không khai báo width/height có thể trả 0) */
export function imgSize(img: HTMLImageElement): { w: number; h: number } {
  return { w: img.naturalWidth || img.width || 1000, h: img.naturalHeight || img.height || 1000 };
}

export function fontString(l: Pick<TextLayer, "font" | "bold" | "italic">, px: number): string {
  return `${l.italic ? "italic " : ""}${l.bold ? 700 : 400} ${px}px "${l.font}", "Be Vietnam Pro", sans-serif`;
}

const measureCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;

/** Đo khung chữ (mm) – dùng để chọn/kéo lớp chữ và căn chỉnh */
export function measureText(l: Pick<TextLayer, "text" | "font" | "bold" | "italic" | "fontSize" | "lineHeight" | "stroke">): { w: number; h: number } {
  const ctx = measureCanvas?.getContext("2d");
  const k = 10; // đo ở 10px/mm cho chính xác
  const lines = l.text.split("\n");
  let max = 0;
  if (ctx) {
    ctx.font = fontString(l, l.fontSize * k);
    for (const line of lines) max = Math.max(max, ctx.measureText(line || " ").width);
  } else {
    max = Math.max(...lines.map((x) => x.length)) * l.fontSize * k * 0.55;
  }
  const stroke = (l.stroke?.width ?? 0) * 2;
  return { w: Math.max(1, max / k + stroke), h: Math.max(1, lines.length * l.fontSize * (l.lineHeight ?? 1.15) + stroke) };
}

function drawText(ctx: CanvasRenderingContext2D, l: TextLayer, k: number) {
  const lines = l.text.split("\n");
  const lh = l.fontSize * (l.lineHeight ?? 1.15) * k;
  ctx.font = fontString(l, l.fontSize * k);
  ctx.textBaseline = "middle";
  ctx.textAlign = l.align === "left" ? "left" : l.align === "right" ? "right" : "center";
  const x = l.align === "left" ? (-l.w / 2) * k : l.align === "right" ? (l.w / 2) * k : 0;
  lines.forEach((line, i) => {
    const y = (i - (lines.length - 1) / 2) * lh;
    if (l.stroke && l.stroke.width > 0) {
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.lineWidth = l.stroke.width * 2 * k;
      ctx.strokeStyle = l.stroke.color;
      ctx.strokeText(line, x, y);
    }
    ctx.fillStyle = l.color;
    ctx.fillText(line, x, y);
  });
}

function drawLayer(ctx: CanvasRenderingContext2D, l: DesignLayer, k: number, images: ImageCache, areaWmm: number, areaHmm: number) {
  ctx.save();
  ctx.globalAlpha = l.opacity ?? 1;
  ctx.translate(l.x * k, l.y * k);
  ctx.rotate(((l.rotation ?? 0) * Math.PI) / 180);
  if (l.flipX) ctx.scale(-1, 1);
  if (l.type === "image") {
    const img = images.get(l.src);
    if (img) {
      if (l.tile) {
        // Lặp họa tiết: mỗi ô w×h mm, phủ kín vùng in (tính theo đường chéo để xoay vẫn kín)
        const s = imgSize(img);
        const pat = ctx.createPattern(img, "repeat");
        if (pat) {
          pat.setTransform(new DOMMatrix().translate((-l.w / 2) * k, (-l.h / 2) * k).scale((l.w * k) / s.w, (l.h * k) / s.h));
          ctx.fillStyle = pat;
          const d = Math.hypot(areaWmm, areaHmm) * k * 2;
          ctx.fillRect(-d, -d, d * 2, d * 2);
        }
      } else {
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, (-l.w / 2) * k, (-l.h / 2) * k, l.w * k, l.h * k);
      }
    }
  } else {
    drawText(ctx, l, k);
  }
  ctx.restore();
}

/**
 * Vẽ thiết kế 1 mặt vào ctx. ctx phải đã translate về góc trên-trái vùng in.
 * Nội dung bị cắt trong khung vùng in (widthMm × heightMm).
 */
export function drawArea(ctx: CanvasRenderingContext2D, design: AreaDesign, widthMm: number, heightMm: number, k: number, images: ImageCache) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, widthMm * k, heightMm * k);
  ctx.clip();
  if (design.bg) {
    ctx.fillStyle = design.bg;
    ctx.fillRect(0, 0, widthMm * k, heightMm * k);
  }
  for (const l of design.layers) drawLayer(ctx, l, k, images, widthMm, heightMm);
  ctx.restore();
}

/** Hình chữ nhật (px) của vùng in trên ảnh mockup đã đặt tại (mx,my,mw,mh), giữ đúng tỉ lệ mm */
export function printRectOnMockup(
  area: { zoneX: number; zoneY: number; zoneW: number; zoneH: number; widthMm: number; heightMm: number },
  mock: { x: number; y: number; w: number; h: number },
) {
  const zx = mock.x + area.zoneX * mock.w;
  const zy = mock.y + area.zoneY * mock.h;
  const zw = area.zoneW * mock.w;
  const zh = area.zoneH * mock.h;
  const k = Math.min(zw / area.widthMm, zh / area.heightMm);
  const w = area.widthMm * k;
  const h = area.heightMm * k;
  return { x: zx + (zw - w) / 2, y: zy + (zh - h) / 2, w, h, k };
}

export type MockupAssets = { mockup?: HTMLImageElement; mask?: HTMLImageElement; overlay?: HTMLImageElement };

/**
 * Vẽ sản phẩm + thiết kế (ảnh xem trước / khung soạn thảo):
 * ảnh sản phẩm → thiết kế (cắt theo vùng in, áp mask dáng áo nếu có) → lớp viền/bóng.
 */
export function drawMockup(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  area: { zoneX: number; zoneY: number; zoneW: number; zoneH: number; widthMm: number; heightMm: number },
  design: AreaDesign,
  assets: MockupAssets,
  images: ImageCache,
  opts: { background?: string; padding?: number } = {},
) {
  const pad = opts.padding ?? 0;
  ctx.save();
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }
  // ảnh sản phẩm: vừa khung (contain)
  const ms = assets.mockup ? imgSize(assets.mockup) : { w: 1000, h: 1000 };
  const scale = Math.min((canvasW - pad * 2) / ms.w, (canvasH - pad * 2) / ms.h);
  const mock = { w: ms.w * scale, h: ms.h * scale, x: 0, y: 0 };
  mock.x = (canvasW - mock.w) / 2;
  mock.y = (canvasH - mock.h) / 2;
  if (assets.mockup) ctx.drawImage(assets.mockup, mock.x, mock.y, mock.w, mock.h);

  const pr = printRectOnMockup(area, mock);
  // thiết kế vẽ lên canvas phụ để áp mask mà không ảnh hưởng ảnh sản phẩm
  const off = document.createElement("canvas");
  off.width = Math.ceil(canvasW);
  off.height = Math.ceil(canvasH);
  const octx = off.getContext("2d")!;
  if (assets.mask) {
    // In toàn thân: phần vải chưa có thiết kế là vải trắng (không phải hoa văn của ảnh mẫu)
    octx.fillStyle = "#ffffff";
    octx.fillRect(mock.x, mock.y, mock.w, mock.h);
  }
  octx.translate(pr.x, pr.y);
  drawArea(octx, design, area.widthMm, area.heightMm, pr.k, images);
  octx.setTransform(1, 0, 0, 1, 0, 0);
  if (assets.mask) {
    octx.globalCompositeOperation = "destination-in";
    octx.drawImage(assets.mask, mock.x, mock.y, mock.w, mock.h);
    octx.globalCompositeOperation = "source-over";
  }
  ctx.drawImage(off, 0, 0);
  if (assets.overlay) ctx.drawImage(assets.overlay, mock.x, mock.y, mock.w, mock.h);
  ctx.restore();
  return { mock, printRect: pr };
}

/** Các ảnh cần tải trước khi vẽ 1 mặt */
export function layerImageSrcs(design: AreaDesign): string[] {
  return design.layers.filter((l): l is Extract<DesignLayer, { type: "image" }> => l.type === "image").map((l) => l.src);
}
