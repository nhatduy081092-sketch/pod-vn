export const AUDIENCES = ["UNISEX", "MEN", "WOMEN", "KIDS"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const AUDIENCE_LABEL: Record<Audience, string> = {
  UNISEX: "Unisex",
  MEN: "Nam",
  WOMEN: "Nữ",
  KIDS: "Trẻ em",
};

/** slug trên URL <-> enum */
export const AUDIENCE_SLUG: Record<Audience, string> = {
  UNISEX: "unisex",
  MEN: "nam",
  WOMEN: "nu",
  KIDS: "tre-em",
};

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "DESIGN_APPROVED",
  "PRINTING",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  DESIGN_APPROVED: "Đã duyệt mockup",
  PRINTING: "Đang in",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

export const PAYMENT_METHODS = ["COD", "BANK_TRANSFER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  BANK_TRANSFER: "Chuyển khoản ngân hàng (VietQR)",
};

export const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
};

/** Kiểu in thiết kế lên sản phẩm (AOP) */
export const PRINT_MODES = ["FILL", "PATTERN"] as const;
export type PrintMode = (typeof PRINT_MODES)[number];
export const PRINT_MODE_LABEL: Record<PrintMode, string> = {
  FILL: "Phủ kín 1 hình",
  PATTERN: "Lặp họa tiết",
};

export const DEFAULT_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];
export const KIDS_SIZES = ["2-3T", "4-5T", "6-7T", "8-9T", "10-11T", "12-13T"];

/** Ảnh khách tải lên thiết kế (Printdoors cho 50MB) */
export const UPLOAD_MAX_BYTES = 50 * 1024 * 1024;
/** Cạnh ảnh tối đa (px) – lớn hơn trình duyệt điện thoại không giải mã nổi */
export const UPLOAD_MAX_SIDE_PX = 20000;
/** File in xuất từ editor (PNG trong suốt, khổ lớn) */
export const PRINT_FILE_MAX_BYTES = 60 * 1024 * 1024;
export const UPLOAD_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/** Dáng sản phẩm hỗ trợ xem trước thiết kế (file mask/line trong apps/web/public/shapes) */
export const MOCK_SHAPES = {
  tshirt: "Áo thun",
  "kids-tee": "Áo thun trẻ em",
  longsleeve: "Áo dài tay / Sweater",
  hoodie: "Hoodie",
  tank: "Áo ba lỗ",
  shirt: "Sơ mi",
  polo: "Polo",
  jersey: "Áo đấu",
  shorts: "Quần short",
  pants: "Quần dài / Legging",
  pajama: "Bộ pijama",
  dress: "Đầm",
  tote: "Túi tote",
  bucket: "Mũ bucket",
  sock: "Tất",
  bandana: "Khăn bandana",
} as const;
export type MockShape = keyof typeof MOCK_SHAPES;

/** Ảnh sản phẩm do AI tạo (CMS → Ảnh thật AI, file /uploads/ai-…) -> hiện nhãn "Ảnh minh hoạ" trên web */
export const isAiImage = (url?: string | null) => !!url && /\/uploads\/ai-[^/]*$/.test(url.split("?")[0]!);
