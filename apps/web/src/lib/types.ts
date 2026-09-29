import type { Audience, DesignJson, LandingSettings, OrderDesign, PaymentMethod, PaymentStatus, OrderStatus, PriceTier } from "@pod/shared";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  audience: Audience;
  basePrice: number;
  compareAtPrice: number | null;
  /** Giá tham khảo "Từ …đ" cho sản phẩm báo giá */
  priceFrom?: number | null;
  salePrice?: number | null;
  saleEndsAt?: string | null;
  newUntil?: string | null;
  productionDays?: string;
  images: string[];
  isBestSeller: boolean;
  category: { name: string; slug: string };
};

export type Variant = { id: string; color: string; colorHex: string; size: string; sku: string; priceDelta: number; weightGram: number | null };

export type PrintArea = {
  id: string;
  key: string;
  name: string;
  widthMm: number;
  heightMm: number;
  dpi: number;
  mockupImage: string;
  maskImage: string;
  overlayImage: string;
  zoneX: number;
  zoneY: number;
  zoneW: number;
  zoneH: number;
  extraPrice: number;
};

export type ProductDetail = ProductCardData & {
  description: string;
  material: string;
  printMethod: string;
  colors: string[];
  sizes: string[];
  minQty: number;
  mockShape: string;
  priceTiers: PriceTier[];
  sizeChart?: string;
  weightGram: number;
  category: { name: string; slug: string; sizeChart?: string };
  variants: Variant[];
  printAreas: PrintArea[];
  related: ProductCardData[];
};

export type Notice = { id: string; title: string; content: string; level: "info" | "warning"; showBanner: boolean; showOnProduct: boolean; startsAt: string; endsAt: string | null };

/** Thiết kế đã xong trong editor, gắn vào trang sản phẩm / giỏ hàng */
/** color = màu áo khách chọn trong công cụ thiết kế (tên phân loại màu) */
export type AttachedDesign = OrderDesign & { updatedAt: number; color?: string };
export type { DesignJson };

export type Testimonial = {
  id: string;
  name: string;
  content: string;
  rating: number;
  productName: string;
  productPrice: number | null;
  imageUrl: string;
  createdAt: string;
};

export type HomeData = {
  settings: LandingSettings;
  bestSellers: ProductCardData[];
  categories: { id: string; name: string; slug: string; products: ProductCardData[] }[];
  testimonials: Testimonial[];
  b2bProducts: ProductCardData[];
  catalog?: { id: string; name: string; slug: string; count: number; image: string }[];
};

export type Category = { id: string; name: string; slug: string; description: string; imageUrl: string };

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export type OrderView = {
  code: string;
  customerName: string;
  province: string;
  ward: string;
  addressLine: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  total: number;
  trackingCode: string;
  isQuote?: boolean;
  createdAt: string;
  shippingMethod?: string;
  items: {
    productId?: string | null;
    variantId?: string | null;
    productName: string;
    productImg: string;
    size: string;
    color: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    designUrl: string;
    roster: { name: string; number: string; size: string; note: string }[] | null;
    design?: OrderDesign | null;
    printMode?: string;
    designNote?: string;
    product?: { slug: string; isActive: boolean } | null;
  }[];
  bank: LandingSettings["bank"] | null;
};
