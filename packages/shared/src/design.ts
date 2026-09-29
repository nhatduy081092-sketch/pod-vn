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
  /** Giới hạn pixel 1 file in (iOS Safari giới hạn canvas ~16,7 triệu px) */
  maxPrintPixels: 16_000_000,
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
};

export const imageLayerSchema = z.object({
  ...baseLayer,
  type: z.literal("image"),
  src: uploadUrl,
  natW: z.number().int().min(1).max(100000),
  natH: z.number().int().min(1).max(100000),
  /** Lặp họa tiết phủ kín vùng in; w/h = kích thước 1 ô lặp */
  tile: z.boolean().optional(),
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
});

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

/** File đã xuất cho từng mặt: file in (PNG trong suốt, đúng kích thước thật) + ảnh xem trước trên sản phẩm */
export const designFileSchema = z.object({
  area: z.string().regex(/^[a-z0-9-]{1,30}$/),
  name: z.string().max(60),
  printUrl: uploadUrl,
  previewUrl: uploadUrl,
  widthPx: z.number().int().min(1).max(40000),
  heightPx: z.number().int().min(1).max(40000),
  dpi: z.number().int().min(10).max(1200),
});
export type DesignFile = z.infer<typeof designFileSchema>;

export const orderDesignSchema = z
  .object({
    json: designJsonSchema,
    files: z.array(designFileSchema).min(1).max(12),
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

/** DPI thực tế của ảnh trong lớp: pixel gốc / kích thước in (inch) */
export function effectiveDpi(layer: Pick<ImageLayer, "natW" | "natH" | "w" | "h">): number {
  const dx = layer.natW / (layer.w / 25.4);
  const dy = layer.natH / (layer.h / 25.4);
  return Math.round(Math.min(dx, dy));
}

/** Kích thước file in (px) cho vùng in, tự hạ DPI nếu vượt giới hạn pixel */
export function printPixelSize(area: { widthMm: number; heightMm: number; dpi: number }) {
  let dpi = area.dpi;
  const px = (d: number) => ({ w: Math.round((area.widthMm / 25.4) * d), h: Math.round((area.heightMm / 25.4) * d) });
  let s = px(dpi);
  if (s.w * s.h > DESIGN_LIMITS.maxPrintPixels) {
    dpi = Math.floor(dpi * Math.sqrt(DESIGN_LIMITS.maxPrintPixels / (s.w * s.h)));
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
