import type { Audience } from "./constants";
import { DEFAULT_SHIPPING, mergeShipping, type ShippingConfig } from "./shipping";

/**
 * Toàn bộ nội dung landing page chỉnh được từ CMS (lưu trong bảng Setting, key = "landing").
 * Bố cục bám theo trang mẫu: Top banner → Header → Hero → Best Sellers → 5 bước
 * → Giới thiệu chất liệu → Hot Sale (tile đối tượng + grid theo danh mục)
 * → Đánh giá → Vì sao chọn chúng tôi → Footer.
 */
export type LandingSettings = {
  brand: {
    name: string;
    tagline: string;
    hotline: string;
    zalo: string; // số điện thoại Zalo, ví dụ 0901234567
    messengerUrl: string;
    email: string;
    address: string;
    companyName: string; // tên hộ KD / công ty (hiện ở footer – yêu cầu của TMĐT VN)
    taxCode: string; // mã số thuế / số GPKD
    logoUrl: string; // để trống -> logo chữ mặc định
    website: string;
  };
  /** Khối giải pháp doanh nghiệp (B2B) trên landing */
  b2b: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    subtitle: string;
    categorySlug: string; // danh mục sản phẩm hiển thị trong khối
    ctaLabel: string;
    stats: { value: string; label: string }[];
    clients: string[];
  };
  topBanner: {
    enabled: boolean;
    title: string;
    line1: string;
    line2: string;
    highlight: string; // số/đoạn nhấn mạnh trong line2 (ví dụ "3")
    line3: string;
    line4: string;
    href: string;
  };
  hero: {
    tag: string;
    title: string;
    badge: string;
    imageUrl: string; // để trống -> dùng collage mockup
    ctaHref: string;
  };
  sectionTitles: {
    bestSellers: string;
    hotSale: string;
    reviews: string;
  };
  steps: { title: string; color: string }[];
  intro: {
    text: string;
    subtext: string;
    ctaLabel: string;
    ctaHref: string;
    imageUrl: string;
  };
  fabrics: { name: string; color: string; imageUrl: string }[];
  audienceTiles: { label: string; audience: Audience; imageUrl: string }[];
  whyChoose: {
    title: string;
    text: string;
    items: { title: string; desc: string }[];
  };
  shipping: ShippingConfig;
  bank: {
    bankId: string; // mã ngân hàng theo VietQR, ví dụ: VCB, MB, TCB, ACB...
    accountNo: string;
    accountName: string;
  };
  seo: {
    title: string;
    description: string;
  };
};

export const DEFAULT_LANDING: LandingSettings = {
  brand: {
    name: "OEM Group",
    tagline: "Sáng tạo ý tưởng và giải pháp merchandise, hàng khuyến mãi và quà tặng doanh nghiệp – nay in áo theo yêu cầu từ 1 chiếc.",
    hotline: "0931819333",
    zalo: "0931819333",
    messengerUrl: "https://m.me/oemgroupvn",
    email: "b2b@oemgroup.vn",
    address: "219 Hai Bà Trưng, P. Võ Thị Sáu, Q.3, TP.HCM",
    companyName: "Công ty Cổ phần OEM",
    taxCode: "0317199345",
    logoUrl: "https://oemgroup.vn/wp-content/uploads/2025/04/cropped-oem-fav-icon-1.png",
    website: "https://oemgroup.vn",
  },
  b2b: {
    enabled: true,
    eyebrow: "OEM GROUP · GIẢI PHÁP DOANH NGHIỆP",
    title: "Đồng phục & quà tặng in logo cho doanh nghiệp",
    subtitle:
      "Từ ý tưởng đến thành phẩm: tư vấn, thiết kế theo nhận diện thương hiệu, in – thêu – khắc logo, sản xuất số lượng lớn và giao hàng toàn quốc.",
    categorySlug: "dong-phuc-may-mac",
    ctaLabel: "Nhận báo giá B2B",
    stats: [
      { value: "15+", label: "năm kinh nghiệm bán lẻ & phân phối" },
      { value: "500+", label: "thương hiệu trong và ngoài nước" },
      { value: "20%", label: "tiết kiệm chi phí nhờ sản xuất trực tiếp" },
      { value: "60 ngày", label: "lưu kho miễn phí, giao theo đợt" },
    ],
    clients: ["Saigon Co.op", "ShopeeFood", "Vietnam Airlines", "BIDV", "Samsung", "7-Eleven", "VNG", "Acecook", "Schneider Electric", "GHN"],
  },
  topBanner: {
    enabled: true,
    title: "XƯỞNG IN TẠI VIỆT NAM",
    line1: "SẢN XUẤT NHANH. GIAO HÀNG NHANH.",
    line2: "NHẬN HÀNG CHỈ TỪ",
    highlight: "3",
    line3: "NGÀY.",
    line4: "IN TỪ 1 CHIẾC – KHÔNG CẦN ĐẶT SỐ LƯỢNG LỚN.",
    href: "#hot-sale",
  },
  hero: {
    tag: "Xu hướng POD mới · OEM Group",
    title: "IN TOÀN THÂN",
    badge: "Thiết kế theo yêu cầu",
    imageUrl: "",
    ctaHref: "#hot-sale",
  },
  sectionTitles: {
    bestSellers: "Bán Chạy Nhất",
    hotSale: "Sản Phẩm Hot Sale",
    reviews: "Khách Hàng Nói Gì",
  },
  steps: [
    { title: "Chọn sản phẩm & tải thiết kế", color: "#A9D8F7" },
    { title: "Nhận mockup duyệt miễn phí qua Zalo", color: "#F79A9A" },
    { title: "Xác nhận đơn & thanh toán COD / chuyển khoản", color: "#FF9A22" },
    { title: "Xưởng in toàn thân & kiểm tra chất lượng", color: "#D6A9F2" },
    { title: "Đóng gói & giao hàng toàn quốc", color: "#8BE3D3" },
  ],
  intro: {
    text: "In toàn thân (AOP) phá vỡ giới hạn của in truyền thống: hình in tràn viền trên nhiều chất liệu như cotton, polyester, spandex – màu bền, không bong tróc.",
    subtext: "Mở ra hướng đi mới cho sản phẩm cá nhân hoá của bạn.",
    ctaLabel: "BẮT ĐẦU NGAY",
    ctaHref: "#hot-sale",
    imageUrl: "",
  },
  fabrics: [
    { name: "Cotton", color: "#2F5D86", imageUrl: "" },
    { name: "Polyester", color: "#D7263D", imageUrl: "" },
    { name: "Spandex", color: "#7B2FF7", imageUrl: "" },
  ],
  audienceTiles: [
    { label: "Thời trang Nam", audience: "MEN", imageUrl: "" },
    { label: "Thời trang Nữ", audience: "WOMEN", imageUrl: "" },
    { label: "Trẻ em & Thiếu niên", audience: "KIDS", imageUrl: "" },
  ],
  whyChoose: {
    title: "Vì sao chọn OEM Group?",
    text: "Chúng tôi tin rằng ai cũng xứng đáng có một chiếc áo mang dấu ấn riêng – giá hợp lý, chất lượng ổn định, giao nhanh.",
    items: [
      { title: "Không giới hạn số lượng", desc: "In từ 1 chiếc, giá sỉ tự động khi đặt nhiều." },
      { title: "Duyệt mockup miễn phí", desc: "Xem trước sản phẩm trước khi in qua Zalo." },
      { title: "Chất lượng ổn định", desc: "In chuyển nhiệt sắc nét, không bong, không phai." },
      { title: "Giao nhanh toàn quốc", desc: "Sản xuất 2–4 ngày, giao 34 tỉnh thành." },
      { title: "COD & VietQR", desc: "Nhận hàng mới trả tiền hoặc chuyển khoản quét mã." },
      { title: "Đồng phục nhóm", desc: "Lớp, team, công ty, sự kiện – báo giá trong 15 phút." },
    ],
  },
  shipping: DEFAULT_SHIPPING,
  bank: {
    bankId: "VCB",
    accountNo: "0000000000",
    accountName: "CONG TY CO PHAN OEM",
  },
  seo: {
    title: "OEM Group – In áo theo yêu cầu, in toàn thân & đồng phục doanh nghiệp",
    description:
      "In áo thun, hoodie, pijama, sơ mi, đồ thể thao in toàn thân theo thiết kế riêng. In từ 1 chiếc, duyệt mockup miễn phí, COD toàn quốc.",
  },
};

/** Merge sâu cấu hình từ DB với mặc định (tránh thiếu field khi thêm field mới) */
export function mergeLanding(value: unknown): LandingSettings {
  const v = (value ?? {}) as Partial<LandingSettings>;
  const d = DEFAULT_LANDING;
  return {
    brand: { ...d.brand, ...v.brand },
    b2b: {
      ...d.b2b,
      ...v.b2b,
      stats: v.b2b?.stats?.length ? v.b2b.stats : d.b2b.stats,
      clients: v.b2b?.clients ?? d.b2b.clients,
    },
    topBanner: { ...d.topBanner, ...v.topBanner },
    hero: { ...d.hero, ...v.hero },
    sectionTitles: { ...d.sectionTitles, ...v.sectionTitles },
    steps: v.steps?.length ? v.steps : d.steps,
    intro: { ...d.intro, ...v.intro },
    fabrics: v.fabrics?.length ? v.fabrics : d.fabrics,
    audienceTiles: v.audienceTiles?.length ? v.audienceTiles : d.audienceTiles,
    whyChoose: {
      ...d.whyChoose,
      ...v.whyChoose,
      items: v.whyChoose?.items?.length ? v.whyChoose.items : d.whyChoose.items,
    },
    shipping: mergeShipping(v.shipping),
    bank: { ...d.bank, ...v.bank },
    seo: { ...d.seo, ...v.seo },
  };
}
