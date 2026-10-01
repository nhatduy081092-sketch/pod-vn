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

/* ---------- Giá B2B cho sản phẩm nguồn (nhập từ nhà cung cấp) ---------- */

/**
 * source: giá bán = giá niêm yết của nguồn (như cũ)
 * markup: giá bán = giá nguồn × (1 + markupPct%) – làm tròn lên
 * quote : không bán online, chỉ báo giá; có thể hiện "Từ …đ" ước tính theo markup
 */
export type B2BPricingMode = "source" | "markup" | "quote";
export type B2BPricing = {
  mode: B2BPricingMode;
  markupPct: number;
  roundTo: number;
  /** quote: hiện giá "Từ …đ" (giá nguồn × markup) */
  showFrom: boolean;
  /** Giảm theo số lượng, áp lên giá bán: [{ minQty: 100, discountPct: 5 }] */
  tiers: { minQty: number; discountPct: number }[];
  /** Số lượng tối thiểu mặc định cho sản phẩm nguồn (1 = mua lẻ được) */
  moq: number;
};

export const DEFAULT_B2B_PRICING: B2BPricing = { mode: "source", markupPct: 0, roundTo: 1000, showFrom: true, tiers: [], moq: 1 };

const roundUp = (n: number, step: number) => (step > 1 ? Math.ceil(n / step) * step : Math.round(n));
const roundDown = (n: number, step: number) => (step > 1 ? Math.floor(n / step) * step : Math.round(n));

/** Tính giá bán từ giá nguồn theo cấu hình B2B (hàm thuần – dùng chung API, CMS xem trước) */
export function b2bPriceFor(source: number, cfg: B2BPricing) {
  const step = Math.max(1, Math.round(cfg.roundTo || 1));
  const est = cfg.mode === "source" ? source : roundUp(source * (1 + Math.max(0, cfg.markupPct) / 100), step);
  const basePrice = cfg.mode === "quote" ? 0 : est;
  const priceFrom = cfg.mode === "quote" && cfg.showFrom ? est : null;
  const minQty = Math.max(1, Math.round(cfg.moq || 1));
  const priceTiers: PriceTier[] =
    basePrice > 0
      ? [...cfg.tiers]
          .filter((t) => t.minQty > minQty && t.discountPct > 0 && t.discountPct < 100)
          .sort((a, b) => a.minQty - b.minQty)
          .map((t) => ({ minQty: t.minQty, price: roundDown(basePrice * (1 - t.discountPct / 100), step) }))
      : [];
  return { basePrice, priceFrom, minQty, priceTiers, sortPrice: sortPriceOf(basePrice, priceFrom) };
}

/** Khoảng ngân sách mỗi phần quà (lọc theo giá bán / giá "Từ") */
export const B2B_BUDGETS = [
  { key: "duoi-50k", label: "Dưới 50.000đ", min: 0, max: 50_000 },
  { key: "50-100k", label: "50 – 100.000đ", min: 50_000, max: 100_000 },
  { key: "100-200k", label: "100 – 200.000đ", min: 100_000, max: 200_000 },
  { key: "200-500k", label: "200 – 500.000đ", min: 200_000, max: 500_000 },
  { key: "tren-500k", label: "Trên 500.000đ", min: 500_000, max: null },
] as const;
