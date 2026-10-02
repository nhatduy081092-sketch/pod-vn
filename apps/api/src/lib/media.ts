import { prisma, type Prisma } from "@pod/db";
import { getLanding } from "./settings";

/**
 * Sản phẩm "chỉ có ảnh vẽ 2D" = ảnh đầu tiên là file .svg (phôi vẽ /shapes, hoạ tiết vẽ /mock) hoặc chưa có ảnh.
 * Khi bật Cài đặt → Hình ảnh → "Chỉ hiện sản phẩm có ảnh thật" (mặc định), các sản phẩm này bị ẩn khỏi trang chủ,
 * danh mục, tìm kiếm và gợi ý – vẫn mở được bằng link trực tiếp (mẫu có sẵn / Studio cần dùng).
 */
const TTL = 2 * 60_000;
let cache: { at: number; ids: string[] } | null = null;

export async function vectorProductIds(): Promise<string[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.ids;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Product"
    WHERE COALESCE(array_length("images", 1), 0) = 0 OR "images"[1] ILIKE '%.svg' OR "images"[1] ILIKE '%.svg?%'`;
  cache = { at: Date.now(), ids: rows.map((r) => r.id) };
  return cache.ids;
}

export function invalidateMedia() {
  cache = null;
}

/** Điều kiện loại sản phẩm chỉ có ảnh 2D (rỗng nếu đang tắt tuỳ chọn) */
export async function realPhotoWhere(): Promise<Prisma.ProductWhereInput> {
  if (!(await getLanding()).media.hide2d) return {};
  const ids = await vectorProductIds();
  return ids.length ? { id: { notIn: ids } } : {};
}
