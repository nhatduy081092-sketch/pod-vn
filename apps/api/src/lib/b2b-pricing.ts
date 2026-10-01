import { prisma, type Prisma } from "@pod/db";
import { b2bPriceFor, type B2BPricing } from "@pod/shared";
import { getLanding } from "./settings";

/** Sản phẩm nhập từ nguồn (nhà cung cấp) – mã ngoài dạng "oem:<id>" */
export const SOURCE_PRODUCT: Prisma.ProductWhereInput = { externalId: { startsWith: "oem:" } };

export type PricingReport = {
  dryRun: boolean;
  matched: number;
  changed: number;
  skippedManual: number;
  noSource: number;
  samples: { name: string; source: number; before: number; after: number; from: number | null }[];
};

/**
 * Áp cấu hình giá B2B lên sản phẩm nguồn: giá bán, giá "Từ", bậc giá theo số lượng, số lượng tối thiểu.
 * Bỏ qua sản phẩm đã chỉnh giá tay (priceManual) trừ khi includeManual. dryRun = chỉ xem trước.
 */
export async function applyB2BPricing(opts: { dryRun?: boolean; includeManual?: boolean; cfg?: B2BPricing } = {}): Promise<PricingReport> {
  const cfg = opts.cfg ?? (await getLanding(true)).b2bPricing;
  const [rows, skippedManual, noSource] = await Promise.all([
    prisma.product.findMany({
      where: { ...SOURCE_PRODUCT, sourcePrice: { gt: 0 }, ...(opts.includeManual ? {} : { priceManual: false }) },
      select: { id: true, name: true, sourcePrice: true, basePrice: true, priceFrom: true, minQty: true, priceTiers: true },
      orderBy: { sortOrder: "asc" },
    }),
    opts.includeManual ? Promise.resolve(0) : prisma.product.count({ where: { ...SOURCE_PRODUCT, sourcePrice: { gt: 0 }, priceManual: true } }),
    prisma.product.count({ where: { ...SOURCE_PRODUCT, OR: [{ sourcePrice: null }, { sourcePrice: { lte: 0 } }] } }),
  ]);
  const report: PricingReport = { dryRun: !!opts.dryRun, matched: rows.length, changed: 0, skippedManual, noSource, samples: [] };
  const updates: Prisma.PrismaPromise<unknown>[] = [];
  for (const r of rows) {
    const next = b2bPriceFor(r.sourcePrice!, cfg);
    const same =
      next.basePrice === r.basePrice &&
      (next.priceFrom ?? null) === (r.priceFrom ?? null) &&
      next.minQty === r.minQty &&
      JSON.stringify(next.priceTiers) === JSON.stringify(r.priceTiers ?? []);
    if (same) continue;
    report.changed++;
    if (report.samples.length < 8) report.samples.push({ name: r.name, source: r.sourcePrice!, before: r.basePrice || r.priceFrom || 0, after: next.basePrice, from: next.priceFrom });
    if (!opts.dryRun) {
      updates.push(
        prisma.product.update({
          where: { id: r.id },
          data: { basePrice: next.basePrice, priceFrom: next.priceFrom, sortPrice: next.sortPrice, minQty: next.minQty, priceTiers: next.priceTiers, ...(opts.includeManual ? { priceManual: false } : {}) },
        }),
      );
    }
  }
  for (let i = 0; i < updates.length; i += 100) await prisma.$transaction(updates.slice(i, i + 100));
  return report;
}
