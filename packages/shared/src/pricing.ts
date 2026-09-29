export type PriceTier = { minQty: number; price: number };

/**
 * Giá theo bậc số lượng (giá sỉ): lấy bậc có minQty lớn nhất <= qty.
 * Không có bậc phù hợp -> basePrice.
 */
export function unitPriceForQty(basePrice: number, tiers: PriceTier[] | null | undefined, qty: number): number {
  if (!tiers || tiers.length === 0) return basePrice;
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
  const tier = sorted.find((t) => qty >= t.minQty);
  return tier ? Math.min(tier.price, basePrice) : basePrice;
}

export function parseTiers(value: unknown): PriceTier[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t): t is PriceTier => typeof t?.minQty === "number" && typeof t?.price === "number")
    .sort((a, b) => a.minQty - b.minQty);
}

export function shippingFeeFor(subtotal: number, cfg: { flatFee: number; freeThreshold: number }): number {
  if (subtotal <= 0) return 0;
  return subtotal >= cfg.freeThreshold ? 0 : cfg.flatFee;
}

/** Giá để sắp xếp/lọc: có giá bán thì dùng giá bán, sản phẩm báo giá dùng giá tham khảo "Từ …". null = chưa có giá. */
export function sortPriceOf(basePrice: number, priceFrom: number | null | undefined): number | null {
  if (basePrice > 0) return basePrice;
  return priceFrom && priceFrom > 0 ? priceFrom : null;
}

/* ---------- Khuyến mãi có thời hạn + giá dòng hàng ---------- */

export type PriceSource = {
  basePrice: number;
  salePrice?: number | null;
  saleEndsAt?: string | Date | null;
  priceTiers?: PriceTier[] | null;
};

/** KM còn hiệu lực: có giá KM thấp hơn giá bán và chưa hết hạn */
export function saleActive(p: PriceSource, now: Date = new Date()): boolean {
  if (!p.salePrice || p.salePrice <= 0 || p.salePrice >= p.basePrice) return false;
  return !p.saleEndsAt || new Date(p.saleEndsAt).getTime() > now.getTime();
}

/** Giá 1 sản phẩm trước giá sỉ: giá KM (nếu còn hạn) hoặc giá bán */
export function effectiveBasePrice(p: PriceSource, now: Date = new Date()): number {
  return saleActive(p, now) ? p.salePrice! : p.basePrice;
}

/**
 * Đơn giá cuối cùng của 1 dòng hàng (server và client dùng chung):
 * min(giá KM, giá sỉ theo tổng SL) + phụ phí biến thể + phụ phí mặt in, rồi trừ chiết khấu seller (%), làm tròn 100đ.
 */
export function linePrice(opts: {
  product: PriceSource;
  totalQty: number;
  variantDelta?: number;
  areaExtras?: number;
  discountPercent?: number;
  now?: Date;
}): number {
  const { product, totalQty } = opts;
  const base = effectiveBasePrice(product, opts.now);
  const tier = unitPriceForQty(product.basePrice, product.priceTiers ?? [], Math.max(1, totalQty));
  let unit = Math.min(base, tier) + (opts.variantDelta ?? 0) + (opts.areaExtras ?? 0);
  const d = Math.min(90, Math.max(0, opts.discountPercent ?? 0));
  if (d > 0) unit = Math.round((unit * (100 - d)) / 100 / 100) * 100;
  return Math.max(0, unit);
}

/** Giá gạch hiển thị: KM còn hạn -> giá bán gốc; ngược lại compareAtPrice nếu cao hơn */
export function displayCompareAt(p: PriceSource & { compareAtPrice?: number | null }, now: Date = new Date()): number | null {
  if (saleActive(p, now)) return Math.max(p.basePrice, p.compareAtPrice ?? 0);
  return p.compareAtPrice && p.compareAtPrice > p.basePrice ? p.compareAtPrice : null;
}
