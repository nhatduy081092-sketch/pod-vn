import { prisma, type Prisma } from "@pod/db";
import { searchTokens, slugify, toSearchText } from "@pod/shared";

export function searchFields(name: string, subcategory: string, categoryName: string, material = "") {
  return {
    subcategory,
    subcategorySlug: subcategory ? slugify(subcategory) : "",
    searchText: toSearchText(name, subcategory, categoryName, material),
  };
}

/** Từ/cụm từ phải đứng ở đầu một từ ("so" khớp "so tay" nhưng không khớp "ho so") */
const atWordStart = (t: string): Prisma.ProductWhereInput => ({
  OR: [{ searchText: { startsWith: t } }, { searchText: { contains: ` ${t}` } }],
});

/** Khớp nguyên cụm ở đầu từ (VD từ khoá "binh giu nhiet"); cụm rỗng -> null */
export function phraseWhere(text: string): Prisma.ProductWhereInput | null {
  const tokens = searchTokens(text);
  return tokens.length ? atWordStart(tokens.join(" ")) : null;
}

/** Điều kiện tìm kiếm theo từng từ (không dấu), mọi từ đều phải có */
export function searchWhere(q?: string): Prisma.ProductWhereInput {
  const tokens = q ? searchTokens(q) : [];
  return tokens.length ? { AND: tokens.map(atWordStart) } : {};
}

/**
 * Ưu tiên khớp nguyên cụm ("so tay" -> Sổ tay), nếu quá ít kết quả mới nới ra
 * khớp từng từ – tránh kết quả nhiễu do tiếng Việt bỏ dấu trùng nhau (sổ/sơ/số -> so).
 */
export async function resolveSearch(q?: string): Promise<Prisma.ProductWhereInput> {
  const tokens = q ? searchTokens(q) : [];
  if (tokens.length < 2) return searchWhere(q);
  const phrase = atWordStart(tokens.join(" "));
  const n = await prisma.product.count({ where: { isActive: true, ...phrase } });
  // đủ nhiều kết quả khớp nguyên cụm thì dùng cụm; ít quá thì nới ra để không bỏ sót ("ao polo" -> "Áo thun cổ polo")
  return n >= 6 ? phrase : searchWhere(q);
}

/** Điền searchText cho sản phẩm cũ (chạy nền khi API khởi động) */
export async function backfillSearchText() {
  const rows = await prisma.product.findMany({
    where: { searchText: "" },
    select: { id: true, name: true, subcategory: true, material: true, category: { select: { name: true } } },
  });
  for (const r of rows) {
    await prisma.product.update({
      where: { id: r.id },
      data: { searchText: toSearchText(r.name, r.subcategory, r.category.name, r.material) },
    });
  }
  if (rows.length) console.log(`[search] đã cập nhật chỉ mục tìm kiếm cho ${rows.length} sản phẩm`);
}
