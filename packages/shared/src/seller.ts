import { z } from "zod";
import { PROVINCES, isValidVNPhone, normalizePhone, removeVietnameseTones } from "./vn";
import { orderDesignSchema } from "./design";
import { SHIPPING_METHODS } from "./shipping";
import { parseDelimited } from "./roster";

export const SELLER_STATUSES = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const;
export type SellerStatus = (typeof SELLER_STATUSES)[number];
export const SELLER_STATUS_LABEL: Record<SellerStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đang hoạt động",
  REJECTED: "Từ chối",
  SUSPENDED: "Tạm khoá",
};

export const SELLER_CHANNELS = ["shopee", "tiktok", "lazada", "facebook", "website", "khac"] as const;
export const SELLER_CHANNEL_LABEL: Record<(typeof SELLER_CHANNELS)[number], string> = {
  shopee: "Shopee",
  tiktok: "TikTok Shop",
  lazada: "Lazada",
  facebook: "Facebook / Instagram",
  website: "Website riêng",
  khac: "Khác",
};

export const WEBHOOK_EVENTS = ["order.created", "order.updated", "order.shipped", "order.cancelled"] as const;

export const sellerApplySchema = z.object({
  companyName: z.string().trim().max(120).default(""),
  taxCode: z
    .string()
    .trim()
    .regex(/^(\d{10}(-\d{3})?)?$/, "MST gồm 10 số (hoặc 10-3 số)")
    .default(""),
  storeUrl: z.string().trim().url("Link gian hàng không hợp lệ").max(300).or(z.literal("")).default(""),
  channels: z.array(z.enum(SELLER_CHANNELS)).min(1, "Chọn ít nhất 1 kênh bán").max(6),
  brandName: z.string().trim().max(60).default(""),
});

export const sellerSettingsSchema = z.object({
  companyName: z.string().trim().max(120).default(""),
  taxCode: z
    .string()
    .trim()
    .regex(/^(\d{10}(-\d{3})?)?$/, "MST gồm 10 số (hoặc 10-3 số)")
    .default(""),
  storeUrl: z.string().trim().url("Link không hợp lệ").max(300).or(z.literal("")).default(""),
  brandName: z.string().trim().max(60).default(""),
  labelImage: z
    .string()
    .max(300)
    .regex(/^(\/uploads\/[\w.-]+)?$/)
    .default(""),
  webhookUrl: z
    .string()
    .trim()
    .max(300)
    .refine((u) => !u || /^https:\/\//.test(u), "Webhook phải dùng https://")
    .default(""),
});

export const adminSellerUpdateSchema = z.object({
  status: z.enum(SELLER_STATUSES),
  discountPercent: z.number().int().min(0).max(60),
  adminNote: z.string().max(1000).default(""),
});

const code = z
  .string()
  .trim()
  .min(2, "Mã mẫu tối thiểu 2 ký tự")
  .max(40)
  .regex(/^[A-Za-z0-9._-]+$/, "Mã mẫu chỉ gồm chữ không dấu, số, - _ .");

export const sellerProductUpsertSchema = z.object({
  productId: z.string().min(1).max(40),
  code,
  title: z.string().trim().min(2).max(160),
  design: orderDesignSchema,
  retailPrice: z.number().int().min(0).nullable().default(null),
  isActive: z.boolean().default(true),
});

export const recipientSchema = z.object({
  name: z.string().trim().min(2, "Nhập tên người nhận").max(80),
  phone: z
    .string()
    .trim()
    .refine(isValidVNPhone, "SĐT người nhận không hợp lệ")
    .transform(normalizePhone),
  province: z.enum(PROVINCES, { errorMap: () => ({ message: "Tỉnh/thành không hợp lệ (dùng 34 tỉnh mới)" }) }),
  ward: z.string().trim().min(2, "Nhập phường/xã").max(80),
  addressLine: z.string().trim().min(3, "Nhập địa chỉ").max(200),
});

export const sellerOrderLineSchema = z.object({
  /** Mã mẫu sản phẩm của seller */
  template: code,
  color: z.string().trim().max(40).default(""),
  size: z.string().trim().max(20).default(""),
  quantity: z.number().int().min(1).max(1000),
});

export const sellerOrderCreateSchema = z.object({
  externalId: z.string().trim().max(60).optional(),
  recipient: recipientSchema,
  items: z.array(sellerOrderLineSchema).min(1).max(50),
  shippingMethod: z.enum(SHIPPING_METHODS).default("STANDARD"),
  /** Tiền thu hộ từ khách cuối (0 = không thu hộ) */
  codAmount: z.number().int().min(0).max(100_000_000).default(0),
  whiteLabel: z.boolean().default(true),
  note: z.string().trim().max(500).default(""),
});
export type SellerOrderInput = z.infer<typeof sellerOrderCreateSchema>;

/* ---------- Nhập đơn bằng CSV ---------- */

export const SELLER_CSV_COLUMNS = [
  ["MA_DON", "Mã đơn của bạn (bắt buộc, các dòng cùng mã = 1 đơn)"],
  ["MA_MAU", "Mã mẫu sản phẩm (bắt buộc)"],
  ["MAU", "Màu (nếu mẫu có nhiều màu)"],
  ["SIZE", "Size (nếu có)"],
  ["SO_LUONG", "Số lượng (bắt buộc)"],
  ["TEN_NGUOI_NHAN", "Bắt buộc"],
  ["SDT", "Bắt buộc"],
  ["TINH", "Tỉnh/thành theo 34 tỉnh mới (bắt buộc)"],
  ["PHUONG_XA", "Bắt buộc"],
  ["DIA_CHI", "Số nhà, đường (bắt buộc)"],
  ["THU_HO", "Tiền thu hộ khách cuối, VD 250000 (không thu = 0)"],
  ["GIAO_NHANH", "1 = giao nhanh"],
  ["GHI_CHU", "Tuỳ chọn"],
] as const;

export function sellerCsvTemplate(): string {
  const head = SELLER_CSV_COLUMNS.map(([k]) => k).join(",");
  const sample = ["DH1001", "AO-MEO-01", "Trắng", "L", "2", "Nguyễn Văn A", "0901234567", "TP. Hồ Chí Minh", "Phường Bến Thành", "12 Lê Lợi", "0", "0", ""].join(",");
  return `﻿${head}\n${sample}\n`;
}

const norm = (s: string) => removeVietnameseTones(s).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");

/** Tìm tỉnh theo tên gõ tự do: "tp hcm", "Hồ Chí Minh", "ha noi" */
export function matchProvince(raw: string): (typeof PROVINCES)[number] | null {
  const n = removeVietnameseTones(raw).toLowerCase().replace(/^(tp\.?|thanh pho|tinh)\s*/, "").replace(/[^a-z0-9]/g, "");
  if (!n) return null;
  const alias: Record<string, string> = { hcm: "TP. Hồ Chí Minh", tphcm: "TP. Hồ Chí Minh", saigon: "TP. Hồ Chí Minh", hn: "Hà Nội" };
  if (alias[n]) return alias[n] as (typeof PROVINCES)[number];
  return PROVINCES.find((p) => removeVietnameseTones(p).toLowerCase().replace(/^tp\.?\s*/, "").replace(/[^a-z0-9]/g, "") === n) ?? null;
}

export type CsvIssue = { line: number; message: string };
export type CsvOrder = { line: number; input: unknown };

/** CSV → danh sách đơn (chưa validate sâu; server validate bằng sellerOrderCreateSchema) */
export function parseSellerCsv(text: string): { orders: CsvOrder[]; issues: CsvIssue[] } {
  const table = parseDelimited(text);
  const issues: CsvIssue[] = [];
  if (table.length < 2) return { orders: [], issues: [{ line: 1, message: "File trống hoặc thiếu dòng tiêu đề" }] };
  const head = table[0]!.map(norm);
  const idx = (k: string) => head.indexOf(k);
  const missing = ["MA_DON", "MA_MAU", "SO_LUONG", "TEN_NGUOI_NHAN", "SDT", "TINH", "PHUONG_XA", "DIA_CHI"].filter((k) => idx(k) < 0);
  if (missing.length) return { orders: [], issues: [{ line: 1, message: `Thiếu cột: ${missing.join(", ")}` }] };
  const get = (row: string[], k: string) => (idx(k) >= 0 ? (row[idx(k)] ?? "").trim() : "");

  const byId = new Map<string, { line: number; rows: string[][] }>();
  table.slice(1).forEach((row, i) => {
    if (row.every((c) => !c.trim())) return;
    const id = get(row, "MA_DON");
    if (!id) return issues.push({ line: i + 2, message: "Thiếu MA_DON" });
    const g = byId.get(id) ?? { line: i + 2, rows: [] };
    g.rows.push(row);
    byId.set(id, g);
  });
  if (byId.size > 200) issues.push({ line: 1, message: "Tối đa 200 đơn mỗi lần nhập" });

  const orders: CsvOrder[] = [];
  for (const [externalId, g] of [...byId.entries()].slice(0, 200)) {
    const first = g.rows[0]!;
    const provinceRaw = get(first, "TINH");
    const province = matchProvince(provinceRaw);
    if (!province) issues.push({ line: g.line, message: `Đơn ${externalId}: không nhận ra tỉnh "${provinceRaw}"` });
    orders.push({
      line: g.line,
      input: {
        externalId,
        recipient: {
          name: get(first, "TEN_NGUOI_NHAN"),
          phone: get(first, "SDT"),
          province: province ?? provinceRaw,
          ward: get(first, "PHUONG_XA"),
          addressLine: get(first, "DIA_CHI"),
        },
        items: g.rows.map((r) => ({
          template: get(r, "MA_MAU"),
          color: get(r, "MAU"),
          size: get(r, "SIZE"),
          quantity: Number(get(r, "SO_LUONG").replace(/\D/g, "")) || 0,
        })),
        shippingMethod: get(first, "GIAO_NHANH") === "1" ? "EXPRESS" : "STANDARD",
        codAmount: Number(get(first, "THU_HO").replace(/\D/g, "")) || 0,
        whiteLabel: true,
        note: get(first, "GHI_CHU"),
      },
    });
  }
  return { orders, issues };
}
