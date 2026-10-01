import type { Audience, OrderDesign, OrderStatus, PaymentMethod, PaymentStatus, PriceTier, PrintMode, RosterRow } from "@pod/shared";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  showOnHome: boolean;
  sizeChart: string;
  _count?: { products: number };
};

export type AdminProduct = {
  id: string;
  /** Giá niêm yết của nguồn hàng (sản phẩm nhập từ nhà cung cấp) */
  sourcePrice?: number | null;
  /** Đã sửa giá tay -> "Áp dụng giá B2B" bỏ qua */
  priceManual?: boolean;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  audience: Audience;
  material: string;
  printMethod: string;
  basePrice: number;
  compareAtPrice: number | null;
  priceFrom: number | null;
  sizeChart: string;
  productionDays: string;
  weightGram: number;
  salePrice: number | null;
  saleEndsAt: string | null;
  newUntil: string | null;
  variants?: AdminVariant[];
  printAreas?: AdminPrintArea[];
  images: string[];
  mockShape: string;
  subcategory: string;
  externalId?: string | null;
  sourceUrl?: string;
  colors: string[];
  sizes: string[];
  minQty: number;
  priceTiers: PriceTier[];
  isBestSeller: boolean;
  isHotSale: boolean;
  isActive: boolean;
  sortOrder: number;
  category?: { name: string };
};

export type AdminVariant = {
  id: string;
  color: string;
  colorHex: string;
  size: string;
  sku: string;
  weightGram: number | null;
  priceDelta: number;
  isActive: boolean;
  sortOrder: number;
};

export type AdminPrintArea = {
  id: string;
  key: string;
  name: string;
  widthMm: number;
  heightMm: number;
  dpi: number;
  bleedMm?: number;
  safeMm?: number;
  sizeSpecs?: Record<string, { widthMm: number; heightMm: number }> | null;
  tips?: string;
  warp?: string;
  mockupImage: string;
  maskImage: string;
  overlayImage: string;
  zoneX: number;
  zoneY: number;
  zoneW: number;
  zoneH: number;
  extraPrice: number;
  sortOrder: number;
};

export type AdminOrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  productImg: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  designUrl: string;
  printMode: PrintMode;
  designNote: string;
  roster: RosterRow[] | null;
  sku: string;
  variantId: string | null;
  design: OrderDesign | null;
};

export type AdminOrder = {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  email: string;
  province: string;
  ward: string;
  addressLine: string;
  note: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  total: number;
  trackingCode: string;
  adminNote: string;
  isQuote: boolean;
  company: string;
  utm: Record<string, string> | null;
  shippingMethod: string;
  weightGram: number;
  codAmount: number;
  whiteLabel: boolean;
  externalId: string | null;
  customer?: { id: string; name: string; phone: string } | null;
  seller?: { id?: string; name: string; phone: string; seller?: { brandName: string; companyName: string; labelImage: string } | null } | null;
  batch?: { code: string; status: string; total?: number } | null;
  createdAt: string;
  items?: AdminOrderItem[];
  _count?: { items: number };
};

export type AdminTestimonial = {
  id: string;
  name: string;
  content: string;
  rating: number;
  productName: string;
  productPrice: number | null;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
};

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export type Stats = {
  newLeads: number;
  pendingSellers: number;
  unpaidBatches: number;
  statusCounts: Record<OrderStatus, number>;
  last24h: { revenue: number; orders: number };
  last7d: { revenue: number; orders: number };
  last30d: { revenue: number; orders: number };
  productCount: number;
  recent: Pick<AdminOrder, "id" | "code" | "customerName" | "phone" | "total" | "status" | "paymentMethod" | "createdAt">[];
};

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };
