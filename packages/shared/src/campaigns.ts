/**
 * Chiến dịch theo dịp (kiểu "activity" của Printdoors): trang /dip/<slug> gom mẫu chữ theo dịp + sản phẩm theo tab
 * + hạn chót đặt hàng (đếm ngược) + ưu đãi + khối doanh nghiệp. Tự hiện thanh thông báo & lối vào trang chủ khi đang chạy.
 * Ngày theo giờ Việt Nam (YYYY-MM-DD). Ưu đãi % chỉ để hiển thị – giá giảm thật áp vào sản phẩm bằng nút trong CMS
 * (đặt giá khuyến mãi có hạn cho các sản phẩm trong tab) nên giỏ hàng/thanh toán luôn khớp giá đang hiện.
 */
export type CampaignTab = {
  label: string;
  /** slug danh mục (trống = mọi danh mục) */
  category: string;
  /** từ khoá tìm sản phẩm (không dấu cũng được), VD "coc, binh giu nhiet" – trống = cả danh mục */
  q: string;
};

export type Campaign = {
  slug: string;
  enabled: boolean;
  /** tên ngắn trên menu/thanh thông báo, VD "20/10" */
  name: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** chạy từ ngày … đến ngày … (YYYY-MM-DD, giờ VN) */
  startsAt: string;
  endsAt: string;
  /** hạn chót đặt để kịp nhận trước dịp (YYYY-MM-DD) – hiện đếm ngược */
  deadline: string;
  /** % ưu đãi đang áp (0 = không có) – chỉ hiển thị, giá thật đặt bằng nút "Áp giá ưu đãi" trong CMS */
  discountPercent: number;
  /** màu nền chủ đề, màu nhấn, nền tối (chữ trắng) hay sáng */
  bg: string;
  accent: string;
  dark: boolean;
  /** ảnh chụp thật cho banner (trống = ghép mẫu chữ của dịp) */
  heroImage: string;
  /** chữ chạy trên dải ruy băng */
  ribbon: string[];
  /** bộ sưu tập mẫu chữ (slug) dùng cho dịp */
  collections: string[];
  tabs: CampaignTab[];
  /** khối doanh nghiệp: tiêu đề + mô tả (trống = ẩn) */
  b2bTitle: string;
  b2bText: string;
  faq: { q: string; a: string }[];
};

/** "YYYY-MM-DD" theo giờ VN -> mốc thời gian (đầu ngày / cuối ngày) */
export const vnDayStart = (d: string) => new Date(`${d}T00:00:00+07:00`);
export const vnDayEnd = (d: string) => new Date(`${d}T23:59:59+07:00`);

export function campaignLive(c: Campaign, now = new Date()): boolean {
  if (!c.enabled || !c.startsAt || !c.endsAt) return false;
  return now >= vnDayStart(c.startsAt) && now <= vnDayEnd(c.endsAt);
}
/** Chiến dịch đang chạy, ưu tiên cái kết thúc sớm nhất (dịp gần nhất) */
export function liveCampaigns(list: Campaign[], now = new Date()): Campaign[] {
  return list.filter((c) => campaignLive(c, now)).sort((a, b) => a.endsAt.localeCompare(b.endsAt));
}
/** Còn kịp đặt trước hạn chót không */
export const beforeDeadline = (c: Campaign, now = new Date()) => !!c.deadline && now <= vnDayEnd(c.deadline);
/** "16/10" */
export const vnShortDate = (d: string) => (d ? `${Number(d.slice(8, 10))}/${Number(d.slice(5, 7))}` : "");

const QUA = (label: string, q: string, category = ""): CampaignTab => ({ label, category, q });

export const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    slug: "20-10",
    enabled: true,
    name: "20/10",
    eyebrow: "Ngày Phụ nữ Việt Nam 20/10",
    title: "Quà 20/10 in theo ý bạn",
    subtitle: "Áo, túi, cốc in tên – lời chúc riêng cho mẹ, cho nàng, cho chị em đồng nghiệp. Thiết kế online, in từ 1 chiếc.",
    startsAt: "2026-10-01",
    endsAt: "2026-10-20",
    deadline: "2026-10-16",
    discountPercent: 0,
    bg: "#FFE4EC",
    accent: "#E11D74",
    dark: false,
    heroImage: "/showcase/pijama.webp",
    ribbon: ["Tặng mẹ", "Tặng nàng", "Tặng chị em văn phòng", "In tên riêng", "Từ 1 chiếc"],
    collections: ["20-10", "cap-doi", "gia-dinh"],
    tabs: [QUA("Áo in chữ", "ao thun, ao polo, hoodie, sweater"), QUA("Túi & phụ kiện", "tui, tote, mu, non"), QUA("Cốc, bình, quà nhỏ", "coc, ly, binh, so tay, goi")],
    b2bTitle: "Quà 20/10 cho nữ nhân viên",
    b2bText: "Bộ quà in logo công ty kèm lời chúc riêng từng người – tư vấn theo ngân sách, mockup miễn phí.",
    faq: [
      { q: "Đặt hôm nay bao giờ nhận được?", a: "Sản xuất 2–4 ngày làm việc + giao 1–3 ngày. Đặt trước hạn chót trên trang để kịp nhận trước 20/10." },
      { q: "Có in tên, lời chúc riêng không?", a: "Có. Mở YALA Studio, sửa chữ trên mẫu có sẵn hoặc tự gõ lời chúc, xem trước rồi đặt in từ 1 chiếc." },
    ],
  },
  {
    slug: "halloween",
    enabled: true,
    name: "Halloween",
    eyebrow: "Halloween 31/10",
    title: "Halloween mặc gì cho chất?",
    subtitle: "Áo chữ ma mị, áo nhóm đi tiệc, áo cặp hoá trang – in nhanh, giao kịp đêm 31/10.",
    startsAt: "2026-10-10",
    endsAt: "2026-10-31",
    deadline: "2026-10-27",
    discountPercent: 0,
    bg: "#1F1A17",
    accent: "#FF7A1A",
    dark: true,
    heroImage: "/showcase/hoodie.webp",
    ribbon: ["Trick or treat", "Áo nhóm đi tiệc", "Áo cặp hoá trang", "In nhanh"],
    collections: ["halloween", "ban-than", "doi-game-thu"],
    tabs: [QUA("Áo & hoodie", "ao thun, hoodie, sweater"), QUA("Túi & phụ kiện", "tui, tote, mu")],
    b2bTitle: "Tiệc Halloween công ty",
    b2bText: "Áo sự kiện, quà check-in in logo cho tiệc Halloween văn phòng – giao đúng ngày.",
    faq: [{ q: "Áo nhóm có in tên từng người không?", a: "Có. Trong Studio chọn in tên – số từng người, nhập danh sách, đặt chung 1 đơn." }],
  },
  {
    slug: "20-11",
    enabled: true,
    name: "20/11",
    eyebrow: "Ngày Nhà giáo Việt Nam 20/11",
    title: "Tri ân thầy cô, in lời cảm ơn",
    subtitle: "Áo lớp, cốc, sổ in lời tri ân – cả lớp góp ý trên một thiết kế, đặt chung một đơn.",
    startsAt: "2026-10-25",
    endsAt: "2026-11-20",
    deadline: "2026-11-15",
    discountPercent: 0,
    bg: "#E3F1FF",
    accent: "#2563EB",
    dark: false,
    heroImage: "/showcase/so-mi-polo.webp",
    ribbon: ["Tri ân thầy cô", "Áo lớp", "Quà cả lớp", "In tên từng bạn"],
    collections: ["20-11", "hoc-sinh-sinh-vien"],
    tabs: [QUA("Áo lớp", "ao thun, ao polo, hoodie"), QUA("Quà tặng thầy cô", "coc, ly, binh, so tay, but")],
    b2bTitle: "Trường học & trung tâm",
    b2bText: "Quà tri ân giáo viên số lượng lớn, in logo trường – báo giá theo ngân sách.",
    faq: [{ q: "Cả lớp đặt chung được không?", a: "Được. Một người đặt, nhập danh sách tên – size từng bạn trong Studio, giao về một địa chỉ." }],
  },
  {
    slug: "noel",
    enabled: true,
    name: "Noel",
    eyebrow: "Giáng sinh 2026",
    title: "Noel này mặc đôi, tặng quà in tên",
    subtitle: "Áo len, hoodie, áo gia đình mùa Giáng sinh – kèm túi, cốc in lời chúc. Thiết kế online, in từ 1 chiếc.",
    startsAt: "2026-11-20",
    endsAt: "2026-12-25",
    deadline: "2026-12-19",
    discountPercent: 0,
    bg: "#B91C1C",
    accent: "#FDE68A",
    dark: true,
    heroImage: "/showcase/hoodie.webp",
    ribbon: ["Merry Christmas", "Áo đôi Noel", "Áo gia đình", "Quà in tên"],
    collections: ["noel", "cap-doi", "gia-dinh"],
    tabs: [QUA("Áo Noel", "ao thun, hoodie, sweater, ao len"), QUA("Quà tặng", "coc, ly, binh, tui, tat, goi")],
    b2bTitle: "Quà Giáng sinh & tất niên cho doanh nghiệp",
    b2bText: "Quà in logo cho nhân viên, khách hàng dịp cuối năm – nên chốt sớm vì đơn số lượng lớn cần 7–15 ngày.",
    faq: [{ q: "Đơn doanh nghiệp cần đặt trước bao lâu?", a: "Đơn số lượng lớn hoặc nhiều món nên gửi yêu cầu trước 2–3 tuần để kịp mockup, làm mẫu và sản xuất." }],
  },
  {
    slug: "tet-2027",
    enabled: true,
    name: "Tết 2027",
    eyebrow: "Tết Đinh Mùi 2027",
    title: "Áo Tết cả nhà, quà Tết in logo",
    subtitle: "Áo gia đình chụp ảnh Tết, áo lì xì vui nhộn, quà Tết doanh nghiệp in logo – chốt sớm, giao trước Tết.",
    startsAt: "2026-12-15",
    endsAt: "2027-02-05",
    deadline: "2027-01-25",
    discountPercent: 0,
    bg: "#FFF1E6",
    accent: "#DC2626",
    dark: false,
    heroImage: "/showcase/ao-thun.webp",
    ribbon: ["Áo Tết cả nhà", "Lì xì đi rồi nói", "Quà Tết in logo", "Giao trước Tết"],
    collections: ["tet-li-xi", "gia-dinh"],
    tabs: [QUA("Áo Tết", "ao thun, ao polo, hoodie, sweater"), QUA("Quà Tết", "hop qua, lich, coc, binh, so tay, tui")],
    b2bTitle: "Quà Tết doanh nghiệp",
    b2bText: "Hộp quà, lịch Tết, bình giữ nhiệt in logo cho nhân viên & đối tác – báo giá theo ngân sách, mockup miễn phí.",
    faq: [{ q: "Bao giờ là quá muộn để đặt quà Tết?", a: "Đơn lẻ: trước hạn chót trên trang. Đơn doanh nghiệp: nên gửi yêu cầu trước giữa tháng 1 để kịp sản xuất." }],
  },
];
