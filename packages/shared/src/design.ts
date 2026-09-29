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
  flipY: z.boolean().optional(),
  /** Khoá: không kéo/xoay/co giãn trên khung (vẫn chọn được trong danh sách lớp) */
  locked: z.boolean().optional(),
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
 * Báo cáo chất lượng: ảnh thiếu DPI, lớp nằm ngoài vùng in, lớp bị cắt.
 * Dùng chung: editor (trước khi hoàn tất), API (khi đặt đơn), CMS (trước khi in).
 */
export function designReport(json: Pick<DesignJson, "areas">, areas: { key: string; name: string; widthMm: number; heightMm: number; dpi: number }[]): DesignIssue[] {
  const out: DesignIssue[] = [];
  for (const a of areas) {
    const ad = json.areas[a.key];
    if (!ad) continue;
    for (const l of ad.layers) {
      const label = l.type === "text" ? `chữ "${l.text.slice(0, 20)}"` : "ảnh";
      if (l.type === "image" && l.tile) continue;
      const b = layerBounds(l);
      if (b.right <= 0 || b.bottom <= 0 || b.left >= a.widthMm || b.top >= a.heightMm) {
        out.push({ area: a.key, areaName: a.name, level: "warn", message: `Lớp ${label} nằm ngoài vùng in – sẽ không được in` });
        continue;
      }
      const cut = b.left < -1 || b.top < -1 || b.right > a.widthMm + 1 || b.bottom > a.heightMm + 1;
      if (l.type === "image") {
        const d = effectiveDpi(l);
        const lv = dpiLevel(d, a.dpi);
        if (lv === "low") out.push({ area: a.key, areaName: a.name, level: "error", message: `Ảnh chỉ đạt ${d} DPI (khuyến nghị ${a.dpi}) – in dễ vỡ` });
        else if (lv === "ok") out.push({ area: a.key, areaName: a.name, level: "warn", message: `Ảnh đạt ${d} DPI – in được nhưng chưa nét tối đa` });
        // ảnh lớn hơn vùng in (phủ kín) là chủ ý, chỉ cảnh báo chữ bị cắt
      } else if (cut) {
        out.push({ area: a.key, areaName: a.name, level: "warn", message: `Lớp ${label} tràn ra ngoài vùng in – phần tràn sẽ bị cắt` });
      }
    }
  }
  return out;
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
  })
  .refine((a) => (a.kind === "CLIPART" ? !!a.imageUrl && a.natW > 0 && a.natH > 0 : !!a.data), { message: "Hình minh hoạ cần ảnh; mẫu thiết kế cần dữ liệu lớp" });
export type DesignAssetInput = z.infer<typeof designAssetUpsertSchema>;

/** Dữ liệu hiển thị trong editor */
export type DesignAssetView = { id: string; kind: DesignAssetKind; name: string; category: string; tags?: string; imageUrl: string; natW: number; natH: number; data: DesignTemplateData | null };
