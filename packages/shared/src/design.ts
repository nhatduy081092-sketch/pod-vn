import { z } from "zod";

/**
 * Dữ liệu thiết kế từ editor.
 * - Toạ độ tính bằng MILIMET trong vùng in (gốc = góc trên-trái vùng in), x/y là TÂM của lớp.
 * - Nhờ đó file in xuất ở bất kỳ DPI nào vẫn đúng kích thước thật.
 */
export const DESIGN_VERSION = 1;

/** Font Google hỗ trợ tiếng Việt (subset vietnamese) */
export const DESIGN_FONTS = [
  { family: "Be Vietnam Pro", label: "Be Vietnam Pro", weights: [400, 700, 900] },
  { family: "Montserrat", label: "Montserrat", weights: [400, 700, 900] },
  { family: "Oswald", label: "Oswald (cao, gọn)", weights: [400, 700] },
  { family: "Anton", label: "Anton (đậm, số áo)", weights: [400] },
  { family: "Playfair Display", label: "Playfair (sang trọng)", weights: [400, 700] },
  { family: "Nunito", label: "Nunito (tròn)", weights: [400, 800] },
  { family: "Lobster", label: "Lobster (nét cong)", weights: [400] },
  { family: "Dancing Script", label: "Dancing Script (viết tay)", weights: [400, 700] },
  { family: "Pacifico", label: "Pacifico (viết tay)", weights: [400] },
] as const;
export type DesignFont = (typeof DESIGN_FONTS)[number]["family"];
const FONT_FAMILIES = DESIGN_FONTS.map((f) => f.family) as [DesignFont, ...DesignFont[]];

export const DESIGN_LIMITS = {
  layersPerArea: 40,
  textLength: 300,
  /** Giới hạn pixel 1 file in xuất trên máy khách (iOS Safari giới hạn canvas ~16,7 triệu px) */
  maxPrintPixels: 16_000_000,
  /** File in cho xưởng (CMS, máy tính): cho phép lớn hơn – cờ/backdrop khổ lớn */
  maxProductionPixels: 64_000_000,
  /** Mức DPI dưới ngưỡng này cảnh báo đỏ (in sẽ vỡ) */
  hardMinDpi: 72,
} as const;

const mm = z.number().finite().min(-10000).max(10000);
const size = z.number().finite().min(0.5).max(10000);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Màu không hợp lệ");
const uploadUrl = z.string().max(300).regex(/^\/uploads\/[\w.-]+$/, "Ảnh thiết kế không hợp lệ");

const baseLayer = {
  id: z.string().min(1).max(40),
  x: mm,
  y: mm,
  w: size,
  h: size,
  rotation: z.number().finite().min(-360).max(360).default(0),
  opacity: z.number().min(0.05).max(1).default(1),
  flipX: z.boolean().optional(),
  flipY: z.boolean().optional(),
  /** Khoá: không kéo/xoay/co giãn trên khung (vẫn chọn được trong danh sách lớp) */
  locked: z.boolean().optional(),
};

/** Kiểu lặp họa tiết */
export const TILE_MODES = ["grid", "halfDrop", "brick", "mirror", "random"] as const;
export type TileMode = (typeof TILE_MODES)[number];
export const TILE_MODE_LABEL: Record<TileMode, string> = {
  grid: "Lưới thẳng",
  halfDrop: "So le dọc",
  brick: "So le ngang",
  mirror: "Soi gương",
  random: "Ngẫu nhiên",
};

/** Mặt nạ hình cho ảnh (cắt ảnh theo hình) */
export const IMAGE_MASKS = ["circle", "rounded", "heart", "star", "hexagon", "triangle", "diamond"] as const;
export type ImageMask = (typeof IMAGE_MASKS)[number];
export const IMAGE_MASK_LABEL: Record<ImageMask, string> = {
  circle: "Tròn",
  rounded: "Bo góc",
  heart: "Trái tim",
  star: "Ngôi sao",
  hexagon: "Lục giác",
  triangle: "Tam giác",
  diamond: "Thoi",
};

const unit = z.number().finite().min(0).max(1);
export const cropSchema = z
  .object({ x: unit, y: unit, w: z.number().finite().min(0.01).max(1), h: z.number().finite().min(0.01).max(1) })
  .refine((c) => c.x + c.w <= 1.0001 && c.y + c.h <= 1.0001, { message: "Vùng cắt ảnh không hợp lệ" });
export type ImageCrop = z.infer<typeof cropSchema>;

export const imageLayerSchema = z.object({
  ...baseLayer,
  type: z.literal("image"),
  src: uploadUrl,
  natW: z.number().int().min(1).max(100000),
  natH: z.number().int().min(1).max(100000),
  /** Ảnh gốc trước khi xoá nền (để khôi phục) */
  origSrc: uploadUrl.optional(),
  /** Cắt ảnh: phần giữ lại, tỉ lệ 0–1 so với ảnh gốc; w/h của lớp = kích thước phần đã cắt */
  crop: cropSchema.optional(),
  /** Cắt theo hình */
  mask: z.enum(IMAGE_MASKS).optional(),
  /** Lặp họa tiết phủ kín vùng in; w/h = kích thước 1 ô lặp */
  tile: z.boolean().optional(),
  tileMode: z.enum(TILE_MODES).optional(),
  /** Khoảng cách giữa các ô lặp (mm) */
  tileGapX: z.number().finite().min(0).max(1000).optional(),
  tileGapY: z.number().finite().min(0).max(1000).optional(),
  /** Hạt giống cho kiểu ngẫu nhiên (đổi = xáo lại) */
  tileSeed: z.number().int().min(0).max(1_000_000).optional(),
});

export const textLayerSchema = z.object({
  ...baseLayer,
  type: z.literal("text"),
  text: z.string().min(1).max(DESIGN_LIMITS.textLength),
  font: z.enum(FONT_FAMILIES),
  /** Cỡ chữ (mm – chiều cao chữ hoa xấp xỉ 0,7 × fontSize) */
  fontSize: z.number().finite().min(1).max(2000),
  color: hex,
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  align: z.enum(["left", "center", "right"]).default("center"),
  stroke: z.object({ color: hex, width: z.number().min(0).max(50) }).optional(),
  lineHeight: z.number().min(0.6).max(3).default(1.15),
  /** Giãn chữ, tính theo cỡ chữ (0,1 = 10% cỡ chữ) */
  letterSpacing: z.number().min(-0.2).max(2).optional(),
  /** Uốn cong: -100…100 (100 = tròn trọn vòng, dương = vòng cung lên, âm = cong xuống) */
  curve: z.number().min(-100).max(100).optional(),
  /** Ô đồng phục: chữ được thay bằng tên / số của từng thành viên khi in */
  field: z.enum(["name", "number"]).optional(),
});
export const DESIGN_FIELDS = { name: "Tên", number: "Số áo" } as const;
export type DesignField = keyof typeof DESIGN_FIELDS;

export const designLayerSchema = z.discriminatedUnion("type", [imageLayerSchema, textLayerSchema]);
export type ImageLayer = z.infer<typeof imageLayerSchema>;
export type TextLayer = z.infer<typeof textLayerSchema>;
export type DesignLayer = z.infer<typeof designLayerSchema>;

export const areaDesignSchema = z.object({
  bg: hex.nullable().default(null),
  layers: z.array(designLayerSchema).max(DESIGN_LIMITS.layersPerArea),
});
export type AreaDesign = z.infer<typeof areaDesignSchema>;

export const designJsonSchema = z.object({
  v: z.literal(DESIGN_VERSION),
  productId: z.string().min(1).max(40),
  areas: z.record(z.string().regex(/^[a-z0-9-]{1,30}$/), areaDesignSchema),
});
export type DesignJson = z.infer<typeof designJsonSchema>;

/* ---------- Kích thước vùng in theo size, viền tràn, vùng an toàn ---------- */

const areaMm = z.number().int().min(5).max(5000);
/** Kích thước vùng in riêng cho từng size (khoá = tên size, VD "60x90 cm") */
export const sizeSpecsSchema = z
  .record(z.string().trim().min(1).max(40), z.object({ widthMm: areaMm, heightMm: areaMm }))
  .refine((r) => Object.keys(r).length <= 40, { message: "Tối đa 40 size" });
export type SizeSpecs = z.infer<typeof sizeSpecsSchema>;

/** Thông số in của 1 mặt (đủ để dựng lại file in đúng size) */
export type AreaSpec = {
  widthMm: number;
  heightMm: number;
  dpi: number;
  /** Viền tràn mỗi cạnh (mm) – phần này bị xén bỏ sau khi in */
  bleedMm?: number;
  /** Vùng an toàn (mm, tính từ đường xén vào trong) – chữ/logo quan trọng nên nằm trong */
  safeMm?: number;
  sizeSpecs?: SizeSpecs | null;
};

/** Kích thước vùng in áp dụng cho 1 size (không có cấu hình riêng -> kích thước gốc) */
export function areaForSize<T extends AreaSpec>(a: T, size?: string | null): T {
  const s = size ? a.sizeSpecs?.[size] : undefined;
  return s ? { ...a, widthMm: s.widthMm, heightMm: s.heightMm } : a;
}

/** Sản phẩm có vùng in đổi theo size không */
export const hasSizeSpecs = (a: Pick<AreaSpec, "sizeSpecs">) => !!a.sizeSpecs && Object.keys(a.sizeSpecs).length > 0;

/** Khung (mm) của đường xén và vùng an toàn */
export function areaGuides(a: Pick<AreaSpec, "widthMm" | "heightMm" | "bleedMm" | "safeMm">) {
  const b = Math.max(0, a.bleedMm ?? 0);
  const s = Math.max(0, a.safeMm ?? 0);
  return {
    trim: { left: b, top: b, right: a.widthMm - b, bottom: a.heightMm - b },
    safe: { left: b + s, top: b + s, right: a.widthMm - b - s, bottom: a.heightMm - b - s },
    bleed: b,
    safeInset: s,
  };
}

/** Hệ số co giãn nội dung (theo đường xén) khi đổi từ vùng in gốc sang vùng in của 1 size */
export function sizeScale(from: Pick<AreaSpec, "widthMm" | "heightMm" | "bleedMm">, to: Pick<AreaSpec, "widthMm" | "heightMm" | "bleedMm">): number {
  const bf = Math.max(0, from.bleedMm ?? 0);
  const bt = Math.max(0, to.bleedMm ?? 0);
  return Math.min((to.widthMm - 2 * bt) / Math.max(1, from.widthMm - 2 * bf), (to.heightMm - 2 * bt) / Math.max(1, from.heightMm - 2 * bf));
}

/** Lớp có phủ kín toàn bộ vùng in không (ảnh nền tràn viền) */
function coversArea(l: DesignLayer, w: number, h: number) {
  if (l.type === "image" && l.tile) return true;
  const b = layerBounds(l);
  return b.left <= 0.5 && b.top <= 0.5 && b.right >= w - 0.5 && b.bottom >= h - 0.5;
}

/**
 * Co giãn thiết kế từ vùng in gốc sang kích thước của 1 size:
 * - nội dung co đều theo đường xén, giữ tâm; viền tràn giữ nguyên số mm
 * - lớp phủ kín vùng in (ảnh nền, họa tiết) vẫn phủ kín vùng mới
 */
export function scaleAreaDesign(ad: AreaDesign, from: Pick<AreaSpec, "widthMm" | "heightMm" | "bleedMm">, to: Pick<AreaSpec, "widthMm" | "heightMm" | "bleedMm">): AreaDesign {
  if (from.widthMm === to.widthMm && from.heightMm === to.heightMm) return ad;
  const s = sizeScale(from, to);
  const cover = Math.max(to.widthMm / from.widthMm, to.heightMm / from.heightMm);
  const cxF = from.widthMm / 2;
  const cyF = from.heightMm / 2;
  const cxT = to.widthMm / 2;
  const cyT = to.heightMm / 2;
  const layers = ad.layers.map((l) => {
    const f = coversArea(l, from.widthMm, from.heightMm) && !(l.type === "image" && l.tile) ? cover : s;
    const base = { ...l, x: cxT + (l.x - cxF) * f, y: cyT + (l.y - cyF) * f, w: l.w * f, h: l.h * f };
    if (l.type === "text") return { ...base, fontSize: Math.max(1, l.fontSize * f), stroke: l.stroke ? { ...l.stroke, width: l.stroke.width * f } : undefined } as DesignLayer;
    if (l.type === "image" && l.tile) return { ...base, tileGapX: l.tileGapX ? l.tileGapX * f : l.tileGapX, tileGapY: l.tileGapY ? l.tileGapY * f : l.tileGapY } as DesignLayer;
    return base as DesignLayer;
  });
  return { ...ad, layers };
}

/** File đã xuất cho từng mặt: file in (PNG trong suốt, đúng kích thước thật) + ảnh xem trước trên sản phẩm */
export const designFileSchema = z.object({
  area: z.string().regex(/^[a-z0-9-]{1,30}$/),
  name: z.string().max(60),
  printUrl: uploadUrl,
  previewUrl: uploadUrl,
  widthPx: z.number().int().min(1).max(40000),
  heightPx: z.number().int().min(1).max(40000),
  dpi: z.number().int().min(10).max(1200),
  /** Thông số mặt in lúc đặt (xưởng dựng lại file đúng kích thước thật, đúng size) */
  widthMm: z.number().min(1).max(5000).optional(),
  heightMm: z.number().min(1).max(5000).optional(),
  targetDpi: z.number().int().min(10).max(1200).optional(),
  bleedMm: z.number().min(0).max(100).optional(),
  safeMm: z.number().min(0).max(200).optional(),
  sizeSpecs: sizeSpecsSchema.optional(),
});
export type DesignFile = z.infer<typeof designFileSchema>;

export const orderDesignSchema = z
  .object({
    json: designJsonSchema,
    files: z.array(designFileSchema).min(1).max(16),
  })
  .refine((d) => d.files.every((f) => d.json.areas[f.area]), { message: "File thiết kế không khớp mặt in" })
  .refine((d) => JSON.stringify(d.json).length <= 60_000, { message: "Thiết kế quá lớn" });
export type OrderDesign = z.infer<typeof orderDesignSchema>;

/** Các mặt có nội dung (có lớp hoặc có màu nền) */
export function usedAreas(json: Pick<DesignJson, "areas">): string[] {
  return Object.entries(json.areas)
    .filter(([, a]) => a.layers.length > 0 || !!a.bg)
    .map(([k]) => k);
}

export function emptyDesign(productId: string, areaKeys: string[]): DesignJson {
  return { v: DESIGN_VERSION, productId, areas: Object.fromEntries(areaKeys.map((k) => [k, { bg: null, layers: [] }])) };
}

/** DPI thực tế của ảnh trong lớp: pixel gốc (phần đã cắt) / kích thước in (inch) */
export function effectiveDpi(layer: Pick<ImageLayer, "natW" | "natH" | "w" | "h"> & { crop?: ImageCrop }): number {
  const cw = layer.natW * (layer.crop?.w ?? 1);
  const ch = layer.natH * (layer.crop?.h ?? 1);
  const dx = cw / (layer.w / 25.4);
  const dy = ch / (layer.h / 25.4);
  return Math.round(Math.min(dx, dy));
}

/** Kích thước file in (px) cho vùng in, tự hạ DPI nếu vượt giới hạn pixel (và cạnh tối đa 30.000 px) */
export function printPixelSize(area: { widthMm: number; heightMm: number; dpi: number }, maxPixels: number = DESIGN_LIMITS.maxPrintPixels) {
  let dpi = area.dpi;
  const px = (d: number) => ({ w: Math.max(1, Math.round((area.widthMm / 25.4) * d)), h: Math.max(1, Math.round((area.heightMm / 25.4) * d)) });
  let s = px(dpi);
  const side = 30000;
  if (s.w * s.h > maxPixels || Math.max(s.w, s.h) > side) {
    dpi = Math.max(10, Math.floor(dpi * Math.min(Math.sqrt(maxPixels / (s.w * s.h)), side / Math.max(s.w, s.h))));
    s = px(dpi);
  }
  return { ...s, dpi };
}

/** Phụ phí mặt in: cộng extraPrice của các mặt có nội dung */
export function areaExtraPrice(areas: { key: string; extraPrice: number }[], used: string[]): number {
  const set = new Set(used);
  return areas.filter((a) => set.has(a.key)).reduce((s, a) => s + Math.max(0, a.extraPrice), 0);
}

export type DpiLevel = "good" | "ok" | "low";
/** Mức chất lượng in của ảnh so với DPI khuyến nghị của mặt in */
export function dpiLevel(dpi: number, target: number): DpiLevel {
  if (dpi >= target * 0.9) return "good";
  if (dpi >= Math.max(DESIGN_LIMITS.hardMinDpi, target * 0.5)) return "ok";
  return "low";
}
export const DPI_LEVEL_LABEL: Record<DpiLevel, string> = { good: "nét", ok: "tạm được", low: "dễ vỡ" };

/* ---------- Đồng phục: ô tên / số ---------- */

/** Các ô tên/số có trong thiết kế (toàn bộ mặt hoặc 1 mặt) */
export function designFields(json: Pick<DesignJson, "areas">, areaKey?: string): DesignField[] {
  const set = new Set<DesignField>();
  for (const [k, a] of Object.entries(json.areas)) {
    if (areaKey && k !== areaKey) continue;
    for (const l of a.layers) if (l.type === "text" && l.field) set.add(l.field);
  }
  return [...set];
}

/**
 * Thay ô tên/số bằng dữ liệu 1 thành viên. Ô không có dữ liệu -> bỏ lớp đó (không in chữ mẫu).
 * Không truyền person -> bỏ hết ô (file nền chung cho cả đội).
 */
export function personalizeArea(ad: AreaDesign, person?: { name?: string; number?: string } | null): AreaDesign {
  if (!ad.layers.some((l) => l.type === "text" && l.field)) return ad;
  const layers: DesignLayer[] = [];
  for (const l of ad.layers) {
    if (l.type !== "text" || !l.field) {
      layers.push(l);
      continue;
    }
    const v = (person?.[l.field] ?? "").trim();
    if (v) layers.push({ ...l, text: v.slice(0, DESIGN_LIMITS.textLength) });
  }
  return { ...ad, layers };
}

/* ---------- Kiểm tra thiết kế trước khi in ---------- */

export type DesignIssue = { area: string; areaName: string; level: "error" | "warn"; message: string };

/** Khung bao (mm) của lớp đã xoay */
export function layerBounds(l: Pick<DesignLayer, "x" | "y" | "w" | "h" | "rotation">) {
  const r = ((l.rotation ?? 0) * Math.PI) / 180;
  const c = Math.abs(Math.cos(r));
  const s = Math.abs(Math.sin(r));
  const bw = l.w * c + l.h * s;
  const bh = l.w * s + l.h * c;
  return { left: l.x - bw / 2, top: l.y - bh / 2, right: l.x + bw / 2, bottom: l.y + bh / 2 };
}

/**
 * Báo cáo chất lượng: ảnh thiếu DPI, lớp nằm ngoài vùng in, lớp bị cắt,
 * nội dung vượt vùng an toàn, ảnh chạm đường xén nhưng chưa phủ tới viền tràn.
 * Dùng chung: editor (trước khi hoàn tất), API (khi đặt đơn), CMS (trước khi in).
 */
export function designReport(
  json: Pick<DesignJson, "areas">,
  areas: ({ key: string; name: string } & Pick<AreaSpec, "widthMm" | "heightMm" | "dpi" | "bleedMm" | "safeMm">)[],
): DesignIssue[] {
  const out: DesignIssue[] = [];
  for (const a of areas) {
    const ad = json.areas[a.key];
    if (!ad) continue;
    const g = areaGuides(a);
    const push = (level: DesignIssue["level"], message: string) => out.push({ area: a.key, areaName: a.name, level, message });
    let partialBleed = false;
    for (const l of ad.layers) {
      const label = l.type === "text" ? `chữ "${l.text.slice(0, 20)}"` : "ảnh";
      if (l.type === "image") {
        const d = effectiveDpi(l);
        const lv = dpiLevel(d, a.dpi);
        if (lv === "low") push("error", `Ảnh chỉ đạt ${d} DPI (khuyến nghị ${a.dpi}) – in dễ vỡ`);
        else if (lv === "ok") push("warn", `Ảnh đạt ${d} DPI – in được nhưng chưa nét tối đa`);
        if (l.tile) continue;
      }
      const b = layerBounds(l);
      if (b.right <= 0 || b.bottom <= 0 || b.left >= a.widthMm || b.top >= a.heightMm) {
        push("warn", `Lớp ${label} nằm ngoài vùng in – sẽ không được in`);
        continue;
      }
      if (coversArea(l, a.widthMm, a.heightMm)) continue; // ảnh nền phủ kín: chủ ý
      const cut = b.left < -1 || b.top < -1 || b.right > a.widthMm + 1 || b.bottom > a.heightMm + 1;
      if (l.type === "text" && cut) {
        push("warn", `Lớp ${label} tràn ra ngoài vùng in – phần tràn sẽ bị cắt`);
        continue;
      }
      // vùng an toàn: chỉ khi sản phẩm có viền tràn/vùng an toàn
      if (g.bleed + g.safeInset > 0) {
        const s = g.safe;
        const outSafe = b.left < s.left - 0.5 || b.top < s.top - 0.5 || b.right > s.right + 0.5 || b.bottom > s.bottom + 0.5;
        if (outSafe && l.type === "text") push("warn", `Lớp ${label} vượt vùng an toàn (đường xanh) – có thể bị xén hoặc may mất`);
        // ảnh vượt đường xén nhưng không kéo tới mép ngoài -> lộ viền trắng sau khi xén
        if (l.type === "image" && g.bleed > 0) {
          const t = g.trim;
          const edge = (over: boolean, reach: boolean) => over && !reach;
          if (
            edge(b.left < t.left + 0.5, b.left <= 0.5) ||
            edge(b.top < t.top + 0.5, b.top <= 0.5) ||
            edge(b.right > t.right - 0.5, b.right >= a.widthMm - 0.5) ||
            edge(b.bottom > t.bottom - 0.5, b.bottom >= a.heightMm - 0.5)
          )
            partialBleed = true;
        }
      }
    }
    if (partialBleed) push("warn", `Ảnh chạm đường xén nhưng chưa kéo tới mép ngoài (viền tràn ${g.bleed} mm) – sau khi xén có thể lộ viền trắng`);
    const risky = designRiskWords({ areas: { [a.key]: ad } });
    if (risky.length) push("warn", `Chữ có tên nhãn hiệu/nhân vật (${risky.join(", ")}) – cần có quyền sử dụng, đơn có thể bị từ chối in`);
  }
  return out;
}

/* ---------- Từ ngữ rủi ro (nhãn hiệu nổi tiếng) ---------- */

/**
 * Nhãn hiệu / nhân vật hay bị in lậu – chỉ CẢNH BÁO (khách có thể có giấy phép), xưởng duyệt lại.
 * Viết thường, không dấu; khớp theo từ.
 */
export const RISK_WORDS = [
  "nike", "adidas", "puma", "gucci", "louis vuitton", "chanel", "dior", "hermes", "prada", "versace", "balenciaga", "supreme", "burberry",
  "fendi", "rolex", "off-white", "bape", "yeezy", "jordan", "disney", "marvel", "pokemon", "pikachu", "hello kitty", "doraemon", "mickey",
  "minnie", "batman", "superman", "spiderman", "spider-man", "coca-cola", "coca cola", "starbucks", "manchester united", "real madrid",
  "lamborghini", "ferrari", "porsche", "playboy", "harry potter", "naruto", "one piece",
] as const;

function normText(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/** Các từ rủi ro xuất hiện trong chữ của thiết kế (bỏ qua ô tên/số của thành viên) */
export function designRiskWords(json: Pick<DesignJson, "areas">): string[] {
  const found = new Set<string>();
  for (const a of Object.values(json.areas))
    for (const l of a.layers) {
      if (l.type !== "text" || l.field) continue;
      const t = ` ${normText(l.text).replace(/[^a-z0-9-]+/g, " ")} `;
      for (const w of RISK_WORDS) if (t.includes(` ${w} `)) found.add(w);
    }
  return [...found];
}

/* ---------- Mẫu thiết kế (thư viện) ---------- */

export const designTemplateSchema = z.object({
  /** Kích thước vùng in gốc (mm) – khi áp vào mặt khác sẽ co giãn giữ tỉ lệ, căn giữa */
  srcW: size,
  srcH: size,
  bg: hex.nullable().default(null),
  layers: z.array(designLayerSchema).min(1).max(DESIGN_LIMITS.layersPerArea),
});
export type DesignTemplateData = z.infer<typeof designTemplateSchema>;

/** Áp mẫu vào vùng in: co giãn đều theo cạnh nhỏ, căn giữa; sinh id lớp mới */
export function applyTemplate(t: Pick<DesignTemplateData, "srcW" | "srcH" | "layers">, area: { widthMm: number; heightMm: number }, newId: () => string): DesignLayer[] {
  const s = Math.min(area.widthMm / t.srcW, area.heightMm / t.srcH);
  const ox = (area.widthMm - t.srcW * s) / 2;
  const oy = (area.heightMm - t.srcH * s) / 2;
  return t.layers.map((l) => {
    const base = { ...l, id: newId(), x: l.x * s + ox, y: l.y * s + oy, w: l.w * s, h: l.h * s };
    if (l.type === "text") return { ...base, type: "text", fontSize: Math.round(l.fontSize * s * 10) / 10, stroke: l.stroke ? { ...l.stroke, width: l.stroke.width * s } : undefined } as DesignLayer;
    return base as DesignLayer;
  });
}

export const DESIGN_ASSET_KINDS = ["CLIPART", "TEMPLATE"] as const;
export type DesignAssetKind = (typeof DESIGN_ASSET_KINDS)[number];
export const DESIGN_ASSET_KIND_LABEL: Record<DesignAssetKind, string> = { CLIPART: "Hình minh hoạ", TEMPLATE: "Mẫu thiết kế" };

/** Nguồn nội dung – để biết quyền sử dụng khi in bán */
export const DESIGN_ASSET_SOURCES = ["SELF", "PURCHASED", "AI", "PARTNER", "OPEN"] as const;
export type DesignAssetSource = (typeof DESIGN_ASSET_SOURCES)[number];
export const DESIGN_ASSET_SOURCE_LABEL: Record<DesignAssetSource, string> = {
  SELF: "Tự thiết kế",
  PURCHASED: "Mua bản quyền",
  AI: "Tạo bằng AI",
  PARTNER: "Đối tác / cộng tác viên",
  OPEN: "Nguồn mở (MIT, CC0…)",
};

/** Trạng thái duyệt: chỉ APPROVED (và đang bật) mới hiện cho khách */
export const DESIGN_ASSET_STATUSES = ["DRAFT", "APPROVED", "REJECTED"] as const;
export type DesignAssetStatus = (typeof DESIGN_ASSET_STATUSES)[number];
export const DESIGN_ASSET_STATUS_LABEL: Record<DesignAssetStatus, string> = { DRAFT: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối" };

/** Dáng ảnh (lọc thư viện như Printdoors: vuông / ngang / dọc / siêu ngang / siêu dọc) */
export const ASSET_SHAPES = ["square", "landscape", "portrait", "wide", "tall"] as const;
export type AssetShape = (typeof ASSET_SHAPES)[number];
export const ASSET_SHAPE_LABEL: Record<AssetShape, string> = { square: "Vuông", landscape: "Ngang", portrait: "Dọc", wide: "Siêu ngang", tall: "Siêu dọc" };
export function assetShape(w: number, h: number): AssetShape {
  const r = w / Math.max(1, h);
  if (r >= 2) return "wide";
  if (r <= 0.5) return "tall";
  if (r > 1.2) return "landscape";
  if (r < 1 / 1.2) return "portrait";
  return "square";
}

export const designAssetUpsertSchema = z
  .object({
    kind: z.enum(DESIGN_ASSET_KINDS),
    name: z.string().trim().min(1, "Nhập tên").max(80),
    category: z.string().trim().max(40).default(""),
    tags: z.string().trim().max(200).default(""),
    imageUrl: uploadUrl.or(z.literal("")).default(""),
    natW: z.number().int().min(0).max(100000).default(0),
    natH: z.number().int().min(0).max(100000).default(0),
    data: designTemplateSchema.nullable().default(null),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(-9999).max(9999).default(0),
    source: z.enum(DESIGN_ASSET_SOURCES).default("SELF"),
    /** Số giấy phép / nơi mua / công cụ AI + prompt – bằng chứng quyền sử dụng */
    license: z.string().trim().max(300).default(""),
    status: z.enum(DESIGN_ASSET_STATUSES).default("APPROVED"),
  })
  .refine((a) => (a.kind === "CLIPART" ? !!a.imageUrl && a.natW > 0 && a.natH > 0 : !!a.data), { message: "Hình minh hoạ cần ảnh; mẫu thiết kế cần dữ liệu lớp" })
  .refine((a) => !["PURCHASED", "OPEN"].includes(a.source) || a.license.length > 0, { message: "Hình mua bản quyền / nguồn mở: ghi giấy phép và nơi lấy" });

/** Sửa nhanh / hàng loạt trong CMS */
export const designAssetPatchSchema = z.object({
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(-9999).max(9999).optional(),
  name: z.string().trim().min(1).max(80).optional(),
  category: z.string().trim().max(40).optional(),
  tags: z.string().trim().max(200).optional(),
  source: z.enum(DESIGN_ASSET_SOURCES).optional(),
  license: z.string().trim().max(300).optional(),
  status: z.enum(DESIGN_ASSET_STATUSES).optional(),
});
export type DesignAssetPatch = z.infer<typeof designAssetPatchSchema>;
export const designAssetBulkSchema = z.object({ ids: z.array(z.string().min(1).max(40)).min(1).max(500), patch: designAssetPatchSchema.optional(), remove: z.boolean().optional() });
export type DesignAssetInput = z.infer<typeof designAssetUpsertSchema>;

/** Dữ liệu hiển thị trong editor */
export type DesignAssetView = { id: string; kind: DesignAssetKind; name: string; category: string; tags?: string; imageUrl: string; natW: number; natH: number; data: DesignTemplateData | null };
