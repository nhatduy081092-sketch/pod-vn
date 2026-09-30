import { DESIGN_FONTS, type AreaDesign, type DesignLayer, type ImageLayer, type ImageMask, type TextLayer } from "./design";

/**
 * Bộ vẽ DUY NHẤT cho: khung soạn thảo (web), ảnh xem trước, file in (web + CMS dựng lại cho xưởng).
 * Cùng 1 hàm vẽ -> thứ khách thấy = thứ xưởng in (WYSIWYG).
 * Đơn vị thiết kế: mm. k = số pixel / 1mm ở canvas đích.
 * Chỉ chạy trong trình duyệt (Canvas 2D). Import qua "@pod/shared/render".
 */

export type Img = CanvasImageSource & { width: number; height: number; naturalWidth?: number; naturalHeight?: number };
export type ImageCache = Map<string, Img>;
type Ctx = CanvasRenderingContext2D;
type Canvas = HTMLCanvasElement;

export function createCanvas(w: number, h: number): Canvas {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

/* ---------- ảnh ---------- */

/**
 * Ảnh upload đi qua API: ?raw=1 để API trả thẳng nội dung (không chuyển hướng sang CDN khác domain)
 * -> canvas không bị "bẩn" (tainted) và xuất được file.
 */
export function canvasSrc(src: string): string {
  return src.startsWith("/uploads/") && !src.includes("?") ? `${src}?raw=1` : src;
}

const loading = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (!src) return Promise.reject(new Error("Thiếu ảnh"));
  const url = canvasSrc(src);
  const hit = loading.get(url);
  if (hit) return hit;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    if (/^https?:\/\//.test(url)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      loading.delete(url);
      reject(new Error(`Không tải được ảnh: ${src.slice(0, 80)}`));
    };
    img.src = url;
  });
  loading.set(url, p);
  return p;
}

/** Kích thước ảnh (SVG không khai báo width/height có thể trả 0) */
export function imgSize(img: Img): { w: number; h: number } {
  return { w: img.naturalWidth || img.width || 1000, h: img.naturalHeight || img.height || 1000 };
}

/** Ảnh có vùng trong suốt không (lấy mẫu 4 góc + giữa cạnh) – dùng để đổi màu áo trên ảnh PNG nền trong */
export function hasTransparency(img: Img): boolean {
  try {
    const c = createCanvas(32, 32);
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, 32, 32);
    const d = ctx.getImageData(0, 0, 32, 32).data;
    for (const [x, y] of [
      [0, 0],
      [31, 0],
      [0, 31],
      [31, 31],
      [16, 0],
      [0, 16],
    ] as const)
      if (d[(y * 32 + x) * 4 + 3]! < 200) return true;
    return false;
  } catch {
    return false;
  }
}

/* ---------- font ---------- */

/** Link Google Fonts cho mọi font của công cụ thiết kế (subset tiếng Việt tự nạp theo unicode-range) */
export const DESIGN_FONTS_HREF =
  "https://fonts.googleapis.com/css2?" +
  DESIGN_FONTS.map((f) => {
    const fam = f.family.replace(/ /g, "+");
    return f.weights.length > 1 || f.weights[0] !== 400 ? `family=${fam}:wght@${f.weights.join(";")}` : `family=${fam}`;
  }).join("&") +
  "&display=swap";

/** Chờ font của các lớp chữ tải xong trước khi vẽ (canvas không tự chờ web font) */
export async function ensureDesignFonts(layers: DesignLayer[]): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  await Promise.all(
    layers
      .filter((l): l is TextLayer => l.type === "text")
      .map((l) => document.fonts.load(fontString(l, 40), l.text).catch(() => [])),
  );
}

/* ---------- chữ ---------- */

export function fontString(l: Pick<TextLayer, "font" | "bold" | "italic">, px: number): string {
  return `${l.italic ? "italic " : ""}${l.bold ? 700 : 400} ${px}px "${l.font}", "Be Vietnam Pro", sans-serif`;
}

type Segmenter = { segment(s: string): Iterable<{ segment: string }> };
const seg: Segmenter | null = (() => {
  const I = (globalThis as { Intl?: { Segmenter?: new (l: string, o: { granularity: string }) => Segmenter } }).Intl;
  return I?.Segmenter ? new I.Segmenter("vi", { granularity: "grapheme" }) : null;
})();

/** Tách ký tự hiển thị (giữ nguyên chữ có dấu tổ hợp) */
export function graphemes(s: string): string[] {
  return seg ? Array.from(seg.segment(s), (x) => x.segment) : Array.from(s);
}

let mctx: Ctx | null | undefined;
function measureCtx(): Ctx | null {
  if (mctx !== undefined) return mctx;
  mctx = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
  return mctx;
}

function lineWidthPx(ctx: Ctx, line: string, spacingPx: number): number {
  if (!spacingPx) return ctx.measureText(line || " ").width;
  const g = graphemes(line);
  return g.reduce((s, ch) => s + ctx.measureText(ch).width, 0) + spacingPx * Math.max(0, g.length - 1);
}

/** Hình học chữ cong (mm): bán kính, góc trải, khung bao */
export function curveGeometry(textWmm: number, fontMm: number, curve: number) {
  const theta = (Math.min(100, Math.abs(curve)) / 100) * 2 * Math.PI;
  if (theta < 0.02 || textWmm <= 0) return null;
  const R = textWmm / theta;
  const half = theta / 2;
  const w = (half >= Math.PI / 2 ? 2 * R : 2 * R * Math.sin(half)) + fontMm;
  const h = R * (1 - Math.cos(half)) + fontMm;
  return { theta, R, w, h };
}

const curveText = (l: Pick<TextLayer, "text">) => l.text.replace(/\s*\n+\s*/g, " ");

type Measurable = Pick<TextLayer, "text" | "font" | "bold" | "italic" | "fontSize" | "lineHeight" | "stroke" | "letterSpacing" | "curve">;

/** Đo khung chữ (mm) – dùng để chọn/kéo lớp chữ và căn chỉnh */
export function measureText(l: Measurable): { w: number; h: number } {
  const ctx = measureCtx();
  const k = 10; // đo ở 10px/mm cho chính xác
  const curved = !!l.curve && Math.abs(l.curve) >= 1;
  const lines = curved ? [curveText(l)] : l.text.split("\n");
  const spacing = (l.letterSpacing ?? 0) * l.fontSize * k;
  let max = 0;
  if (ctx) {
    ctx.font = fontString(l, l.fontSize * k);
    for (const line of lines) max = Math.max(max, lineWidthPx(ctx, line, spacing));
  } else {
    max = Math.max(...lines.map((x) => x.length)) * l.fontSize * k * 0.55;
  }
  const stroke = (l.stroke?.width ?? 0) * 2;
  if (curved) {
    const g = curveGeometry(max / k, l.fontSize, l.curve!);
    if (g) return { w: Math.max(1, g.w + stroke), h: Math.max(1, g.h + stroke) };
  }
  return { w: Math.max(1, max / k + stroke), h: Math.max(1, lines.length * l.fontSize * (l.lineHeight ?? 1.15) + stroke) };
}

type Glyph = { ch: string; x: number; y: number; rot: number; align: CanvasTextAlign };

/** Vị trí từng dòng/ký tự (px, gốc = tâm lớp) */
function layoutText(ctx: Ctx, l: TextLayer, k: number): Glyph[] {
  const spacing = (l.letterSpacing ?? 0) * l.fontSize * k;
  const fontPx = l.fontSize * k;
  const out: Glyph[] = [];

  if (l.curve && Math.abs(l.curve) >= 1) {
    const g = graphemes(curveText(l));
    const widths = g.map((ch) => ctx.measureText(ch).width);
    const total = widths.reduce((s, w) => s + w, 0) + spacing * Math.max(0, g.length - 1);
    const geo = curveGeometry(total / k, l.fontSize, l.curve);
    if (geo) {
      const R = geo.R * k;
      const H = geo.h * k;
      const dir = l.curve > 0 ? 1 : -1;
      const cy = dir * (R + fontPx / 2 - H / 2);
      let acc = -total / 2;
      g.forEach((ch, i) => {
        const a = (acc + widths[i]! / 2) / R;
        out.push({ ch, x: R * Math.sin(a), y: dir > 0 ? cy - R * Math.cos(a) : cy + R * Math.cos(a), rot: dir > 0 ? a : -a, align: "center" });
        acc += widths[i]! + spacing;
      });
      return out;
    }
  }

  const lines = l.text.split("\n");
  const lh = l.fontSize * (l.lineHeight ?? 1.15) * k;
  const half = (l.w / 2) * k - (l.stroke?.width ?? 0) * k;
  lines.forEach((line, i) => {
    const y = (i - (lines.length - 1) / 2) * lh;
    if (!spacing) {
      const align: CanvasTextAlign = l.align === "left" ? "left" : l.align === "right" ? "right" : "center";
      out.push({ ch: line, x: l.align === "left" ? -half : l.align === "right" ? half : 0, y, rot: 0, align });
      return;
    }
    const lw = lineWidthPx(ctx, line, spacing);
    let x = l.align === "left" ? -half : l.align === "right" ? half - lw : -lw / 2;
    for (const ch of graphemes(line)) {
      out.push({ ch, x, y, rot: 0, align: "left" });
      x += ctx.measureText(ch).width + spacing;
    }
  });
  return out;
}

function drawText(ctx: Ctx, l: TextLayer, k: number) {
  ctx.font = fontString(l, l.fontSize * k);
  ctx.textBaseline = "middle";
  const glyphs = layoutText(ctx, l, k);
  const paint = (stroke: boolean) => {
    for (const g of glyphs) {
      ctx.save();
      ctx.translate(g.x, g.y);
      if (g.rot) ctx.rotate(g.rot);
      ctx.textAlign = g.align;
      if (stroke) ctx.strokeText(g.ch, 0, 0);
      else ctx.fillText(g.ch, 0, 0);
      ctx.restore();
    }
  };
  // viền vẽ trước toàn bộ, chữ vẽ sau -> viền không đè lên nét chữ bên cạnh
  if (l.stroke && l.stroke.width > 0) {
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.lineWidth = l.stroke.width * 2 * k;
    ctx.strokeStyle = l.stroke.color;
    paint(true);
  }
  ctx.fillStyle = l.color;
  paint(false);
}

/* ---------- ảnh: cắt, mặt nạ hình, lặp họa tiết ---------- */

/** Đường viền mặt nạ hình, tâm (0,0), khung w×h (px) */
export function maskPath(ctx: Ctx | Path2D, mask: ImageMask, w: number, h: number) {
  const rx = w / 2;
  const ry = h / 2;
  const poly = (pts: [number, number][]) => {
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * rx, y * ry) : ctx.moveTo(x * rx, y * ry)));
    ctx.closePath();
  };
  switch (mask) {
    case "circle":
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      break;
    case "rounded": {
      const r = Math.min(w, h) * 0.18;
      ctx.moveTo(-rx + r, -ry);
      ctx.arcTo(rx, -ry, rx, ry, r);
      ctx.arcTo(rx, ry, -rx, ry, r);
      ctx.arcTo(-rx, ry, -rx, -ry, r);
      ctx.arcTo(-rx, -ry, rx, -ry, r);
      ctx.closePath();
      break;
    }
    case "heart":
      ctx.moveTo(0, ry * 0.95);
      ctx.bezierCurveTo(-rx * 1.1, ry * 0.2, -rx * 1.05, -ry * 0.95, -rx * 0.5, -ry * 0.95);
      ctx.bezierCurveTo(-rx * 0.15, -ry * 0.95, 0, -ry * 0.62, 0, -ry * 0.5);
      ctx.bezierCurveTo(0, -ry * 0.62, rx * 0.15, -ry * 0.95, rx * 0.5, -ry * 0.95);
      ctx.bezierCurveTo(rx * 1.05, -ry * 0.95, rx * 1.1, ry * 0.2, 0, ry * 0.95);
      ctx.closePath();
      break;
    case "star":
      poly(
        Array.from({ length: 10 }, (_, i) => {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const r = i % 2 ? 0.45 : 1;
          return [Math.cos(a) * r, Math.sin(a) * r + 0.08] as [number, number];
        }),
      );
      break;
    case "hexagon":
      poly(Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3), Math.sin((i * Math.PI) / 3)] as [number, number]));
      break;
    case "triangle":
      poly([
        [0, -1],
        [1, 1],
        [-1, 1],
      ]);
      break;
    case "diamond":
      poly([
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ]);
      break;
  }
}

/** Vẽ 1 ảnh (đã cắt + mặt nạ) vào khung w×h px, tâm tại gốc toạ độ hiện tại */
function drawCell(ctx: Ctx, img: Img, l: Pick<ImageLayer, "crop" | "mask">, w: number, h: number, flipX = false, flipY = false) {
  const s = imgSize(img);
  const c = l.crop;
  ctx.save();
  if (flipX || flipY) ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  if (l.mask) {
    ctx.beginPath();
    maskPath(ctx, l.mask, w, h);
    ctx.clip();
  }
  ctx.imageSmoothingQuality = "high";
  if (c) ctx.drawImage(img, c.x * s.w, c.y * s.h, c.w * s.w, c.h * s.h, -w / 2, -h / 2, w, h);
  else ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** PRNG có hạt giống (kiểu lặp ngẫu nhiên phải giống hệt nhau giữa web và file in) */
function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Lặp họa tiết: dựng 1 "ô mẫu" (unit) theo kiểu lặp rồi phủ kín bằng pattern.
 * Ô mẫu không vượt độ phân giải ảnh gốc và tối đa 4096px mỗi cạnh (đủ nét, không tốn bộ nhớ).
 */
function drawTiled(ctx: Ctx, img: Img, l: ImageLayer, k: number, areaWmm: number, areaHmm: number) {
  const mode = l.tileMode ?? "grid";
  const cw = l.w + (l.tileGapX ?? 0);
  const ch = l.h + (l.tileGapY ?? 0);
  const [nx, ny] = mode === "halfDrop" ? [2, 1] : mode === "brick" ? [1, 2] : mode === "mirror" ? [2, 2] : mode === "random" ? [4, 4] : [1, 1];
  const unitW = cw * nx * k;
  const unitH = ch * ny * k;
  const src = imgSize(img);
  const srcPxPerMm = Math.max((src.w * (l.crop?.w ?? 1)) / l.w, (src.h * (l.crop?.h ?? 1)) / l.h);
  const r = Math.min(1, srcPxPerMm / k, 4096 / unitW, 4096 / unitH);
  const unit = createCanvas(unitW * r, unitH * r);
  const u = unit.getContext("2d");
  if (!u) return;
  const sx = unit.width / unitW;
  const sy = unit.height / unitH;
  u.scale(sx * k, sy * k); // từ đây đơn vị = mm
  const rand = rng(l.tileSeed ?? 1);
  const cell = (cx: number, cy: number, fx = false, fy = false) => {
    u.save();
    u.translate(cx, cy);
    drawCell(u, img, l, l.w, l.h, fx, fy);
    u.restore();
  };
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const cx = (i + 0.5) * cw;
      const cy = (j + 0.5) * ch;
      if (mode === "halfDrop" && i === 1) {
        cell(cx, cy + ch / 2);
        cell(cx, cy - ch / 2);
      } else if (mode === "brick" && j === 1) {
        cell(cx + cw / 2, cy);
        cell(cx - cw / 2, cy);
      } else if (mode === "mirror") cell(cx, cy, i === 1, j === 1);
      else if (mode === "random") {
        const v = Math.floor(rand() * 4);
        cell(cx, cy, v === 1 || v === 3, v === 2 || v === 3);
      } else cell(cx, cy);
    }
  const pat = ctx.createPattern(unit, "repeat");
  if (pat) {
    pat.setTransform(new DOMMatrix().translate((-cw / 2) * k, (-ch / 2) * k).scale(1 / sx, 1 / sy));
    ctx.fillStyle = pat;
    const d = Math.hypot(areaWmm, areaHmm) * k * 2 + Math.hypot(l.x, l.y) * k;
    ctx.fillRect(-d, -d, d * 2, d * 2);
  }
  unit.width = unit.height = 0;
}

/* ---------- lớp & mặt in ---------- */

function drawLayer(ctx: Ctx, l: DesignLayer, k: number, images: ImageCache, areaWmm: number, areaHmm: number) {
  ctx.save();
  ctx.globalAlpha = l.opacity ?? 1;
  ctx.translate(l.x * k, l.y * k);
  ctx.rotate(((l.rotation ?? 0) * Math.PI) / 180);
  if (l.flipX || l.flipY) ctx.scale(l.flipX ? -1 : 1, l.flipY ? -1 : 1);
  if (l.type === "image") {
    const img = images.get(l.src);
    if (img) {
      if (l.tile) drawTiled(ctx, img, l, k, areaWmm, areaHmm);
      else drawCell(ctx, img, l, l.w * k, l.h * k);
    }
  } else if (l.field) {
    // ô tên/số: tên dài hơn vùng in thì tự thu nhỏ cỡ chữ cho vừa (giữ nguyên tâm)
    const m = measureText(l);
    const fit = Math.min(1, (areaWmm * 0.94) / Math.max(1, m.w));
    drawText(ctx, fit < 1 ? { ...l, fontSize: l.fontSize * fit, stroke: l.stroke ? { ...l.stroke, width: l.stroke.width * fit } : undefined } : l, k);
  } else {
    drawText(ctx, l, k);
  }
  ctx.restore();
}

/**
 * Vẽ thiết kế 1 mặt vào ctx. ctx phải đã translate về góc trên-trái vùng in.
 * Nội dung bị cắt trong khung vùng in (widthMm × heightMm).
 */
export function drawArea(ctx: Ctx, design: AreaDesign, widthMm: number, heightMm: number, k: number, images: ImageCache) {
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

/** Các ảnh cần tải trước khi vẽ 1 mặt */
export function layerImageSrcs(design: AreaDesign): string[] {
  return design.layers.filter((l): l is Extract<DesignLayer, { type: "image" }> => l.type === "image").map((l) => l.src);
}

/* ---------- mockup ---------- */

export type AreaGeom = { zoneX: number; zoneY: number; zoneW: number; zoneH: number; widthMm: number; heightMm: number; warp?: string };

/** Hình chữ nhật (px) của vùng in trên ảnh mockup đã đặt tại (mx,my,mw,mh), giữ đúng tỉ lệ mm */
export function printRectOnMockup(area: AreaGeom, mock: { x: number; y: number; w: number; h: number }) {
  const zx = mock.x + area.zoneX * mock.w;
  const zy = mock.y + area.zoneY * mock.h;
  const zw = area.zoneW * mock.w;
  const zh = area.zoneH * mock.h;
  const k = Math.min(zw / area.widthMm, zh / area.heightMm);
  const w = area.widthMm * k;
  const h = area.heightMm * k;
  return { x: zx + (zw - w) / 2, y: zy + (zh - h) / 2, w, h, k };
}

export type MockupAssets = {
  mockup?: Img;
  mask?: Img;
  overlay?: Img;
  /** ảnh chụp thật (JPG/PNG) – bật hiệu ứng nếp vải; mockup SVG vẽ tay thì không */
  mockupIsPhoto?: boolean;
  /** ảnh sản phẩm có nền trong suốt -> đổi được màu áo kể cả khi không có mask */
  mockupHasAlpha?: boolean;
};

export type MockupOptions = {
  background?: string;
  padding?: number;
  /** Màu vải (mã hex của phân loại màu) – nhuộm ảnh sản phẩm, giữ bóng đổ */
  garmentColor?: string | null;
  /** 0–1: độ đậm nếp vải/bóng đổ in lên thiết kế (chỉ với ảnh chụp thật) */
  shading?: number;
};

/**
 * Vẽ sản phẩm + thiết kế (ảnh xem trước / khung soạn thảo):
 * ảnh sản phẩm → nhuộm màu vải → thiết kế (cắt theo vùng in, áp mask dáng áo) → nếp vải → lớp viền.
 */
export function drawMockup(ctx: Ctx, canvasW: number, canvasH: number, area: AreaGeom, design: AreaDesign, assets: MockupAssets, images: ImageCache, opts: MockupOptions = {}) {
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

  // nhuộm màu vải: chỉ trong dáng áo (mask) hoặc phần không trong suốt của ảnh sản phẩm
  const tintShape = assets.mask ?? (assets.mockupHasAlpha ? assets.mockup : undefined);
  if (opts.garmentColor && tintShape && !/^#f{6}$/i.test(opts.garmentColor)) {
    const t = createCanvas(canvasW, canvasH);
    const tctx = t.getContext("2d")!;
    tctx.fillStyle = opts.garmentColor;
    tctx.fillRect(mock.x, mock.y, mock.w, mock.h);
    tctx.globalCompositeOperation = "destination-in";
    tctx.drawImage(tintShape, mock.x, mock.y, mock.w, mock.h);
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(t, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    t.width = t.height = 0;
  }

  const pr = printRectOnMockup(area, mock);
  // thiết kế vẽ lên canvas phụ để áp mask mà không ảnh hưởng ảnh sản phẩm
  const off = createCanvas(canvasW, canvasH);
  const octx = off.getContext("2d")!;
  if (assets.mask) {
    // In toàn thân: phần vải chưa có thiết kế là vải trơn (màu đã chọn hoặc trắng), không phải hoa văn của ảnh mẫu
    octx.fillStyle = opts.garmentColor || "#ffffff";
    octx.fillRect(mock.x, mock.y, mock.w, mock.h);
  }
  if (area.warp === "cylinder") drawCylinder(octx, area, design, mock, images);
  else {
    octx.translate(pr.x, pr.y);
    drawArea(octx, design, area.widthMm, area.heightMm, pr.k, images);
  }
  octx.setTransform(1, 0, 0, 1, 0, 0);
  if (assets.mask) {
    octx.globalCompositeOperation = "destination-in";
    octx.drawImage(assets.mask, mock.x, mock.y, mock.w, mock.h);
    octx.globalCompositeOperation = "source-over";
  }
  ctx.drawImage(off, 0, 0);

  // nếp vải: lấy độ sáng tối của ảnh chụp, nhân lên phần có thiết kế
  const shading = opts.shading ?? 0;
  if (shading > 0 && assets.mockup && assets.mockupIsPhoto) {
    const s = createCanvas(canvasW, canvasH);
    const sctx = s.getContext("2d")!;
    sctx.drawImage(assets.mockup, mock.x, mock.y, mock.w, mock.h);
    sctx.globalCompositeOperation = "saturation";
    sctx.fillStyle = "#808080";
    sctx.fillRect(0, 0, canvasW, canvasH);
    sctx.globalCompositeOperation = "destination-in";
    sctx.drawImage(off, 0, 0);
    ctx.globalAlpha = Math.min(1, shading);
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(s, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    s.width = s.height = 0;
  }
  off.width = off.height = 0;
  if (assets.overlay) ctx.drawImage(assets.overlay, mock.x, mock.y, mock.w, mock.h);
  ctx.restore();
  return { mock, printRect: pr };
}

/**
 * Cốc / bình: vùng in là dải cuộn quanh thân (chu vi × chiều cao).
 * Khung vùng in trên ảnh = mặt nhìn thấy (nửa vòng) -> hiện phần giữa dải in, co dần về 2 mép như mặt trụ thật.
 */
function drawCylinder(ctx: Ctx, area: AreaGeom, design: AreaDesign, mock: { x: number; y: number; w: number; h: number }, images: ImageCache) {
  const zx = mock.x + area.zoneX * mock.w;
  const zy = mock.y + area.zoneY * mock.h;
  const zw = Math.max(1, area.zoneW * mock.w);
  const zh = Math.max(1, area.zoneH * mock.h);
  const k = zh / area.heightMm; // px/mm theo chiều cao
  const flat = createCanvas(area.widthMm * k, zh);
  const fctx = flat.getContext("2d");
  if (!fctx) return;
  drawArea(fctx, design, area.widthMm, area.heightMm, k, images);
  const W = flat.width;
  const cols = Math.ceil(zw);
  const srcX = (i: number) => {
    const u = Math.max(-1, Math.min(1, (i / cols) * 2 - 1));
    return (0.5 + Math.asin(u) / (2 * Math.PI)) * W;
  };
  for (let i = 0; i < cols; i++) {
    const s0 = srcX(i);
    const s1 = srcX(i + 1);
    ctx.drawImage(flat, s0, 0, Math.max(0.5, s1 - s0), flat.height, zx + (i * zw) / cols, zy, zw / cols + 0.5, zh);
  }
  // bóng mặt trụ: tối dần về 2 mép
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const g = ctx.createLinearGradient(zx, 0, zx + zw, 0);
  g.addColorStop(0, "rgba(0,0,0,.32)");
  g.addColorStop(0.18, "rgba(0,0,0,.06)");
  g.addColorStop(0.4, "rgba(255,255,255,.06)");
  g.addColorStop(0.82, "rgba(0,0,0,.06)");
  g.addColorStop(1, "rgba(0,0,0,.36)");
  ctx.fillStyle = g;
  ctx.fillRect(zx, zy, zw, zh);
  ctx.restore();
  flat.width = flat.height = 0;
}

/** Vẽ phẳng (không có ảnh sản phẩm): vùng in căn giữa khung, nền trắng – dùng để chỉnh chi tiết / sản phẩm cong */
export function drawFlat(ctx: Ctx, canvasW: number, canvasH: number, area: { widthMm: number; heightMm: number }, design: AreaDesign, images: ImageCache, opts: { background?: string; padding?: number; paper?: string } = {}) {
  const pad = opts.padding ?? 0;
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }
  const k = Math.min((canvasW - pad * 2) / area.widthMm, (canvasH - pad * 2) / area.heightMm);
  const w = area.widthMm * k;
  const h = area.heightMm * k;
  const rect = { x: (canvasW - w) / 2, y: (canvasH - h) / 2, w, h, k };
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.18)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = opts.paper ?? "#ffffff";
  ctx.fillRect(rect.x, rect.y, w, h);
  ctx.restore();
  ctx.save();
  ctx.translate(rect.x, rect.y);
  drawArea(ctx, design, area.widthMm, area.heightMm, k, images);
  ctx.restore();
  return rect;
}

/* ---------- xuất file ---------- */

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Trình duyệt không xuất được ảnh (thiếu bộ nhớ hoặc ảnh khác nguồn)"))), type, quality));
}

/** File in 1 mặt: PNG nền trong suốt (trừ khi có màu nền), đúng kích thước pixel đã tính */
export async function renderAreaPng(design: AreaDesign, area: { widthMm: number; heightMm: number }, px: { w: number; h: number }, images: ImageCache): Promise<Blob> {
  const canvas = createCanvas(px.w, px.h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Thiết bị không hỗ trợ xuất file in (thiếu bộ nhớ canvas)");
  drawArea(ctx, design, area.widthMm, area.heightMm, px.w / area.widthMm, images);
  try {
    return await canvasToBlob(canvas, "image/png");
  } finally {
    canvas.width = canvas.height = 0; // giải phóng bộ nhớ (quan trọng trên iPhone)
  }
}
