import type { Audience } from "./constants";
import { DEFAULT_SHIPPING, mergeShipping, type ShippingConfig } from "./shipping";
import { DEFAULT_B2B_PRICING, type B2BPricing } from "./pricing";

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
  /** Định vị đầu trang: YALA là ai + 2 lối vào Cá nhân | Doanh nghiệp + dịch vụ chính */
  positioning: { enabled: boolean; statement: string; personal: Lane; business: Lane; services: { title: string; desc: string; href: string }[] };
  /** Trang /doanh-nghiep: merchandise, quà tặng, đồng phục doanh nghiệp */
  b2bHub: {
    eyebrow: string;
    title: string;
    subtitle: string;
    industries: { name: string; slug: string; blurb: string }[];
    /** keywords: từ khoá (cách nhau dấu phẩy) để gợi ý sản phẩm theo dịp – khớp tên/nhóm sản phẩm, không cần dấu */
    solutions: { key: string; title: string; desc: string; items: string; keywords: string }[];
    process: { title: string; desc: string }[];
    benefits: { title: string; desc: string }[];
  };
  /**
   * Báo giá doanh nghiệp: đơn nhỏ mua online, từ ngưỡng số lượng -> gợi ý (hoặc bắt buộc) gửi yêu cầu báo giá.
   * salesZalo trống = dùng Zalo thương hiệu.
   */
  b2bQuote: { threshold: number; enforce: boolean; salesZalo: string; salesName: string; responseTime: string };
  /**
   * Hình ảnh: hide2d = ẩn sản phẩm chỉ có ảnh vẽ 2D khỏi trang chủ, danh mục, gợi ý (vẫn vào được bằng link trực tiếp).
   * blanks = ảnh thật của phôi trơn theo "dáng-màu" (VD "tshirt-den") do AI tạo – dùng cho ảnh xem trước mẫu chữ & YALA Everyday.
   */
  media: { hide2d: boolean; blanks: Record<string, string> };
  /** Cách tính giá cho sản phẩm nhập từ nguồn (nhà cung cấp) */
  b2bPricing: B2BPricing;
  /**
   * Hero "cắt dán" vui: chữ lớn + ảnh thật + áo chữ mẫu có sẵn (designs = slug mẫu) + sticker chủ đề (stickers = slug bộ sưu tập).
   * Tắt -> dùng banner slider.
   */
  heroPlay: {
    enabled: boolean;
    title: string;
    subtitle: string;
    ctaLabel: string;
    href: string;
    secondaryLabel: string;
    secondaryHref: string;
    image: string;
    designs: string[];
    stickers: string[];
  };
  /** Slogan thương hiệu đầu trang: mỗi từ tiếng Anh, chữ cái đầu tô màu nhấn (ghép thành YALA) + câu tiếng Việt */
  slogan: { enabled: boolean; words: string[]; vi: string };
  /** Banner slider đầu trang theo chiến dịch (thay hero cũ khi bật) */
  slides: { enabled: boolean; intervalMs: number; items: HeroSlide[] };
  /** Sản phẩm theo mùa: chọn quy tắc theo tháng hiện tại (giờ Việt Nam) */
  seasonal: { enabled: boolean; rules: SeasonRule[] };
  /** Lưới bộ sưu tập "Mẫu có sẵn" */
  collections: { enabled: boolean; eyebrow: string; title: string };
  /** Trước / sau: ảnh gốc của khách -> áo in xong (để trống ảnh "sau" = tự ghép ảnh gốc lên áo) */
  beforeAfter: { enabled: boolean; eyebrow: string; title: string; subtitle: string; before: string; after: string; beforeLabel: string; afterLabel: string; ctaLabel: string; href: string; points: string[] };
  /** Shop the look: ảnh lifestyle + chấm bấm vào từng món để mua */
  lookbook: { enabled: boolean; eyebrow: string; title: string; image: string; bg: string; focus: string; hotspots: LookHotspot[] };
  /** Dòng basic (sản phẩm trơn) */
  everyday: { enabled: boolean; eyebrow: string; title: string; subtitle: string; categorySlug: string };
  /** Khối "Dòng sản phẩm" (ảnh người mẫu + dải màu) – ngay dưới hero */
  showcase: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    /** Lấy dải màu từ phân loại thật của danh mục (đủ ≥ 2 màu), không thì dùng màu khai báo */
    autoColors: boolean;
    tiles: ShowcaseTile[];
  };
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

export type Lane = { label: string; title: string; points: string[]; ctaLabel: string; href: string; secondaryLabel: string; secondaryHref: string; image: string };

export type HeroSlide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  image: string;
  /** Màu nền (lấy từ nền ảnh) – chữ tự đổi đen/trắng theo độ tương phản */
  bg: string;
  focus: string;
  /** Lịch chạy (YYYY-MM-DD, trống = luôn hiện) */
  startsAt: string;
  endsAt: string;
};
export type SeasonRule = { months: number[]; eyebrow: string; title: string; href: string; categorySlugs: string[]; productSlugs: string[] };
export type LookHotspot = { x: number; y: number; productSlug: string; color: string; label: string };

export type ShowcaseTile = {
  title: string;
  subtitle: string;
  /** Dòng chữ nhỏ dưới dải màu */
  tagline: string;
  image: string;
  /** Màu nền hiện trong lúc ảnh đang tải (lấy từ nền ảnh) */
  bg: string;
  /** Tâm ảnh khi cắt khung (object-position), VD "70% 30%" – giữ người mẫu trong khung ở mọi màn hình */
  focus: string;
  categorySlug: string;
  /** Link riêng (để trống = trang danh mục) */
  href: string;
  ctaLabel: string;
  /** Dáng áo vẽ ô màu: tshirt, hoodie, pajama, shirt, polo, jersey… (xem MOCK_SHAPES) */
  shape: string;
  colors: { name: string; hex: string }[];
};

const C = (name: string, hex: string) => ({ name, hex });

/** Số liệu khối doanh nghiệp: chỉ ghi điều YALA làm được (không dùng số liệu của nguồn hàng) */
const B2B_STATS = [
  { value: "Từ 1", label: "sản phẩm – đơn nhỏ đến số lượng lớn" },
  { value: "9", label: "nhóm ngành merchandise & quà tặng" },
  { value: "Miễn phí", label: "tư vấn & thiết kế mockup" },
  { value: "Toàn quốc", label: "giao một hoặc nhiều điểm" },
];
/** Giá trị mặc định cũ (số liệu & khách hàng của OEM Group) – gặp lại trong DB thì thay bằng thông tin của YALA */
const LEGACY_B2B_STATS = [
  { value: "15+", label: "năm kinh nghiệm bán lẻ & phân phối" },
  { value: "500+", label: "thương hiệu trong và ngoài nước" },
  { value: "20%", label: "tiết kiệm chi phí nhờ sản xuất trực tiếp" },
  { value: "60 ngày", label: "lưu kho miễn phí, giao theo đợt" },
];
const LEGACY_B2B_CLIENTS = ["Saigon Co.op", "ShopeeFood", "Vietnam Airlines", "BIDV", "Samsung", "7-Eleven", "VNG", "Acecook", "Schneider Electric", "GHN"];
const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export const DEFAULT_LANDING: LandingSettings = {
  brand: {
    name: "YALA",
    tagline: "Tự thiết kế áo, túi, phụ kiện theo ý bạn ngay trên web – xem trước tức thì, in từ 1 chiếc, giao toàn quốc.",
    hotline: "0971808330",
    zalo: "0971808330",
    messengerUrl: "https://m.me/oemgroupvn",
    email: "b2b@oemgroup.vn",
    address: "39 Nguyễn Văn Đậu, Phường Bình Lợi Trung, TP. Hồ Chí Minh",
    companyName: "Công ty Cổ phần OEM",
    taxCode: "0317199345",
    logoUrl: "",
    website: "https://yala.vn",
  },
  b2b: {
    enabled: true,
    eyebrow: "YALA · GIẢI PHÁP DOANH NGHIỆP",
    title: "Đồng phục & quà tặng in logo cho doanh nghiệp",
    subtitle:
      "Từ ý tưởng đến thành phẩm: tư vấn, thiết kế theo nhận diện thương hiệu, in – thêu – khắc logo, sản xuất số lượng lớn và giao hàng toàn quốc.",
    categorySlug: "dong-phuc-may-mac",
    ctaLabel: "Nhận báo giá B2B",
    stats: B2B_STATS,
    clients: [],
  },
  topBanner: {
    enabled: true,
    title: "XƯỞNG IN TẠI VIỆT NAM",
    line1: "SẢN XUẤT NHANH. GIAO HÀNG NHANH.",
    line2: "NHẬN HÀNG CHỈ TỪ",
    highlight: "3",
    line3: "NGÀY.",
    line4: "TỰ THIẾT KẾ ONLINE – IN TỪ 1 CHIẾC.",
    href: "/thiet-ke",
  },
  hero: {
    tag: "YALA Studio · Tự thiết kế theo ý bạn",
    title: "TỰ THIẾT KẾ",
    badge: "Miễn phí thiết kế",
    imageUrl: "",
    ctaHref: "/thiet-ke",
  },
  sectionTitles: {
    bestSellers: "Bán Chạy Nhất",
    hotSale: "Sản Phẩm Hot Sale",
    reviews: "Khách Hàng Nói Gì",
  },
  steps: [
    { title: "Chọn sản phẩm & mở YALA Studio", color: "#A9D8F7" },
    { title: "Thêm ảnh, chữ, mẫu có sẵn – xem trước ngay", color: "#F79A9A" },
    { title: "Đặt hàng & thanh toán COD / VietQR", color: "#FF9A22" },
    { title: "Xưởng in đúng file thiết kế & kiểm tra chất lượng", color: "#D6A9F2" },
    { title: "Đóng gói & giao hàng toàn quốc", color: "#8BE3D3" },
  ],
  positioning: {
    enabled: true,
    statement: "YALA in theo yêu cầu cho cá nhân và làm merchandise, quà tặng, đồng phục cho doanh nghiệp.",
    personal: {
      label: "Cá nhân",
      title: "In áo & quà theo ý bạn",
      points: ["Tự thiết kế online, xem trước trên áo thật", "Hơn 90 mẫu chữ có sẵn theo chủ đề", "In từ 1 chiếc, giao toàn quốc"],
      ctaLabel: "Bắt đầu thiết kế",
      href: "/thiet-ke",
      secondaryLabel: "Xem mẫu có sẵn",
      secondaryHref: "/bo-suu-tap",
      image: "/showcase/ao-thun.webp",
    },
    business: {
      label: "Doanh nghiệp",
      title: "Merchandise & quà tặng doanh nghiệp",
      points: ["Quà Tết, welcome kit, quà sự kiện, đồng phục", "In – thêu – khắc logo theo nhận diện thương hiệu", "Tư vấn & thiết kế mockup miễn phí"],
      ctaLabel: "Xem giải pháp doanh nghiệp",
      href: "/doanh-nghiep",
      secondaryLabel: "Nhận báo giá",
      secondaryHref: "/doanh-nghiep#bao-gia",
      image: "",
    },
    services: [
      { title: "In theo yêu cầu", desc: "Áo, túi, cốc, gối… in ảnh, chữ, logo từ 1 chiếc", href: "/thiet-ke" },
      { title: "Merchandise thương hiệu", desc: "Bộ nhận diện trên sản phẩm: áo, túi, bình, sổ", href: "/doanh-nghiep#nganh-hang" },
      { title: "Quà tặng doanh nghiệp", desc: "Quà Tết, tri ân khách hàng, quà sự kiện theo ngân sách", href: "/doanh-nghiep#giai-phap" },
      { title: "Đồng phục", desc: "Đồng phục công ty, lớp, đội nhóm – in tên & số từng người", href: "/danh-muc/ao-thun" },
    ],
  },
  media: { hide2d: true, blanks: {} },
  heroPlay: {
    enabled: true,
    title: "Áo in chữ của riêng bạn. Từ 1 chiếc.",
    subtitle: "Chọn mẫu có sẵn hoặc tự thiết kế – xem trước ngay trên áo, sửa chữ thoải mái, giao toàn quốc.",
    ctaLabel: "Tự thiết kế ngay",
    href: "/thiet-ke",
    secondaryLabel: "Xem mẫu có sẵn",
    secondaryHref: "/bo-suu-tap",
    image: "/showcase/ao-thun.webp",
    designs: ["chuyen-phong-gym-1", "ca-phe-tra-sua-1", "pickleball-1"],
    stickers: ["chuyen-phong-gym", "ca-phe-tra-sua", "tet-li-xi", "cap-doi", "doi-game-thu"],
  },
  b2bQuote: { threshold: 50, enforce: false, salesZalo: "", salesName: "", responseTime: "Phản hồi trong 2 giờ làm việc" },
  b2bPricing: DEFAULT_B2B_PRICING,
  b2bHub: {
    eyebrow: "YALA cho doanh nghiệp",
    title: "Merchandise & quà tặng doanh nghiệp in logo theo yêu cầu",
    subtitle: "Một đầu mối cho áo, túi, bình, sổ, hộp quà… Tư vấn theo ngân sách, thiết kế mockup miễn phí, sản xuất và giao tận nơi.",
    industries: [
      { name: "Đồng phục & may mặc", slug: "dong-phuc-may-mac", blurb: "Áo thun, polo, áo khoác, đồng phục sự kiện" },
      { name: "Balo, túi & phụ kiện", slug: "balo-tui-phu-kien", blurb: "Balo laptop, túi tote, túi rút, túi thể thao" },
      { name: "Bình giữ nhiệt & ly cốc", slug: "binh-nuoc-ly-coc", blurb: "Bình giữ nhiệt, cốc sứ, ly thuỷ tinh in logo" },
      { name: "Mũ nón, áo mưa & ô dù", slug: "mu-non-ao-mua-o-du", blurb: "Mũ lưỡi trai, nón bảo hiểm, áo mưa, ô dù" },
      { name: "Văn phòng phẩm", slug: "van-phong-pham", blurb: "Sổ tay, bút, thẻ tên – dây đeo, huy hiệu" },
      { name: "Hộp quà & sản phẩm giấy", slug: "hop-giay-san-pham-giay", blurb: "Hộp quà, túi giấy, lịch Tết, thiệp, sticker" },
      { name: "Vali & đồ du lịch", slug: "vali-du-lich", blurb: "Vali in logo, thẻ hành lý, gối cổ, ví hộ chiếu" },
      { name: "Gia dụng & đồ bếp", slug: "gia-dung-dien-bep", blurb: "Đồ gia dụng, gốm sứ, thuỷ tinh, đồ điện nhỏ" },
      { name: "Đồ chơi & mẹ bé", slug: "do-choi-me-be", blurb: "Thú bông, đồ chơi trí tuệ, lồng đèn Trung thu" },
    ],
    solutions: [
      { key: "qua-tet", title: "Quà Tết doanh nghiệp", desc: "Hộp quà Tết in logo cho nhân viên, đối tác, khách hàng – chọn theo ngân sách từng người.", items: "Lịch Tết · Bình giữ nhiệt · Sổ tay · Hộp quà", keywords: "lich, hop qua, bo qua, gio qua, binh giu nhiet, so tay, coc su, ly su, am tra, but ky" },
      { key: "welcome-kit", title: "Welcome kit nhân viên mới", desc: "Bộ quà chào đón đồng bộ nhận diện, đóng hộp sẵn, giao theo đợt tuyển dụng.", items: "Áo · Sổ · Bình nước · Túi tote · Thẻ tên", keywords: "ao thun, ao polo, so tay, binh giu nhiet, binh nuoc, tui tote, day deo the, the ten, but, balo, coc" },
      { key: "su-kien", title: "Sự kiện, hội nghị, hội thảo", desc: "Áo sự kiện, quà check-in, túi hội thảo số lượng lớn – bám sát deadline sự kiện.", items: "Áo sự kiện · Túi tote · Dây đeo thẻ · Quà check-in", keywords: "ao thun, tui tote, tui rut, day deo the, the deo, mu luoi trai, non, quat, o du, ao mua, binh nuoc, huy hieu" },
      { key: "tri-an", title: "Quà tri ân khách hàng & đối tác", desc: "Bộ quà chỉn chu, có thể khắc tên riêng từng người, kèm thiệp cảm ơn.", items: "Bình khắc tên · Sổ da · Hộp quà cao cấp", keywords: "binh giu nhiet, so da, so tay, hop qua, bo qua, but ky, coc su, ly thuy tinh, o du, vali" },
      { key: "dong-phuc", title: "Đồng phục công ty & team building", desc: "Áo thun, polo, áo khoác in/thêu logo đủ size; in tên – số từng người.", items: "Polo · Áo thun · Áo khoác · Mũ", keywords: "ao thun, ao polo, ao khoac, ao so mi, dong phuc, mu luoi trai, non" },
      { key: "truong-hoc", title: "Trường học & tổ chức", desc: "Áo lớp, đồng phục, quà tốt nghiệp, quà khai giảng cho trường và tổ chức.", items: "Áo lớp · Balo · Sổ · Huy hiệu", keywords: "ao thun, ao lop, balo, so tay, huy hieu, but, binh nuoc, mu, tui" },
    ],
    process: [
      { title: "Gửi nhu cầu", desc: "Dịp tặng, số lượng, ngân sách, deadline, file logo." },
      { title: "Tư vấn & đề xuất", desc: "Gợi ý sản phẩm theo ngân sách và hình ảnh thương hiệu." },
      { title: "Mockup miễn phí", desc: "Xem trước logo trên từng sản phẩm, chỉnh đến khi duyệt." },
      { title: "Báo giá & mẫu", desc: "Báo giá chi tiết; làm mẫu thật khi đơn cần." },
      { title: "Sản xuất & kiểm tra", desc: "Sản xuất theo mẫu đã duyệt, kiểm tra chất lượng từng lô." },
      { title: "Đóng gói & giao", desc: "Đóng gói quà, giao một hoặc nhiều điểm trên toàn quốc." },
    ],
    benefits: [
      { title: "Một đầu mối, nhiều ngành hàng", desc: "Áo, túi, bình, sổ, hộp quà… gom trong một đơn, một người phụ trách." },
      { title: "Xem trước trước khi sản xuất", desc: "Mockup miễn phí cho từng sản phẩm, duyệt xong mới làm." },
      { title: "In, thêu, khắc theo chất liệu", desc: "Chọn kỹ thuật phù hợp để logo bền, đúng màu nhận diện." },
      { title: "Linh hoạt số lượng", desc: "Từ đơn nhỏ cho team đến số lượng lớn cho cả công ty." },
      { title: "Đóng gói quà theo yêu cầu", desc: "Hộp, túi, thiệp in lời chúc – sẵn sàng để trao tặng." },
      { title: "Giao toàn quốc", desc: "Giao một điểm hoặc chia nhiều chi nhánh theo danh sách." },
    ],
  },
  slogan: {
    enabled: true,
    words: ["Young", "Ambitious", "Limitless", "Authentic"],
    vi: "Trẻ trung – Khát vọng – Không giới hạn – Sống thật.",
  },
  slides: {
    enabled: true,
    intervalMs: 6000,
    items: [
      { eyebrow: "Mùa lạnh 2026", title: "Hoodie & sweater nỉ bông", subtitle: "Ấm áp, dễ phối, in chữ – in logo theo ý bạn từ 1 chiếc.", ctaLabel: "Xem mẫu mùa lạnh", href: "/bo-suu-tap/mua-thu-ha-noi", image: "/showcase/hoodie.webp", bg: "#bca796", focus: "70% 35%", startsAt: "", endsAt: "" },
      { eyebrow: "Bộ sưu tập mới", title: "Pickleball cho vui", subtitle: "Ra sân 5 giờ sáng, mặc áo chữ khiến cả hội bật cười.", ctaLabel: "Xem mẫu pickleball", href: "/bo-suu-tap/pickleball", image: "/showcase/the-thao.webp", bg: "#e2e1df", focus: "62% 40%", startsAt: "", endsAt: "" },
      { eyebrow: "Mặc đôi", title: "Áo cặp đôi, áo nhóm bạn", subtitle: "Chọn mẫu có sẵn, sửa tên – ngày kỷ niệm trong 1 phút.", ctaLabel: "Xem mẫu cặp đôi", href: "/bo-suu-tap/cap-doi", image: "/showcase/ao-thun.webp", bg: "#e5e5e9", focus: "68% 30%", startsAt: "", endsAt: "" },
      { eyebrow: "YALA Studio", title: "Tự thiết kế áo của bạn", subtitle: "Tải ảnh, thêm chữ, xem trước trên áo thật – in từ 1 chiếc, giao toàn quốc.", ctaLabel: "Bắt đầu thiết kế", href: "/thiet-ke", image: "/showcase/so-mi-polo.webp", bg: "#e6e8ea", focus: "60% 40%", startsAt: "", endsAt: "" },
    ],
  },
  seasonal: {
    enabled: true,
    rules: [
      { months: [10, 11, 12, 1, 2], eyebrow: "Đang hot mùa lạnh", title: "Hoodie & sweater", href: "/danh-muc/hoodie-sweater", categorySlugs: ["hoodie-sweater"], productSlugs: ["ao-hoodie-ni-bong-yala-everyday", "ao-sweater-ni-bong-yala-everyday", "ao-thun-dai-tay-yala-everyday"] },
      { months: [5, 6, 7, 8], eyebrow: "Mặc gì hè này", title: "Áo thun & đồ thể thao", href: "/danh-muc/ao-thun", categorySlugs: ["ao-thun", "do-the-thao"], productSlugs: ["ao-thun-relaxed-fit-yala-everyday"] },
      { months: [3, 4, 9], eyebrow: "Chuyển mùa", title: "Áo thun & áo dài tay", href: "/danh-muc/ao-thun", categorySlugs: ["ao-thun"], productSlugs: ["ao-thun-dai-tay-yala-everyday", "ao-thun-relaxed-fit-yala-everyday"] },
    ],
  },
  collections: { enabled: true, eyebrow: "Chưa có ý tưởng? Chọn mẫu có sẵn", title: "Trọn bộ sưu tập theo chủ đề" },
  beforeAfter: {
    enabled: true,
    eyebrow: "Custom áo theo ý bạn",
    title: "Từ tấm ảnh của bạn thành chiếc áo",
    subtitle: "Gửi ảnh, chữ hoặc logo – YALA Studio cho xem trước trên áo, xưởng in đúng file từ 1 chiếc.",
    before: "/showcase/ao-thun.webp",
    after: "",
    beforeLabel: "Ảnh gốc",
    afterLabel: "Áo in xong",
    ctaLabel: "Thử in ảnh của bạn",
    href: "/thiet-ke",
    points: ["Xem trước trên áo trước khi đặt", "Kiểm tra độ nét ảnh tự động", "In từ 1 chiếc, giao toàn quốc"],
  },
  lookbook: {
    enabled: true,
    eyebrow: "Shop the look",
    title: "Set đồ mùa lạnh",
    image: "/showcase/hoodie.webp",
    bg: "#bca796",
    focus: "65% 35%",
    hotspots: [
      { x: 0.56, y: 0.62, productSlug: "ao-hoodie-ni-bong-yala-everyday", color: "Đen", label: "Hoodie đen" },
      { x: 0.86, y: 0.66, productSlug: "ao-hoodie-ni-bong-yala-everyday", color: "Kem", label: "Hoodie kem" },
    ],
  },
  everyday: { enabled: true, eyebrow: "Dòng basic", title: "YALA Everyday", subtitle: "Áo trơn mặc hằng ngày – thêm logo, tên hoặc chữ bạn thích. Mua kèm để đủ đơn freeship.", categorySlug: "yala-everyday" },
  showcase: {
    enabled: true,
    eyebrow: "YALA · Thời trang tuỳ chỉnh cho phong cách của bạn",
    title: "Chọn dòng sản phẩm",
    autoColors: true,
    tiles: [
      {
        title: "Áo thun",
        subtitle: "Đơn giản nhưng luôn chất",
        tagline: "Đủ màu · Đủ size · In theo yêu cầu",
        image: "/showcase/ao-thun.webp",
        bg: "#e5e5e9",
        focus: "68% 30%",
        categorySlug: "ao-thun",
        href: "",
        ctaLabel: "Xem ngay",
        shape: "tshirt",
        colors: [C("Trắng", "#ffffff"), C("Đen", "#1d1d1f"), C("Xám", "#a3a6ab"), C("Hồng", "#f4b9c6"), C("Đỏ", "#d62828"), C("Vàng", "#f5c518"), C("Xanh lá", "#0b6b3a"), C("Xanh ngọc", "#a8cdef"), C("Xanh navy", "#1e2f5a")],
      },
      {
        title: "Hoodie & Sweater",
        subtitle: "Ấm áp, phong cách, dễ phối đồ",
        tagline: "Nhiều màu sắc · Chất vải dày dặn · In thêu theo yêu cầu",
        image: "/showcase/hoodie.webp",
        bg: "#bca796",
        focus: "72% 30%",
        categorySlug: "hoodie-sweater",
        href: "",
        ctaLabel: "Xem ngay",
        shape: "hoodie",
        colors: [C("Đen", "#1d1d1f"), C("Xám", "#a3a3a3"), C("Xanh navy", "#1e2a4a"), C("Kem", "#efe3cf"), C("Hồng", "#f2b8c6"), C("Đỏ", "#c1121f"), C("Xanh rêu", "#0f5132"), C("Nâu", "#5c3d2e")],
      },
      {
        title: "Pijama",
        subtitle: "Thoải mái mỗi ngày",
        tagline: "Nhiều hoạ tiết · Nhiều màu · Chất vải mềm mại",
        image: "/showcase/pijama.webp",
        bg: "#f3c9d0",
        focus: "62% 35%",
        categorySlug: "pijama",
        href: "",
        ctaLabel: "Xem ngay",
        shape: "pajama",
        colors: [C("Hồng", "#f6c1cc"), C("Xanh", "#a9d2f0"), C("Vàng kem", "#f6dfb0"), C("Tím", "#c9b3e6"), C("Xanh navy", "#1f2a44")],
      },
      {
        title: "Sơ mi & Polo",
        subtitle: "Lịch lãm, trẻ trung, đa phong cách",
        tagline: "Đa dạng màu sắc · Chất liệu cao cấp · In/thêu logo theo yêu cầu",
        image: "/showcase/so-mi-polo.webp",
        bg: "#e6e8ea",
        focus: "60% 40%",
        categorySlug: "so-mi-polo",
        href: "",
        ctaLabel: "Xem ngay",
        shape: "polo",
        colors: [C("Trắng", "#ffffff"), C("Xanh", "#a9c7ea"), C("Hồng", "#f2b8c6"), C("Đen", "#1d1d1f"), C("Xanh navy", "#1e2a4a"), C("Xám", "#9ca3af")],
      },
      {
        title: "Đồ thể thao",
        subtitle: "Năng động, thoải mái, bứt phá",
        tagline: "Đa dạng sản phẩm · Nhiều màu sắc · Chất vải thoáng mát",
        image: "/showcase/the-thao.webp",
        bg: "#e2e1df",
        focus: "62% 40%",
        categorySlug: "do-the-thao",
        href: "",
        ctaLabel: "Xem ngay",
        shape: "jersey",
        colors: [C("Đen", "#1d1d1f"), C("Xám", "#9ca3af"), C("Xanh", "#a9d2f0"), C("Xanh navy", "#1e2a4a"), C("Đỏ", "#d62828"), C("Hồng", "#e29aa8")],
      },
    ],
  },
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
    title: "Vì sao chọn YALA?",
    text: "Chúng tôi tin rằng ai cũng xứng đáng có một chiếc áo mang dấu ấn riêng – giá hợp lý, chất lượng ổn định, giao nhanh.",
    items: [
      { title: "Không giới hạn số lượng", desc: "In từ 1 chiếc, giá sỉ tự động khi đặt nhiều." },
      { title: "Tự thiết kế online", desc: "Ảnh, chữ, sticker, mẫu có sẵn – xem trước trên áo thật trước khi đặt." },
      { title: "Chất lượng ổn định", desc: "In chuyển nhiệt sắc nét, không bong, không phai." },
      { title: "Giao nhanh toàn quốc", desc: "Sản xuất 2–4 ngày, giao 34 tỉnh thành." },
      { title: "COD & VietQR", desc: "Nhận hàng mới trả tiền hoặc chuyển khoản quét mã." },
      { title: "Đồng phục in tên & số", desc: "Lớp, team, công ty – mỗi người một tên, một số, đặt trong 1 đơn." },
    ],
  },
  shipping: DEFAULT_SHIPPING,
  bank: {
    bankId: "VCB",
    accountNo: "0000000000",
    accountName: "CONG TY CO PHAN OEM",
  },
  seo: {
    title: "YALA – Tự thiết kế áo, in theo yêu cầu từ 1 chiếc",
    description:
      "Tự thiết kế áo thun, hoodie, đồng phục, túi và phụ kiện online với YALA Studio: thêm ảnh, chữ, in tên số từng người, xem trước tức thì. In từ 1 chiếc, COD toàn quốc.",
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
      // dữ liệu cũ còn nguyên số liệu/khách hàng của OEM Group (nguồn hàng) -> thay bằng thông tin của YALA
      stats: v.b2b?.stats?.length && !sameJson(v.b2b.stats, LEGACY_B2B_STATS) ? v.b2b.stats : d.b2b.stats,
      clients: v.b2b?.clients && !sameJson(v.b2b.clients, LEGACY_B2B_CLIENTS) ? v.b2b.clients : d.b2b.clients,
    },
    topBanner: { ...d.topBanner, ...v.topBanner },
    hero: { ...d.hero, ...v.hero },
    sectionTitles: { ...d.sectionTitles, ...v.sectionTitles },
    steps: v.steps?.length ? v.steps : d.steps,
    showcase: { ...d.showcase, ...v.showcase, tiles: v.showcase?.tiles?.length ? v.showcase.tiles : d.showcase.tiles },
    slogan: { ...d.slogan, ...v.slogan, words: v.slogan?.words?.length ? v.slogan.words : d.slogan.words },
    positioning: {
      ...d.positioning,
      ...v.positioning,
      personal: { ...d.positioning.personal, ...v.positioning?.personal },
      business: { ...d.positioning.business, ...v.positioning?.business },
      services: v.positioning?.services?.length ? v.positioning.services : d.positioning.services,
    },
    b2bHub: {
      ...d.b2bHub,
      ...v.b2bHub,
      industries: v.b2bHub?.industries?.length ? v.b2bHub.industries : d.b2bHub.industries,
      // dữ liệu cũ chưa có từ khoá -> lấy từ khoá mặc định theo mã giải pháp
      solutions: v.b2bHub?.solutions?.length
        ? v.b2bHub.solutions.map((x) => ({ ...x, keywords: x.keywords ?? d.b2bHub.solutions.find((y) => y.key === x.key)?.keywords ?? "" }))
        : d.b2bHub.solutions,
      process: v.b2bHub?.process?.length ? v.b2bHub.process : d.b2bHub.process,
      benefits: v.b2bHub?.benefits?.length ? v.b2bHub.benefits : d.b2bHub.benefits,
    },
    b2bQuote: { ...d.b2bQuote, ...v.b2bQuote },
    media: { ...d.media, ...v.media, blanks: { ...v.media?.blanks } },
    heroPlay: {
      ...d.heroPlay,
      ...v.heroPlay,
      designs: v.heroPlay?.designs?.length ? v.heroPlay.designs : d.heroPlay.designs,
      stickers: v.heroPlay?.stickers?.length ? v.heroPlay.stickers : d.heroPlay.stickers,
    },
    b2bPricing: { ...d.b2bPricing, ...v.b2bPricing, tiers: v.b2bPricing?.tiers ?? d.b2bPricing.tiers },
    slides: { ...d.slides, ...v.slides, items: v.slides?.items?.length ? v.slides.items : d.slides.items },
    seasonal: { ...d.seasonal, ...v.seasonal, rules: v.seasonal?.rules?.length ? v.seasonal.rules : d.seasonal.rules },
    collections: { ...d.collections, ...v.collections },
    beforeAfter: { ...d.beforeAfter, ...v.beforeAfter, points: v.beforeAfter?.points?.length ? v.beforeAfter.points : d.beforeAfter.points },
    lookbook: { ...d.lookbook, ...v.lookbook, hotspots: v.lookbook?.hotspots?.length ? v.lookbook.hotspots : d.lookbook.hotspots },
    everyday: { ...d.everyday, ...v.everyday },
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

/** Tháng hiện tại theo giờ Việt Nam (1–12) */
export function monthInVietnam(d = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", month: "numeric" }).format(d));
}

/** Quy tắc theo mùa áp dụng cho tháng này (null = không có) */
export function currentSeasonRule(rules: SeasonRule[], d = new Date()): SeasonRule | null {
  const m = monthInVietnam(d);
  return rules.find((r) => r.months.includes(m)) ?? null;
}

/** Slide đang trong lịch chạy (ngày theo giờ Việt Nam) */
export function activeSlides(items: HeroSlide[], d = new Date()): HeroSlide[] {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(d); // YYYY-MM-DD
  return items.filter((s) => (!s.startsAt || s.startsAt <= today) && (!s.endsAt || s.endsAt >= today));
}
