import { prisma, type Prisma } from "@pod/db";

/**
 * Thuật toán "phổ biến / bán chạy":
 *   điểm = số đơn 30 ngày × 10 + số lượng bán (tối đa 50) + lượt xem 30 ngày × 0,3 (+25 nếu admin ghim "Bán chạy")
 * Đơn báo giá & đơn huỷ không tính. Kết quả cache 10 phút trong bộ nhớ.
 */
const TTL = 10 * 60_000;
let cache: { at: number; scores: Map<string, number> } | null = null;

const vnDay = (d = new Date()) => new Date(new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10));

/** Ghi 1 lượt xem (gọi từ trang sản phẩm, đã chống trùng phía trình duyệt + giới hạn theo IP) */
export async function recordView(productId: string) {
  const day = vnDay();
  await prisma.$executeRaw`
    INSERT INTO "ProductDailyStat" ("productId", "day", "views") VALUES (${productId}, ${day}::date, 1)
    ON CONFLICT ("productId", "day") DO UPDATE SET "views" = "ProductDailyStat"."views" + 1`;
}

export async function popularityScores(): Promise<Map<string, number>> {
  if (cache && Date.now() - cache.at < TTL) return cache.scores;
  const since = new Date(Date.now() - 30 * 86400_000);
  const [orders, views, pinned] = await Promise.all([
    prisma.$queryRaw<{ productId: string; n: number; qty: number }[]>`
      SELECT oi."productId", COUNT(DISTINCT oi."orderId")::int AS n, SUM(oi."quantity")::int AS qty
      FROM "OrderItem" oi JOIN "Order" o ON o."id" = oi."orderId"
      WHERE o."createdAt" >= ${since} AND o."isQuote" = false AND o."status" <> 'CANCELLED' AND oi."productId" IS NOT NULL
      GROUP BY oi."productId"`,
    prisma.$queryRaw<{ productId: string; v: number }[]>`
      SELECT "productId", SUM("views")::int AS v FROM "ProductDailyStat" WHERE "day" >= ${vnDay(since)}::date GROUP BY "productId"`,
    prisma.product.findMany({ where: { isBestSeller: true, isActive: true }, select: { id: true } }),
  ]);
  const scores = new Map<string, number>();
  const add = (id: string, s: number) => scores.set(id, (scores.get(id) ?? 0) + s);
  for (const o of orders) add(o.productId, o.n * 10 + Math.min(o.qty, 50));
  for (const v of views) add(v.productId, v.v * 0.3);
  for (const p of pinned) add(p.id, 25);
  cache = { at: Date.now(), scores };
  return scores;
}

/** Sản phẩm phổ biến nhất (lọc thêm bằng where), bù bằng thứ tự mặc định khi chưa đủ dữ liệu */
export async function topProducts<S extends Prisma.ProductSelect>(opts: { where?: Prisma.ProductWhereInput; take: number; select: S; exclude?: string[] }) {
  const scores = await popularityScores();
  const where: Prisma.ProductWhereInput = { isActive: true, category: { isActive: true }, ...opts.where, ...(opts.exclude?.length ? { id: { notIn: opts.exclude } } : {}) };
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const hits = ranked.length
    ? await prisma.product.findMany({ where: { ...where, id: { in: ranked.slice(0, 400), ...(opts.exclude?.length ? { notIn: opts.exclude } : {}) } }, select: { ...opts.select, id: true } })
    : [];
  const order = new Map(ranked.map((id, i) => [id, i]));
  const sorted = (hits as unknown as { id: string }[]).sort((a, b) => order.get(a.id)! - order.get(b.id)!).slice(0, opts.take);
  if (sorted.length < opts.take) {
    const fill = await prisma.product.findMany({
      where: { ...where, id: { notIn: [...sorted.map((x) => x.id), ...(opts.exclude ?? [])] } },
      orderBy: [{ isBestSeller: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: opts.take - sorted.length,
      select: { ...opts.select, id: true },
    });
    sorted.push(...(fill as unknown as { id: string }[]));
  }
  return sorted as unknown as Prisma.ProductGetPayload<{ select: S }>[];
}

/** "Thường mua cùng": sản phẩm xuất hiện chung đơn với các sản phẩm đã cho (180 ngày), xếp theo số đơn chung */
export async function alsoBought(productIds: string[], limit: number): Promise<string[]> {
  if (!productIds.length) return [];
  const since = new Date(Date.now() - 180 * 86400_000);
  const rows = await prisma.$queryRaw<{ productId: string; n: number }[]>`
    SELECT b."productId", COUNT(DISTINCT b."orderId")::int AS n
    FROM "OrderItem" a
    JOIN "OrderItem" b ON b."orderId" = a."orderId" AND b."productId" IS NOT NULL AND NOT (b."productId" = ANY(${productIds}))
    JOIN "Order" o ON o."id" = a."orderId"
    WHERE a."productId" = ANY(${productIds}) AND o."createdAt" >= ${since} AND o."status" <> 'CANCELLED'
    GROUP BY b."productId" ORDER BY n DESC LIMIT ${limit}`;
  return rows.map((r) => r.productId);
}
