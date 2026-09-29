export const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");
export const PUBLIC_API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Ảnh lưu dạng "/uploads/x.png" hoặc "/mock/x.svg" -> ghép domain API */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  // "/mock/..", "/uploads/.." được next.config rewrites chuyển tiếp sang API
  return path.startsWith("/") ? path : `/${path}`;
}

/** URL tuyệt đối (cho JSON-LD / Open Graph) */
export function absoluteAssetUrl(path: string | null | undefined): string {
  const u = assetUrl(path);
  return u.startsWith("/") ? `${SITE_URL}${u}` : u;
}

/** Nhãn giá ngắn: giá bán › "Từ …" (giá tham khảo) › "Báo giá" */
export function shortPriceLabel(p: { basePrice: number; priceFrom?: number | null }, fmt: (n: number) => string): string {
  if (p.basePrice > 0) return fmt(p.basePrice);
  if (p.priceFrom && p.priceFrom > 0) return `Từ ${fmt(p.priceFrom)}`;
  return "Báo giá";
}

/** Gốc API công khai (next/image tải ảnh phía server để resize) */
const IMG_API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");
/** Nếu dùng Cloudflare R2: domain public của bucket (ảnh /uploads/* nằm ở đó) */
const UPLOADS_BASE = (process.env.NEXT_PUBLIC_UPLOADS_BASE || "").replace(/\/$/, "");

/**
 * Nguồn ảnh cho next/image: trả URL tuyệt đối để trình tối ưu ảnh của Next tải và resize.
 * - /uploads/* -> R2 (nếu có) hoặc API
 * - /mock/*    -> API
 * - SVG / blob / data -> không tối ưu (unoptimized)
 */
export function optimizedImage(path: string | null | undefined): { src: string; unoptimized: boolean } {
  if (!path) return { src: "", unoptimized: true };
  if (path.startsWith("blob:") || path.startsWith("data:") || /\.svg(\?|$)/i.test(path)) return { src: assetUrl(path), unoptimized: true };
  if (path.startsWith("/uploads/")) return { src: UPLOADS_BASE ? `${UPLOADS_BASE}${path}` : `${IMG_API}${path}`, unoptimized: false };
  if (path.startsWith("/mock/")) return { src: `${IMG_API}${path}`, unoptimized: false };
  if (/^https?:\/\//.test(path)) return { src: path, unoptimized: false };
  return { src: assetUrl(path), unoptimized: true };
}

/**
 * Ảnh dùng trong <canvas> của editor phải cùng origin (không "taint" canvas):
 * ảnh ngoài (oemgroup.vn, R2) đi qua /_next/image của chính web.
 */
export function canvasSafeImage(path: string | null | undefined, width = 1200): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return `/_next/image?url=${encodeURIComponent(path)}&w=${width}&q=85`;
  return assetUrl(path);
}
