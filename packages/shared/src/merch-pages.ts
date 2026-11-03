import { canChiYear, solarToLunar } from "./lunar";
import { tetSeasonYear } from "./seasons";

/**
 * Trang SEO merchandise "[sản phẩm] in logo" – từ khoá người mua doanh nghiệp gõ nhiều nhất (bình giữ nhiệt in logo, lịch Tết in logo…).
 * Sản phẩm lấy thật từ danh mục (category/sub); giá, số lượng tối thiểu, thời gian KHÔNG ghi cứng – sản phẩm merchandise đang
 * "Liên hệ báo giá", điều kiện lấy từ CMS (b2bHub.terms, b2bQuote.responseTime). Kỹ thuật in chỉ nêu loại thường dùng theo chất liệu,
 * kèm câu "tuỳ mẫu – ghi rõ khi gửi mockup".
 */

export type MerchPage = {
  slug: string;
  /** tên ngắn trên liên kết */
  name: string;
  /** title trang (chưa gồm "| YALA") – từ khoá chính đứng đầu */
  title: string;
  /** title/h1/description/faq nhận {tet} (năm mùa Tết), {canchi} (tên năm âm), {tetDate} (VD "thứ Bảy, 6/2/2027"), {response} (thời gian phản hồi báo giá trong CMS) */
  h1: string;
  /** meta description ≤ 155 ký tự */
  description: string;
  /** câu dẫn dưới H1 */
  lead: string;
  /** lọc sản phẩm: danh mục + nhóm con */
  category: string;
  sub?: string;
  /** tên nhóm sản phẩm trong câu: "{n} mẫu bình giữ nhiệt" */
  noun: string;
  /** giải pháp B2B (b2bHub.solutions.key) gắn vào link báo giá */
  dip: string;
  methods: { name: string; fit: string; note: string }[];
  tips: { title: string; body: string }[];
  faq: { q: string; a: string }[];
};

const FAQ_PREVIEW = {
  q: "Có xem logo trên sản phẩm trước khi đặt không?",
  a: "Có, miễn phí. Bấm “Đặt logo, xem mockup” để tự đặt logo lên sản phẩm trong YALA Studio, hoặc gửi file logo để YALA làm mockup giúp – chỉnh đến khi duyệt mới sản xuất.",
};
const FAQ_VAT = {
  q: "Có xuất hoá đơn VAT và giao nhiều chi nhánh không?",
  a: "Có. YALA xuất hoá đơn điện tử cho doanh nghiệp, giao một điểm hoặc chia nhiều chi nhánh theo danh sách trên toàn quốc.",
};

export const MERCH_PAGES: MerchPage[] = [
  {
    slug: "binh-giu-nhiet-in-logo",
    name: "Bình giữ nhiệt in logo",
    title: "Bình giữ nhiệt in logo, khắc logo làm quà tặng doanh nghiệp",
    h1: "Bình giữ nhiệt in logo",
    description: "Bình giữ nhiệt in logo, khắc laser làm quà tặng nhân viên, khách hàng, đối tác. Đặt logo xem mockup ngay, báo giá theo số lượng, xuất hoá đơn VAT.",
    lead: "Quà dùng hằng ngày nên logo được nhìn thấy hằng ngày. Chọn mẫu, đặt logo xem mockup ngay, gửi một yêu cầu để nhận báo giá theo số lượng.",
    category: "binh-nuoc-ly-coc",
    sub: "binh-giu-nhiet",
    noun: "bình giữ nhiệt",
    dip: "tri-an",
    methods: [
      { name: "Khắc laser", fit: "Logo 1 màu trên thân inox", note: "Tia laser bóc lớp sơn, lộ màu kim loại – không bong tróc khi rửa. Hợp logo nét đơn giản, nổi nhất trên bình màu tối." },
      { name: "In UV", fit: "Logo nhiều màu, đúng màu nhận diện", note: "Mực in thẳng lên thân bình, giữ đủ màu của logo. Cần file logo rõ nét (vector hoặc ảnh độ phân giải cao)." },
      { name: "In lụa", fit: "Số lượng lớn, logo 1–2 màu", note: "Mỗi màu một khuôn in, màu đậm và đều trên cả lô – tiết kiệm khi in nhiều bình cùng một logo." },
    ],
    tips: [
      { title: "Chọn dung tích theo người nhận", body: "350–500ml gọn để mang đi làm, đi họp. 750ml trở lên hợp người hay đi công tác, tập thể thao." },
      { title: "Màu bình đỡ màu logo", body: "Logo khắc laser lộ màu kim loại sáng – nổi nhất trên bình đen, xanh than, xám. Logo nhiều màu: chọn bình trắng hoặc màu nhạt." },
      { title: "Quà đối tác: thêm hộp", body: "Bình kèm hộp giấy in logo hoặc túi vải trông chỉn chu hơn khi trao tay. Ghi “cần hộp” trong yêu cầu để YALA báo giá trọn bộ." },
      { title: "Khắc tên từng người nhận", body: "Quà tri ân, quà nhân viên lâu năm: khắc thêm tên người nhận dưới logo. Gửi danh sách tên kèm yêu cầu báo giá." },
    ],
    faq: [
      { q: "Bình giữ nhiệt in logo giá bao nhiêu?", a: "Giá tuỳ mẫu bình, dung tích, cách làm logo và số lượng. Bấm “+ Thêm vào báo giá” ở các mẫu muốn so rồi gửi một yêu cầu – YALA {response}." },
      { q: "Nên khắc laser hay in màu logo lên bình?", a: "Logo 1 màu, muốn bền lâu: khắc laser. Logo nhiều màu, cần đúng màu nhận diện: in UV. Kỹ thuật phù hợp tuỳ chất liệu từng mẫu – YALA ghi rõ khi gửi mockup." },
      FAQ_PREVIEW,
      { q: "Đặt bình giữ nhiệt in logo bao lâu thì nhận?", a: "YALA báo thời gian theo từng đơn khi gửi báo giá. Đơn số lượng lớn hoặc cần đóng hộp nên gửi yêu cầu trước 2–3 tuần để kịp mockup, làm mẫu và sản xuất." },
      FAQ_VAT,
    ],
  },
  {
    slug: "lich-tet-in-logo",
    name: "Lịch Tết in logo",
    title: "Lịch Tết {tet} in logo – lịch để bàn làm quà Tết doanh nghiệp",
    h1: "Lịch Tết {tet} in logo",
    description: "In lịch Tết {canchi} {tet} có logo doanh nghiệp: lịch để bàn đế gỗ, lịch lò xo làm quà Tết cho khách hàng, nhân viên. Mockup miễn phí, báo giá theo số lượng.",
    lead: "Món quà nằm trên bàn khách hàng suốt 12 tháng. Chọn mẫu lịch, gửi logo và nội dung – YALA gửi mockup để duyệt rồi báo giá theo số lượng.",
    category: "hop-giay-san-pham-giay",
    sub: "lich-ban-lich-tuong",
    noun: "lịch để bàn, lịch tường",
    dip: "qua-tet",
    methods: [
      { name: "In offset", fit: "Số lượng lớn", note: "Màu chuẩn và đều trên cả lô, giá mỗi cuốn giảm khi số lượng tăng." },
      { name: "In kỹ thuật số", fit: "Số lượng ít, cần nhanh", note: "Không cần làm khuôn in – hợp đơn vài chục cuốn hoặc in thử trước khi in số lượng lớn." },
      { name: "Khắc / in logo lên đế", fit: "Lịch đế gỗ", note: "Logo nằm trên đế, ở lại sau khi lật hết 12 tháng." },
    ],
    tips: [
      { title: "Mỗi tháng một thông điệp", body: "12 tờ lịch là 12 lần thương hiệu xuất hiện: sản phẩm, đội ngũ, giá trị công ty, cột mốc trong năm." },
      { title: "Ghi đủ cách liên hệ", body: "Hotline, website, mã QR ở chân mỗi tờ – lịch nằm trên bàn khách cả năm, cần là gọi được ngay." },
      { title: "Trao trước Tết dương lịch", body: "Lịch dùng từ tháng 1. Trao dịp tất niên hoặc trước ngày 1/1 để người nhận dùng trọn năm – nên gửi yêu cầu sớm để kịp duyệt nội dung 12 tháng." },
      { title: "Đi kèm quà Tết khác", body: "Lịch hay đi cùng bình giữ nhiệt, sổ tay trong hộp quà Tết. Gửi danh sách món cần – YALA báo giá trọn bộ." },
    ],
    faq: [
      { q: "Tết {tet} là ngày nào?", a: "Mùng 1 Tết {canchi} {tet} là {tetDate} dương lịch." },
      { q: "In lịch Tết có logo giá bao nhiêu?", a: "Giá tuỳ loại lịch, số tờ, cách in và số lượng. Bấm “+ Thêm vào báo giá” ở các mẫu muốn so rồi gửi một yêu cầu – YALA {response}." },
      { q: "Nội dung 12 tháng ai làm?", a: "Doanh nghiệp gửi logo, ảnh, thông điệp muốn đưa lên lịch. YALA dàn trang và gửi bản mockup để duyệt từng tờ trước khi in." },
      FAQ_PREVIEW,
      FAQ_VAT,
    ],
  },
];

export const findMerchPage = (slug: string) => MERCH_PAGES.find((m) => m.slug === slug);

const WEEKDAY = ["Chủ nhật", "thứ Hai", "thứ Ba", "thứ Tư", "thứ Năm", "thứ Sáu", "thứ Bảy"];
/** Ngày mùng 1 Tết của năm âm lịch `year` (luôn rơi vào 21/1 – 20/2 dương lịch) */
export function tetDate(year: number): Date {
  for (let i = 0; i < 31; i++) {
    const d = new Date(year, 0, 21 + i);
    const l = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear());
    if (l.day === 1 && l.month === 1 && !l.leap) return d;
  }
  return new Date(year, 1, 1);
}

/** Điền {tet} {canchi} {tetDate} {response} – gọi lúc render (không ở cấp module) để năm tự chuyển sau rằm tháng Giêng */
export function fillMerch(text: string, response = "phản hồi trong giờ làm việc", now = new Date()): string {
  const y = tetSeasonYear(now);
  const d = tetDate(y);
  return text
    .replaceAll("{tet}", String(y))
    .replaceAll("{canchi}", canChiYear(y))
    .replaceAll("{tetDate}", `${WEEKDAY[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${y}`)
    .replaceAll("{response}", response.charAt(0).toLocaleLowerCase("vi") + response.slice(1));
}
