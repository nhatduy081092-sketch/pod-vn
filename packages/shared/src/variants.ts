import { z } from "zod";
import { removeVietnameseTones } from "./vn";
import { sizeSpecsSchema } from "./design";

/* ---------- Biến thể (màu × size) ---------- */

export const variantInputSchema = z.object({
  id: z.string().max(40).optional(),
  color: z.string().trim().max(40).default(""),
  colorHex: z
    .string()
    .trim()
    .regex(/^(#[0-9a-fA-F]{6})?$/, "Mã màu dạng #RRGGBB")
    .default(""),
  size: z.string().trim().max(20).default(""),
  sku: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9._-]*$/, "SKU chỉ gồm chữ không dấu, số, - _ .")
    .default(""),
  weightGram: z.number().int().min(1).max(100000).nullable().default(null),
  priceDelta: z.number().int().min(-10_000_000).max(10_000_000).default(0),
  isActive: z.boolean().default(true),
});
export type VariantInput = z.infer<typeof variantInputSchema>;

export const variantsSaveSchema = z
  .object({ variants: z.array(variantInputSchema).min(1, "Cần ít nhất 1 biến thể").max(300) })
  .refine((v) => new Set(v.variants.map((x) => `${x.color}|${x.size}`)).size === v.variants.length, {
    message: "Trùng biến thể (cùng màu + size)",
  })
  .refine((v) => {
    const skus = v.variants.map((x) => x.sku).filter(Boolean);
    return new Set(skus.map((s) => s.toUpperCase())).size === skus.length;
  }, { message: "Trùng SKU" });

export type VariantLike = { id: string; color: string; colorHex: string; size: string; sku: string; priceDelta: number; weightGram: number | null; isActive: boolean };

/** Mã ngắn từ chữ tiếng Việt: "Xanh navy" -> "XN", "Hoodie in toàn thân" -> "HITT" */
export function shortCode(text: string, max = 4): string {
  const words = removeVietnameseTones(text).toUpperCase().replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  if (words.length === 1) return words[0]!.slice(0, max);
  return words.map((w) => (/^\d+$/.test(w) ? w : w[0])).join("").slice(0, max);
}

/** SKU dễ đọc: <SP>-<MÀU>-<SIZE>, phần SP do server gắn thêm hậu tố ngẫu nhiên nếu trùng */
export function suggestSku(productName: string, color: string, size: string): string {
  const parts = [shortCode(productName, 5) || "SP", shortCode(color, 3), removeVietnameseTones(size).toUpperCase().replace(/[^A-Z0-9]/g, "")];
  return parts.filter(Boolean).join("-").slice(0, 36);
}

/** Tạo ma trận màu × size (giữ lại biến thể cũ trùng khớp để không mất SKU/cân nặng) */
export function buildVariantMatrix(
  productName: string,
  colors: { name: string; hex: string }[],
  sizes: string[],
  existing: VariantInput[] = [],
): VariantInput[] {
  const cs = colors.length ? colors : [{ name: "", hex: "" }];
  const ss = sizes.length ? sizes : [""];
  const out: VariantInput[] = [];
  for (const c of cs)
    for (const s of ss) {
      const old = existing.find((v) => v.color === c.name && v.size === s);
      out.push(
        old
          ? { ...old, colorHex: c.hex || old.colorHex }
          : { color: c.name, colorHex: c.hex, size: s, sku: suggestSku(productName, c.name, s), weightGram: null, priceDelta: 0, isActive: true },
      );
    }
  return out;
}

export function variantLabel(v: { color: string; size: string }): string {
  return [v.color, v.size].filter(Boolean).join(" / ") || "Mặc định";
}

/** Danh sách màu (theo thứ tự) và size còn bán cho từng màu */
export function variantOptions<T extends { color: string; colorHex: string; size: string; isActive: boolean }>(variants: T[]) {
  const active = variants.filter((v) => v.isActive);
  const colors: { name: string; hex: string }[] = [];
  for (const v of active) if (!colors.some((c) => c.name === v.color)) colors.push({ name: v.color, hex: v.colorHex });
  const sizesFor = (color: string) => active.filter((v) => v.color === color).map((v) => v.size);
  return { colors, sizesFor, find: (color: string, size: string) => active.find((v) => v.color === color && v.size === size) };
}

/* ---------- Vùng in ---------- */

const imgPath = z.string().trim().max(500).default("");
const ratio = z.number().finite().min(0).max(1);

export const printAreaInputSchema = z
  .object({
    id: z.string().max(40).optional(),
    key: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]{1,30}$/, "Mã mặt in: chữ thường không dấu, số, gạch ngang"),
    name: z.string().trim().min(1, "Nhập tên mặt in").max(40),
    widthMm: z.number().int().min(5).max(5000),
    heightMm: z.number().int().min(5).max(5000),
    dpi: z.number().int().min(50).max(600).default(150),
    /** Viền tràn mỗi cạnh (mm) – đã nằm trong widthMm/heightMm, bị xén sau khi in */
    bleedMm: z.number().int().min(0).max(100).default(0),
    /** Vùng an toàn tính từ đường xén vào trong (mm) */
    safeMm: z.number().int().min(0).max(200).default(0),
    /** Kích thước riêng theo size (trống = mọi size dùng kích thước trên) */
    sizeSpecs: sizeSpecsSchema.default({}),
    /** Gợi ý thiết kế riêng cho mặt này (hiện trong công cụ thiết kế) */
    tips: z.string().trim().max(600).default(""),
    mockupImage: imgPath,
    maskImage: imgPath,
    overlayImage: imgPath,
    zoneX: ratio,
    zoneY: ratio,
    zoneW: ratio.min(0.02),
    zoneH: ratio.min(0.02),
    extraPrice: z.number().int().min(0).max(10_000_000).default(0),
  })
  .refine((a) => a.zoneX + a.zoneW <= 1.0001 && a.zoneY + a.zoneH <= 1.0001, { message: "Khung vùng in vượt ra ngoài ảnh" })
  .refine((a) => (a.bleedMm + a.safeMm) * 2 < Math.min(a.widthMm, a.heightMm), { message: "Viền tràn + vùng an toàn quá lớn so với vùng in" });
export type PrintAreaInput = z.infer<typeof printAreaInputSchema>;

export const printAreasSaveSchema = z
  .object({ areas: z.array(printAreaInputSchema).min(1, "Cần ít nhất 1 mặt in").max(8) })
  .refine((v) => new Set(v.areas.map((a) => a.key)).size === v.areas.length, { message: "Trùng mã mặt in" });

/** Mẫu mặt in hay dùng cho may mặc – admin bấm để thêm nhanh rồi chỉnh số đo */
export const PRINT_AREA_PRESETS: Omit<PrintAreaInput, "mockupImage" | "maskImage" | "overlayImage" | "bleedMm" | "safeMm" | "sizeSpecs" | "tips">[] = [
  { key: "front", name: "Mặt trước", widthMm: 300, heightMm: 400, dpi: 150, zoneX: 0.3, zoneY: 0.24, zoneW: 0.4, zoneH: 0.5, extraPrice: 0 },
  { key: "back", name: "Mặt sau", widthMm: 300, heightMm: 400, dpi: 150, zoneX: 0.3, zoneY: 0.2, zoneW: 0.4, zoneH: 0.55, extraPrice: 0 },
  { key: "chest-left", name: "Ngực trái (logo)", widthMm: 90, heightMm: 90, dpi: 300, zoneX: 0.56, zoneY: 0.28, zoneW: 0.13, zoneH: 0.13, extraPrice: 0 },
  { key: "sleeve-left", name: "Tay trái", widthMm: 80, heightMm: 80, dpi: 300, zoneX: 0.08, zoneY: 0.28, zoneW: 0.14, zoneH: 0.14, extraPrice: 0 },
  { key: "sleeve-right", name: "Tay phải", widthMm: 80, heightMm: 80, dpi: 300, zoneX: 0.78, zoneY: 0.28, zoneW: 0.14, zoneH: 0.14, extraPrice: 0 },
  { key: "logo", name: "Vị trí in logo", widthMm: 100, heightMm: 100, dpi: 300, zoneX: 0.35, zoneY: 0.3, zoneW: 0.3, zoneH: 0.3, extraPrice: 0 },
];
