import { slugify } from "./vn";

/**
 * Thuật toán giao diện cho khối "Dòng sản phẩm" (showcase) trên trang chủ.
 * Tất cả là hàm thuần – dùng chung cho web (render) và API (gom màu thật).
 */

export type ShowcaseColor = { name: string; hex: string; count?: number };

/**
 * Chia n ô vào lưới 6 cột (desktop): hàng 3 ô là mặc định, phần dư dồn thành
 * các hàng 2 ô rộng ở TRÊN (ô rộng = ảnh ngang nổi bật trước, hàng dưới gọn).
 * n=5 → [3,3,2,2,2] (2 + 3) · n=4 → [3,3,3,3] · n=7 → 2+2+3 · n=1 → [6].
 * Trả về col-span (trên 6) của từng ô.
 */
export function showcaseSpans(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [6];
  const r = n % 3;
  const wide = r === 0 ? 0 : r === 2 ? 2 : Math.min(n, 4);
  return Array.from({ length: n }, (_, i) => (i < wide ? 3 : 2));
}

/** Tablet (2 cột): số ô lẻ → ô đầu trải rộng cả hàng để không bị "lủng" ô cuối */
export function showcaseMdSpans(n: number): number[] {
  return Array.from({ length: n }, (_, i) => (n % 2 === 1 && i === 0 ? 2 : 1));
}

/** Tỉ lệ khung ảnh theo độ rộng ô: ô rộng → ảnh ngang, ô hẹp → ảnh vuông */
export function showcaseAspect(span: number): string {
  return span >= 6 ? "21 / 8" : span >= 3 ? "16 / 10" : "1 / 1";
}

function hexRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Độ chói tương đối WCAG (0 = đen, 1 = trắng) */
export function luminance(hex: string): number {
  const rgb = hexRgb(hex);
  if (!rgb) return 1;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Màu chữ đọc rõ nhất trên nền (so tỉ lệ tương phản với chữ đen #1d1d1f và chữ trắng) */
export function readableInk(bg: string, dark = "#1d1d1f", light = "#ffffff"): string {
  const L = luminance(bg);
  const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  return contrast(L, luminance(dark)) >= contrast(L, luminance(light)) ? dark : light;
}

/** Màu rất sáng (trắng, kem…) cần viền để không chìm vào nền trắng */
export const isVeryLight = (hex: string) => luminance(hex) > 0.8;

/** Khoá so trùng tên màu: bỏ dấu, chữ thường ("Xanh Navy" = "xanh navy" = "Xanh navy ") */
export const colorKey = (name: string) => slugify(name);

/**
 * Gom màu thật từ phân loại sản phẩm: mỗi (sản phẩm, màu) tính 1 lần,
 * xếp theo số sản phẩm có màu đó (phổ biến trước), hex lấy giá trị xuất hiện nhiều nhất.
 */
export function rankColors(rows: { productId: string; color: string; colorHex: string }[], max = 10): ShowcaseColor[] {
  const agg = new Map<string, { name: string; products: Set<string>; hex: Map<string, number>; first: number }>();
  rows.forEach((r, i) => {
    const name = r.color.trim();
    const hex = r.colorHex.trim().toLowerCase();
    if (!name || !/^#[0-9a-f]{6}$/.test(hex)) return;
    const k = colorKey(name);
    const a = agg.get(k) ?? { name, products: new Set<string>(), hex: new Map<string, number>(), first: i };
    a.products.add(r.productId);
    a.hex.set(hex, (a.hex.get(hex) ?? 0) + 1);
    agg.set(k, a);
  });
  return [...agg.values()]
    .sort((a, b) => b.products.size - a.products.size || a.first - b.first)
    .slice(0, max)
    .map((a) => ({ name: a.name, hex: [...a.hex.entries()].sort((x, y) => y[1] - x[1])[0]![0], count: a.products.size }));
}

/** Dải màu hiển thị: màu thật (đủ ≥ 2) ưu tiên, không thì màu khai báo trong CMS */
export function pickShowcaseColors(real: ShowcaseColor[] | undefined, configured: ShowcaseColor[], auto: boolean): ShowcaseColor[] {
  return auto && real && real.length >= 2 ? real : configured;
}
