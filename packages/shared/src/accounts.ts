import { z } from "zod";
import { PROVINCES, isValidVNPhone, normalizePhone } from "./vn";
import { designJsonSchema } from "./design";

const phone = z
  .string()
  .trim()
  .refine(isValidVNPhone, "Số điện thoại không hợp lệ")
  .transform(normalizePhone);
const password = z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(100);
const name = z.string().trim().min(2, "Nhập họ tên").max(80);
const email = z.string().trim().email("Email không hợp lệ").max(120).optional().or(z.literal("")).default("");

/* ---------- Tài khoản khách ---------- */
export const customerRegisterSchema = z.object({ name, phone, password, email });
export const customerLoginSchema = z.object({ phone, password: z.string().min(1, "Nhập mật khẩu").max(100) });
export const customerProfileSchema = z.object({ name, email });
export const passwordChangeSchema = z.object({ current: z.string().min(1).max(100), next: password });

export const addressSchema = z.object({
  label: z.string().trim().max(30).default(""),
  name,
  phone,
  province: z.enum(PROVINCES, { errorMap: () => ({ message: "Chọn tỉnh/thành phố" }) }),
  ward: z.string().trim().min(2, "Nhập phường/xã").max(80),
  addressLine: z.string().trim().min(3, "Nhập số nhà, tên đường").max(200),
  isDefault: z.boolean().default(false),
});
export type Address = z.infer<typeof addressSchema>;
export const addressesSaveSchema = z.object({ addresses: z.array(addressSchema).max(5, "Tối đa 5 địa chỉ") });

export const savedDesignSchema = z.object({
  productId: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(80),
  json: designJsonSchema,
  previewUrl: z
    .string()
    .max(300)
    .regex(/^(\/uploads\/[\w.-]+)?$/)
    .default(""),
});

/** Kho ảnh của tôi: ảnh khách đã tải lên để dùng lại trong công cụ thiết kế */
export const customerAssetSchema = z.object({
  url: z.string().max(300).regex(/^\/uploads\/[\w.-]+$/, "Ảnh không hợp lệ"),
  name: z.string().trim().max(80).default(""),
  natW: z.number().int().min(1).max(100000),
  natH: z.number().int().min(1).max(100000),
  label: z.string().trim().max(40).default(""),
});
export const customerAssetPatchSchema = z.object({ name: z.string().trim().max(80).optional(), label: z.string().trim().max(40).optional() });
export const CUSTOMER_ASSET_LIMIT = 500;

/** Nhận đơn đặt khi chưa đăng nhập vào tài khoản: phải đúng mã đơn + SĐT của đơn */
export const claimOrderSchema = z.object({ code: z.string().trim().min(4).max(30) });

/* ---------- Lead (widget tư vấn) ---------- */
export const LEAD_TOPICS = ["Báo giá", "Thiết kế", "Đơn hàng", "Đổi trả", "Đồng phục / doanh nghiệp", "Làm seller / đại lý", "Khác"] as const;
export const leadCreateSchema = z.object({
  name,
  phone,
  topic: z.enum(LEAD_TOPICS),
  message: z.string().trim().max(1000).default(""),
  pageUrl: z.string().max(300).default(""),
  /** bẫy bot: ô ẩn, người thật để trống */
  website: z.string().max(0, "spam").optional().default(""),
});
export const LEAD_STATUSES = ["NEW", "CONTACTED", "DONE"] as const;
export const LEAD_STATUS_LABEL: Record<(typeof LEAD_STATUSES)[number], string> = { NEW: "Mới", CONTACTED: "Đã liên hệ", DONE: "Xong" };

/* ---------- Help Center ---------- */
export const HELP_CATEGORIES = [
  { key: "bat-dau", name: "Bắt đầu", icon: "🚀" },
  { key: "thiet-ke", name: "Thiết kế & file in", icon: "🎨" },
  { key: "dat-hang", name: "Đặt hàng & thanh toán", icon: "🛒" },
  { key: "van-chuyen", name: "Vận chuyển", icon: "🚚" },
  { key: "doi-tra", name: "Đổi trả & bảo hành", icon: "🔁" },
  { key: "doanh-nghiep", name: "Doanh nghiệp & seller", icon: "🏢" },
] as const;
export type HelpCategoryKey = (typeof HELP_CATEGORIES)[number]["key"];
const HELP_KEYS = HELP_CATEGORIES.map((c) => c.key) as [HelpCategoryKey, ...HelpCategoryKey[]];

export const helpArticleUpsertSchema = z.object({
  slug: z.string().trim().max(120).optional().default(""),
  category: z.enum(HELP_KEYS),
  title: z.string().trim().min(3, "Nhập tiêu đề").max(160),
  content: z.string().trim().min(3, "Nhập nội dung").max(20000),
  sortOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
});
export type HelpArticleInput = z.infer<typeof helpArticleUpsertSchema>;

/* ---------- Thông báo ---------- */
const optDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Ngày không hợp lệ");

export const noticeUpsertSchema = z.object({
  title: z.string().trim().min(3, "Nhập tiêu đề").max(160),
  content: z.string().trim().max(5000).default(""),
  level: z.enum(["info", "warning"]).default("info"),
  showBanner: z.boolean().default(false),
  showOnProduct: z.boolean().default(false),
  startsAt: optDate,
  endsAt: optDate,
  isActive: z.boolean().default(true),
});
export type NoticeInput = z.input<typeof noticeUpsertSchema>;
