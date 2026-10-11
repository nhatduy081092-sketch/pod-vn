import type { ColorKey, GarmentKey } from "./ready-designs";

/**
 * Định vị YALA (10/2026): tập trung khách TẬP THỂ – doanh nghiệp, CLB thể thao, hội nhóm/lớp/gia đình,
 * team building & sự kiện. Khách lẻ vẫn mua được nhưng không còn là lối vào chính.
 * Câu chữ chỉ nói điều website đang làm được (link nhóm, in tên/số từng người, xem mockup ngay) –
 * không nêu số liệu, khách hàng hay thời gian chưa kiểm chứng.
 */

/** Đơn nhóm: từ 10 sản phẩm (ít hơn vẫn đặt được, tính như mua lẻ) */
export const GROUP_MIN_QTY = 10;

export type SegmentKey = "doanh-nghiep" | "the-thao" | "hoi-nhom" | "su-kien";

/** 1 người trên ảnh minh hoạ áo đội: tên + số in trên ngực */
export type LineupPerson = { name: string; number?: string; color?: ColorKey };

export type Segment = {
  key: SegmentKey;
  href: string;
  /** tên ngắn trên menu */
  name: string;
  /** 1 dòng trên thẻ trang chủ */
  pitch: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** ý tưởng / dịp – hiện dạng nhãn, đồng thời là lựa chọn "Dịp" trong form báo giá */
  useCases: string[];
  features: { title: string; desc: string }[];
  /** sản phẩm gợi ý: phôi YALA Everyday (mở Studio đúng dáng/màu) */
  products: { garment: GarmentKey; color: ColorKey; note: string }[];
  /** món ngoài dòng áo – báo giá theo yêu cầu */
  extras: string;
  faq: { q: string; a: string }[];
  seoTitle: string;
  seoDescription: string;
  /** ảnh minh hoạ: dòng chữ chung trên ngực + từng người */
  lineup: { team: string; color: ColorKey; people: LineupPerson[] };
  notePlaceholder: string;
};

const COMMON_FAQ = {
  under: {
    q: `Nhóm dưới ${GROUP_MIN_QTY} người có đặt được không?`,
    a: `Được. Đơn dưới ${GROUP_MIN_QTY} sản phẩm đặt như mua lẻ, vẫn in tên/số từng người. Từ ${GROUP_MIN_QTY} sản phẩm là đơn nhóm: giá theo số lượng (nếu sản phẩm có bảng giá) hoặc YALA báo giá riêng.`,
  },
  link: {
    q: "Làm sao thu tên, size của cả nhóm mà không phải nhắn từng người?",
    a: "Thiết kế xong, bấm Hoàn tất → “Tạo link gom đơn nhóm”. Gửi link vào nhóm Zalo/Messenger – mỗi người tự xem áo và ghi tên, số, size. Trưởng nhóm thấy danh sách cập nhật, chốt hạn rồi đặt 1 đơn chung.",
  },
  names: {
    q: "In tên, số khác nhau trên từng áo có tính thêm phí không?",
    a: "Không. Mỗi áo một tên/số được tính cùng giá với áo in chung. Bạn xem trước từng áo trước khi đặt.",
  },
  design: {
    q: "Chưa có thiết kế thì sao?",
    a: "Chọn mẫu có sẵn trong YALA Studio rồi sửa chữ, hoặc gửi logo/ý tưởng qua form báo giá – YALA làm mockup miễn phí trước khi bạn đặt.",
  },
};

export const SEGMENTS: Segment[] = [
  {
    key: "doanh-nghiep",
    href: "/doanh-nghiep",
    name: "Doanh nghiệp",
    pitch: "Đồng phục, quà tặng, welcome kit in logo – có hoá đơn VAT",
    eyebrow: "Doanh nghiệp",
    title: "Đồng phục & quà tặng in logo cho doanh nghiệp",
    subtitle: "Áo đồng phục, quà tặng nhân viên – khách hàng, welcome kit. Xem logo trên sản phẩm ngay, đơn lớn nhận báo giá theo ngân sách.",
    useCases: ["Đồng phục công ty", "Welcome kit nhân viên mới", "Quà Tết, quà 8/3, 20/10", "Quà tặng khách hàng", "Hội nghị, ra mắt sản phẩm"],
    features: [],
    products: [
      { garment: "tshirt", color: "den", note: "Đồng phục hằng ngày" },
      { garment: "hoodie", color: "navy", note: "Áo khoác mùa lạnh" },
      { garment: "tote", color: "kem", note: "Túi quà, welcome kit" },
    ],
    extras: "",
    faq: [],
    seoTitle: "Đồng phục & quà tặng doanh nghiệp in logo",
    seoDescription: "Đồng phục, quà tặng doanh nghiệp in logo theo yêu cầu.",
    lineup: { team: "CÔNG TY BẠN", color: "den", people: [{ name: "Sales" }, { name: "Marketing" }, { name: "Kỹ thuật" }] },
    notePlaceholder: "VD: 80 áo đồng phục in logo ngực trái + 80 túi tote cho tiệc cuối năm",
  },
  {
    key: "the-thao",
    href: "/dong-phuc-the-thao",
    name: "CLB thể thao",
    pitch: "Áo đội in tên & số từng người, cả đội tự ghi size qua 1 link",
    eyebrow: "CLB & đội thể thao",
    title: "Áo đội in tên, số từng người – cả đội tự ghi size qua 1 link",
    subtitle:
      "Bóng đá, chạy bộ, cầu lông, pickleball, bóng chuyền… Thiết kế áo đội ngay trên web, gửi link cho thành viên tự điền tên – số – size, YALA in và giao về một địa chỉ.",
    useCases: ["Bóng đá phong trào", "CLB chạy bộ", "Cầu lông", "Pickleball", "Bóng chuyền", "Giải đấu nội bộ", "Áo cổ động viên"],
    features: [
      { title: "Tên & số riêng từng áo", desc: "Một thiết kế chung, mỗi thành viên một tên và một số – xem trước từng áo trước khi đặt." },
      { title: "1 link thu size cả đội", desc: "Gửi link vào nhóm chat, ai cũng tự ghi tên, số, size. Đội trưởng chỉ việc chốt." },
      { title: "Đủ màu áo đội", desc: "Trắng, đen, kem, xám, navy, hồng – đổi màu áo ngay trên mockup để chọn màu sân nhà, sân khách." },
      { title: "Áo cổ động viên đi kèm", desc: "Cùng thiết kế in thêm áo cho cổ động viên, hoodie khoác ngoài, túi đựng đồ." },
    ],
    products: [
      { garment: "tshirt", color: "navy", note: "Áo đội, áo tập" },
      { garment: "hoodie", color: "den", note: "Áo khoác CLB" },
      { garment: "longsleeve", color: "trang", note: "Tập buổi sáng sớm" },
      { garment: "tote", color: "den", note: "Túi đựng giày, đồ tập" },
    ],
    extras: "Cần áo thi đấu vải thun lạnh / mè, quần short, băng đội trưởng, cờ đội? Gửi yêu cầu – YALA báo giá theo mẫu.",
    faq: [
      COMMON_FAQ.link,
      COMMON_FAQ.names,
      { q: "Áo trên web là vải gì, có mặc đá bóng được không?", a: "Dòng YALA Everyday là áo cotton – hợp làm áo tập nhẹ, áo CLB, áo cổ động viên. Áo thi đấu vải thun lạnh/mè: gửi yêu cầu báo giá, YALA tư vấn chất liệu và mẫu." },
      COMMON_FAQ.under,
      { q: "Cần áo gấp trước ngày thi đấu?", a: "Ghi ngày cần hàng trong form báo giá hoặc nhắn Zalo – YALA xác nhận thời gian sản xuất trước khi bạn thanh toán." },
    ],
    seoTitle: "In áo đội bóng, áo CLB thể thao in tên số theo yêu cầu",
    seoDescription:
      "Thiết kế áo đội bóng, áo CLB chạy bộ, cầu lông, pickleball online: in tên và số riêng từng người, gửi 1 link cho cả đội tự ghi size. Đơn nhóm từ 10 áo, giao toàn quốc.",
    lineup: { team: "YALA FC", color: "navy", people: [{ name: "MINH", number: "7" }, { name: "TÙNG", number: "10" }, { name: "LAN", number: "23" }] },
    notePlaceholder: "VD: 18 áo đội bóng màu navy in tên + số lưng, 10 áo cổ động viên",
  },
  {
    key: "hoi-nhom",
    href: "/ao-nhom",
    name: "Hội nhóm & lớp",
    pitch: "Áo lớp, áo họp lớp, áo gia đình – thiết kế chung, mỗi người một size",
    eyebrow: "Hội nhóm, lớp, gia đình",
    title: "Áo lớp, áo nhóm, áo gia đình – chung thiết kế, mỗi người một size",
    subtitle:
      "Kỷ yếu, họp lớp, hội đồng hương, CLB sở thích, chuyến đi của cả nhà… Một người thiết kế, cả nhóm tự ghi size và tên qua link – không cần gom tin nhắn.",
    useCases: ["Áo lớp, kỷ yếu", "Họp lớp", "Hội đồng hương", "CLB sở thích", "Áo gia đình đi du lịch", "Đám cưới, tiệc độc thân", "Nhóm bạn thân"],
    features: [
      { title: "Một người thiết kế, cả nhóm góp ý", desc: "Gửi link xem áo trên mockup, mọi người thấy cùng một bản – chốt mẫu nhanh, không lệch ý." },
      { title: "Mỗi người tự ghi size, tên", desc: "Thu size qua link nhóm thay vì nhắn từng người; trưởng nhóm thấy danh sách cập nhật." },
      { title: "In tên, biệt danh riêng", desc: "Thêm ô tên/biệt danh – mỗi áo in đúng tên người mặc, cùng một đơn." },
      { title: "Áo cả nhà đủ size", desc: "Từ size nhỏ tới XXL trong cùng một đơn; thêm túi tote, hoodie cùng thiết kế làm quà." },
    ],
    products: [
      { garment: "tshirt", color: "trang", note: "Áo lớp, áo nhóm" },
      { garment: "hoodie", color: "kem", note: "Kỷ yếu mùa lạnh" },
      { garment: "sweater", color: "xam", note: "Họp lớp, đi Đà Lạt" },
      { garment: "tote", color: "kem", note: "Quà lưu niệm" },
    ],
    extras: "Cần thêm cốc, móc khoá, sổ in chung thiết kế làm quà lưu niệm? Gửi yêu cầu – YALA báo giá.",
    faq: [COMMON_FAQ.link, COMMON_FAQ.design, COMMON_FAQ.names, COMMON_FAQ.under],
    seoTitle: "In áo lớp, áo nhóm, áo gia đình theo yêu cầu",
    seoDescription:
      "Thiết kế áo lớp, áo kỷ yếu, áo họp lớp, áo nhóm, áo gia đình online: mỗi người tự ghi size và tên qua 1 link, in tên riêng từng áo. Đơn nhóm từ 10 áo, giao toàn quốc.",
    lineup: { team: "12A1 · 2026", color: "trang", people: [{ name: "HÀ" }, { name: "KHOA" }, { name: "VY" }] },
    notePlaceholder: "VD: 42 áo lớp màu trắng, in tên từng bạn ở lưng, cần trước ngày 20/11",
  },
  {
    key: "su-kien",
    href: "/team-building",
    name: "Team building",
    pitch: "Áo team building, sự kiện, giải chạy – chia màu theo đội",
    eyebrow: "Team building & sự kiện",
    title: "Áo team building & sự kiện – chia màu theo đội, in tên từng người",
    subtitle:
      "Team building, year-end party, du lịch công ty, giải chạy, hội nghị… Mỗi đội một màu, chung một thiết kế; thu size cả công ty bằng 1 link, giao về một điểm.",
    useCases: ["Team building", "Du lịch công ty", "Year-end party", "Giải chạy, fun run", "Hội nghị, hội thảo", "Ra mắt sản phẩm", "Hoạt động tình nguyện"],
    features: [
      { title: "Chia đội theo màu áo", desc: "Cùng một thiết kế trên nhiều màu – đổi màu ngay trên mockup để chọn màu từng đội." },
      { title: "Thu size cả công ty", desc: "Gửi 1 link cho mọi người tự ghi tên, size; HR/ban tổ chức chỉ cần chốt danh sách." },
      { title: "In tên, khẩu hiệu đội", desc: "Thêm tên từng người hoặc khẩu hiệu riêng mỗi đội – xem trước trước khi đặt." },
      { title: "Có hoá đơn cho công ty", desc: "Ghi thông tin xuất hoá đơn vào ghi chú khi đặt hàng hoặc trong yêu cầu báo giá." },
    ],
    products: [
      { garment: "tshirt", color: "hong", note: "Áo đội, áo sự kiện" },
      { garment: "tshirt", color: "navy", note: "Mỗi đội một màu" },
      { garment: "tote", color: "kem", note: "Quà tham dự sự kiện" },
      { garment: "hoodie", color: "xam", note: "Trip vùng lạnh" },
    ],
    extras: "Cần băng rôn, cờ đội, bình nước, mũ in logo cho sự kiện? Gửi yêu cầu – YALA báo giá trọn gói.",
    faq: [
      COMMON_FAQ.link,
      { q: "Mỗi đội một màu có đặt chung 1 đơn được không?", a: "Được. Chọn màu áo theo từng đội khi đặt hàng hoặc ghi rõ số lượng từng màu trong yêu cầu báo giá – vẫn là một đơn, một lần giao." },
      { q: "Công ty cần hoá đơn VAT?", a: "Ghi thông tin xuất hoá đơn (tên công ty, mã số thuế, email) vào ghi chú đơn hàng hoặc form báo giá – YALA xác nhận khi chốt đơn." },
      COMMON_FAQ.under,
      COMMON_FAQ.design,
    ],
    seoTitle: "In áo team building, áo sự kiện, áo giải chạy theo yêu cầu",
    seoDescription:
      "Thiết kế áo team building, áo du lịch công ty, áo sự kiện, giải chạy online: chia màu theo đội, in tên từng người, thu size cả công ty bằng 1 link. Có hoá đơn, giao toàn quốc.",
    lineup: { team: "TRIP 2026", color: "hong", people: [{ name: "ĐỘI HỒNG", color: "hong" }, { name: "ĐỘI XANH", color: "navy" }, { name: "ĐỘI XÁM", color: "xam" }] },
    notePlaceholder: "VD: 120 áo team building chia 4 đội (4 màu), in khẩu hiệu đội + tên từng người",
  },
];

export const segmentByKey = (k: SegmentKey) => SEGMENTS.find((s) => s.key === k)!;

/** 4 bước đặt áo nhóm – dùng ở trang chủ và trang từng nhóm khách */
export const GROUP_STEPS = [
  { title: "Chọn áo & thiết kế", desc: "Mở YALA Studio: thêm logo, chữ, ô tên/số – hoặc chọn mẫu có sẵn rồi sửa." },
  { title: "Gửi 1 link cho cả nhóm", desc: "Bấm Hoàn tất → Tạo link gom đơn nhóm. Mọi người xem áo, tự ghi tên, số, size – không cần gom tin nhắn." },
  { title: "Chốt danh sách, đặt 1 đơn", desc: "Trưởng nhóm kiểm tra danh sách, đặt một đơn chung; đơn lớn nhận báo giá riêng." },
  { title: "YALA in & giao tận nơi", desc: "In đúng tên, size từng người, đóng gói theo danh sách và giao về một địa chỉ." },
];
