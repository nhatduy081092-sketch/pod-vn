import { PROVINCES, type Province } from "./vn";

/** Miền theo 34 tỉnh/thành (sau sắp xếp 01/07/2025) – dùng tính vùng giao hàng */
export type Region = "BAC" | "TRUNG" | "NAM";
export const PROVINCE_REGION: Record<Province, Region> = {
  "Hà Nội": "BAC",
  "Hải Phòng": "BAC",
  "Bắc Ninh": "BAC",
  "Cao Bằng": "BAC",
  "Điện Biên": "BAC",
  "Hưng Yên": "BAC",
  "Lai Châu": "BAC",
  "Lạng Sơn": "BAC",
  "Lào Cai": "BAC",
  "Ninh Bình": "BAC",
  "Phú Thọ": "BAC",
  "Quảng Ninh": "BAC",
  "Sơn La": "BAC",
  "Thái Nguyên": "BAC",
  "Tuyên Quang": "BAC",
  "Thanh Hóa": "TRUNG",
  "Nghệ An": "TRUNG",
  "Hà Tĩnh": "TRUNG",
  "Quảng Trị": "TRUNG",
  Huế: "TRUNG",
  "Đà Nẵng": "TRUNG",
  "Quảng Ngãi": "TRUNG",
  "Gia Lai": "TRUNG",
  "Đắk Lắk": "TRUNG",
  "Khánh Hòa": "TRUNG",
  "Lâm Đồng": "TRUNG",
  "TP. Hồ Chí Minh": "NAM",
  "Đồng Nai": "NAM",
  "Tây Ninh": "NAM",
  "Cần Thơ": "NAM",
  "Vĩnh Long": "NAM",
  "Đồng Tháp": "NAM",
  "An Giang": "NAM",
  "Cà Mau": "NAM",
};

export type ShippingZone = "NOI_TINH" | "NOI_VUNG" | "LIEN_VUNG";
export const ZONE_LABEL: Record<ShippingZone, string> = {
  NOI_TINH: "Nội tỉnh/thành",
  NOI_VUNG: "Cùng miền",
  LIEN_VUNG: "Khác miền",
};

export const SHIPPING_METHODS = ["STANDARD", "EXPRESS"] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];
export const SHIPPING_METHOD_LABEL: Record<ShippingMethod, string> = { STANDARD: "Giao tiêu chuẩn", EXPRESS: "Giao nhanh" };

export type ZoneRate = { first: number; step: number; days: string };

/** Cấu hình vận chuyển (lưu trong landing settings → shipping) */
export type ShippingConfig = {
  flatFee: number;
  freeThreshold: number;
  productionDays: string;
  /** flat = đồng giá; weight = theo vùng × cân nặng */
  mode: "flat" | "weight";
  /** Tỉnh/thành nơi xưởng gửi hàng */
  origin: Province;
  /** Giá cho firstGram đầu tiên, mỗi stepGram tiếp theo cộng step */
  firstGram: number;
  stepGram: number;
  rates: Record<ShippingZone, ZoneRate>;
  express: { enabled: boolean; surcharge: number; days: string };
};

export function zoneOf(origin: string, dest: string): ShippingZone {
  if (origin === dest) return "NOI_TINH";
  const a = PROVINCE_REGION[origin as Province];
  const b = PROVINCE_REGION[dest as Province];
  return a && b && a === b ? "NOI_VUNG" : "LIEN_VUNG";
}

export type ShippingOption = {
  method: ShippingMethod;
  label: string;
  fee: number;
  /** Phí trước khi áp miễn phí */
  baseFee: number;
  days: string;
  free: boolean;
  zone?: ShippingZone;
};

/** Phí theo cân nặng: first cho firstGram đầu, mỗi stepGram (làm tròn lên) cộng step */
export function weightFee(rate: ZoneRate, weightGram: number, firstGram: number, stepGram: number): number {
  const w = Math.max(1, weightGram);
  if (w <= firstGram) return rate.first;
  return rate.first + Math.ceil((w - firstGram) / Math.max(1, stepGram)) * rate.step;
}

/**
 * Các lựa chọn giao hàng cho 1 đơn. Server gọi lại hàm này khi tạo đơn – không tin phí client gửi lên.
 * Miễn phí giao tiêu chuẩn khi tạm tính >= freeThreshold (freeThreshold = 0 là tắt).
 */
export function shippingOptions(cfg: ShippingConfig, input: { province: string; weightGram: number; subtotal: number }): ShippingOption[] {
  const free = cfg.freeThreshold > 0 && input.subtotal >= cfg.freeThreshold;
  let std: ShippingOption;
  if (cfg.mode === "weight") {
    const zone = zoneOf(cfg.origin, input.province);
    const rate = cfg.rates[zone];
    const fee = weightFee(rate, input.weightGram, cfg.firstGram, cfg.stepGram);
    std = { method: "STANDARD", label: "Giao tiêu chuẩn", baseFee: fee, fee: free ? 0 : fee, days: rate.days, free, zone };
  } else {
    std = { method: "STANDARD", label: "Giao tiêu chuẩn", baseFee: cfg.flatFee, fee: free ? 0 : cfg.flatFee, days: "", free };
  }
  if (input.subtotal <= 0) std = { ...std, fee: 0 };
  const opts = [std];
  if (cfg.express.enabled) {
    const fee = std.baseFee + cfg.express.surcharge;
    opts.push({ method: "EXPRESS", label: "Giao nhanh", baseFee: fee, fee, days: cfg.express.days, free: false, zone: std.zone });
  }
  return opts;
}

export function pickShipping(cfg: ShippingConfig, method: string | undefined, input: { province: string; weightGram: number; subtotal: number }): ShippingOption {
  const opts = shippingOptions(cfg, input);
  return opts.find((o) => o.method === method) ?? opts[0]!;
}

export const DEFAULT_SHIPPING: ShippingConfig = {
  flatFee: 30000,
  freeThreshold: 500000,
  productionDays: "2–4 ngày",
  mode: "flat",
  origin: "TP. Hồ Chí Minh",
  firstGram: 500,
  stepGram: 500,
  // Bảng giá mẫu – chỉnh theo hợp đồng với đơn vị vận chuyển trong CMS
  rates: {
    NOI_TINH: { first: 22000, step: 5000, days: "1–2 ngày" },
    NOI_VUNG: { first: 30000, step: 5000, days: "2–3 ngày" },
    LIEN_VUNG: { first: 35000, step: 8000, days: "3–5 ngày" },
  },
  express: { enabled: false, surcharge: 15000, days: "1–2 ngày" },
};

export function mergeShipping(v: Partial<ShippingConfig> | undefined): ShippingConfig {
  const d = DEFAULT_SHIPPING;
  const origin = (PROVINCES as readonly string[]).includes(v?.origin ?? "") ? (v!.origin as Province) : d.origin;
  return {
    ...d,
    ...v,
    origin,
    mode: v?.mode === "weight" ? "weight" : "flat",
    rates: {
      NOI_TINH: { ...d.rates.NOI_TINH, ...v?.rates?.NOI_TINH },
      NOI_VUNG: { ...d.rates.NOI_VUNG, ...v?.rates?.NOI_VUNG },
      LIEN_VUNG: { ...d.rates.LIEN_VUNG, ...v?.rates?.LIEN_VUNG },
    },
    express: { ...d.express, ...v?.express },
  };
}
