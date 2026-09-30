import { z } from "zod";
import { AUDIENCES, ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, PRINT_MODES } from "./constants";
import { PROVINCES, isValidVNPhone, normalizePhone } from "./vn";
import { ROSTER_MAX_ROWS, rosterRowSchema } from "./roster";
import { SIZE_CHART_MAX } from "./sizechart";
import { orderDesignSchema } from "./design";
import { SHIPPING_METHODS } from "./shipping";

/** Ngày giờ ISO hoặc rỗng/null -> null */
const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Ngày không hợp lệ" });
      return z.NEVER;
    }
    return d.toISOString();
  });

const trimmed = (min: number, max: number, msg: string) =>
  z.string().trim().min(min, msg).max(max, `Tối đa ${max} ký tự`);

export const orderItemInputSchema = z.object({
  productId: z.string().min(1),
  size: z.string().trim().min(1, "Chọn size").max(20),
  color: z.string().trim().max(40).optional().default(""),
  quantity: z.number().int().min(1).max(1000),
  // chỉ chấp nhận file đã upload lên API của mình (/uploads/...)
  designUrl: z
    .string()
    .max(500)
    .regex(/^\/uploads\/[\w.-]+$/, "File thiết kế không hợp lệ")
    .optional()
    .or(z.literal(""))
    .default(""),
  printMode: z.enum(PRINT_MODES).default("FILL"),
  designNote: z.string().trim().max(300).optional().default(""),
  // đồng phục nhóm: danh sách tên/số/size – khi có thì quantity = số dòng
  roster: z.array(rosterRowSchema).max(ROSTER_MAX_ROWS).optional(),
  /** Biến thể đã chọn (sản phẩm có biến thể) */
  variantId: z.string().max(40).optional(),
  /** Thiết kế từ editor (thay cho designUrl) */
  design: orderDesignSchema.optional(),
});

export const orderCreateSchema = z.object({
  customerName: trimmed(2, 80, "Vui lòng nhập họ tên"),
  phone: z
    .string()
    .trim()
    .refine(isValidVNPhone, "Số điện thoại không hợp lệ")
    .transform(normalizePhone),
  email: z.string().trim().email("Email không hợp lệ").max(120).optional().or(z.literal("")).default(""),
  province: z.enum(PROVINCES, { errorMap: () => ({ message: "Chọn tỉnh/thành phố" }) }),
  ward: trimmed(2, 80, "Nhập phường/xã"),
  addressLine: trimmed(3, 200, "Nhập số nhà, tên đường"),
  note: z.string().trim().max(500).optional().default(""),
  paymentMethod: z.enum(PAYMENT_METHODS),
  items: z.array(orderItemInputSchema).min(1, "Giỏ hàng trống").max(50),
  shippingMethod: z.enum(SHIPPING_METHODS).default("STANDARD"),
  // tracking attribution (tuỳ chọn)
  utm: z.record(z.string().max(200)).optional(),
});
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

export const orderLookupSchema = z.object({
  code: z.string().trim().min(4).max(30),
  phone: z.string().trim().refine(isValidVNPhone, "Số điện thoại không hợp lệ").transform(normalizePhone),
});

export const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  adminNote: z.string().max(1000).optional(),
  trackingCode: z.string().max(60).optional(),
});

export const priceTierSchema = z.object({
  minQty: z.number().int().min(2),
  price: z.number().int().min(0),
});

export const productUpsertSchema = z.object({
  name: trimmed(2, 160, "Nhập tên sản phẩm"),
  slug: z.string().trim().max(180).optional().default(""),
  description: z.string().max(5000).optional().default(""),
  categoryId: z.string().min(1, "Chọn danh mục"),
  audience: z.enum(AUDIENCES).default("UNISEX"),
  material: z.string().trim().max(120).optional().default(""),
  printMethod: z.string().trim().max(120).optional().default("In chuyển nhiệt toàn thân"),
  basePrice: z.number().int().min(0),
  compareAtPrice: z.number().int().min(0).nullable().optional(),
  /** Giá tham khảo "Từ …đ" – chỉ hiển thị khi basePrice = 0 (sản phẩm báo giá) */
  priceFrom: z.number().int().min(0).nullable().optional(),
  sizeChart: z.string().max(SIZE_CHART_MAX, `Bảng size tối đa ${SIZE_CHART_MAX} ký tự`).optional().default(""),
  productionDays: z.string().trim().max(40).optional().default(""),
  weightGram: z.number().int().min(1).max(100000).default(300),
  salePrice: z.number().int().min(0).nullable().optional(),
  saleEndsAt: optionalDate,
  newUntil: optionalDate,
  images: z.array(z.string().min(1).max(500)).max(12).default([]),
  mockShape: z.string().max(40).optional().default(""),
  subcategory: z.string().trim().max(80).optional().default(""),
  colors: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  sizes: z.array(z.string().trim().min(1).max(20)).max(20).default([]),
  minQty: z.number().int().min(1).default(1),
  priceTiers: z.array(priceTierSchema).max(10).default([]),
  isBestSeller: z.boolean().default(false),
  isHotSale: z.boolean().default(true),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;

/** Sửa nhanh giá nhiều sản phẩm (CMS → Bảng giá nhanh) */
export const productPriceBulkSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        basePrice: z.number().int().min(0).max(1_000_000_000),
        compareAtPrice: z.number().int().min(0).max(1_000_000_000).nullable(),
        priceFrom: z.number().int().min(0).max(1_000_000_000).nullable(),
        minQty: z.number().int().min(1).max(100000),
      }),
    )
    .min(1, "Chưa có thay đổi")
    .max(200, "Tối đa 200 sản phẩm mỗi lần lưu"),
});
export type ProductPriceBulkInput = z.infer<typeof productPriceBulkSchema>;

export const categoryUpsertSchema = z.object({
  name: trimmed(2, 80, "Nhập tên danh mục"),
  slug: z.string().trim().max(100).optional().default(""),
  description: z.string().max(1000).optional().default(""),
  imageUrl: z.string().max(500).optional().default(""),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  showOnHome: z.boolean().default(true),
  sizeChart: z.string().max(SIZE_CHART_MAX, `Bảng size tối đa ${SIZE_CHART_MAX} ký tự`).optional().default(""),
});
export type CategoryUpsertInput = z.infer<typeof categoryUpsertSchema>;

export const testimonialUpsertSchema = z.object({
  name: trimmed(2, 80, "Nhập tên"),
  content: trimmed(5, 1000, "Nhập nội dung"),
  rating: z.number().int().min(1).max(5).default(5),
  productName: z.string().trim().max(160).optional().default(""),
  productPrice: z.number().int().min(0).nullable().optional(),
  imageUrl: z.string().max(500).optional().default(""),
  isActive: z.boolean().default(true),
});
export type TestimonialUpsertInput = z.infer<typeof testimonialUpsertSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(200),
});

const nonEmpty = z.string().max(500);
const zoneRate = z.object({ first: z.number().int().min(0), step: z.number().int().min(0), days: z.string().max(40) });
export const landingSettingsSchema = z.object({
  brand: z.object({
    name: nonEmpty,
    tagline: nonEmpty,
    hotline: nonEmpty,
    zalo: nonEmpty,
    messengerUrl: nonEmpty,
    email: nonEmpty,
    address: nonEmpty,
    companyName: nonEmpty.default(""),
    taxCode: nonEmpty.default(""),
    logoUrl: nonEmpty.default(""),
    website: nonEmpty.default(""),
  }),
  b2b: z.object({
    enabled: z.boolean(),
    eyebrow: nonEmpty,
    title: nonEmpty,
    subtitle: z.string().max(1000),
    categorySlug: nonEmpty,
    ctaLabel: nonEmpty,
    stats: z.array(z.object({ value: nonEmpty, label: nonEmpty })).max(8),
    clients: z.array(z.string().trim().min(1).max(60)).max(40),
  }),
  topBanner: z.object({
    enabled: z.boolean(),
    title: nonEmpty,
    line1: nonEmpty,
    line2: nonEmpty,
    highlight: nonEmpty,
    line3: nonEmpty,
    line4: nonEmpty,
    href: nonEmpty,
  }),
  hero: z.object({ tag: nonEmpty, title: nonEmpty, badge: nonEmpty, imageUrl: nonEmpty, ctaHref: nonEmpty }),
  sectionTitles: z.object({ bestSellers: nonEmpty, hotSale: nonEmpty, reviews: nonEmpty }),
  steps: z.array(z.object({ title: nonEmpty, color: nonEmpty })).min(1).max(8),
  showcase: z.object({
    enabled: z.boolean(),
    eyebrow: nonEmpty,
    title: nonEmpty,
    autoColors: z.boolean(),
    tiles: z
      .array(
        z.object({
          title: z.string().trim().min(1, "Nhập tên dòng sản phẩm").max(60),
          subtitle: z.string().max(120),
          tagline: z.string().max(160),
          image: nonEmpty,
          bg: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Màu nền dạng #RRGGBB"),
          focus: z.string().max(20),
          categorySlug: z.string().max(120),
          href: z.string().max(300),
          ctaLabel: z.string().max(30),
          shape: z.string().max(30),
          colors: z.array(z.object({ name: z.string().trim().min(1).max(40), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) })).max(16),
        }),
      )
      .max(9),
  }),
  intro: z.object({ text: z.string().max(2000), subtext: nonEmpty, ctaLabel: nonEmpty, ctaHref: nonEmpty, imageUrl: nonEmpty }),
  fabrics: z.array(z.object({ name: nonEmpty, color: nonEmpty, imageUrl: nonEmpty })).max(6),
  audienceTiles: z.array(z.object({ label: nonEmpty, audience: z.enum(AUDIENCES), imageUrl: nonEmpty })).max(6),
  whyChoose: z.object({
    title: nonEmpty,
    text: z.string().max(2000),
    items: z.array(z.object({ title: nonEmpty, desc: nonEmpty })).max(12),
  }),
  shipping: z.object({
    flatFee: z.number().int().min(0),
    freeThreshold: z.number().int().min(0),
    productionDays: nonEmpty,
    mode: z.enum(["flat", "weight"]).default("flat"),
    origin: z.enum(PROVINCES).default("TP. Hồ Chí Minh"),
    firstGram: z.number().int().min(1).max(100000).default(500),
    stepGram: z.number().int().min(1).max(100000).default(500),
    rates: z.object({
      NOI_TINH: zoneRate,
      NOI_VUNG: zoneRate,
      LIEN_VUNG: zoneRate,
    }),
    express: z.object({ enabled: z.boolean(), surcharge: z.number().int().min(0), days: nonEmpty }),
  }),
  bank: z.object({ bankId: nonEmpty, accountNo: nonEmpty, accountName: nonEmpty }),
  seo: z.object({ title: nonEmpty, description: z.string().max(1000) }),
});

/** Yêu cầu báo giá / cá nhân hoá cho sản phẩm chưa có giá */
export const quoteCreateSchema = z.object({
  productId: z.string().min(1),
  customerName: trimmed(2, 80, "Vui lòng nhập họ tên"),
  phone: z
    .string()
    .trim()
    .refine(isValidVNPhone, "Số điện thoại không hợp lệ")
    .transform(normalizePhone),
  email: z.string().trim().email("Email không hợp lệ").max(120).optional().or(z.literal("")).default(""),
  company: z.string().trim().max(120).optional().default(""),
  quantity: z.number().int().min(1, "Nhập số lượng").max(100000),
  size: z.string().trim().max(20).optional().default(""),
  designUrl: z
    .string()
    .max(500)
    .regex(/^\/uploads\/[\w.-]+$/, "File thiết kế không hợp lệ")
    .optional()
    .or(z.literal(""))
    .default(""),
  note: z.string().trim().max(1000).optional().default(""),
  variantId: z.string().max(40).optional(),
  design: orderDesignSchema.optional(),
  utm: z.record(z.string().max(200)).optional(),
});
export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;
