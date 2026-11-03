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
  /** hợp làm quà Tết – hiện liên kết ở trang Quà Tết doanh nghiệp */
  tetGift?: boolean;
  methods: { name: string; fit: string; note: string }[];
  tips: { title: string; body: string }[];
  faq: { q: string; a: string }[];
};

const FAQ_PREVIEW = {
  q: "Có xem logo trên sản phẩm trước khi đặt không?",
  a: "Có, miễn phí. Bấm “Đặt logo, xem mockup” để tự đặt logo lên sản phẩm trong YALA Studio, hoặc gửi file logo để YALA làm mockup giúp – chỉnh đến khi duyệt mới sản xuất.",
};
/** "[sản phẩm] in logo giá bao nhiêu?" – giá đi qua báo giá, thời gian phản hồi lấy từ CMS */
const faqPrice = (noun: string, by: string) => ({
  q: `${noun} in logo giá bao nhiêu?`,
  a: `Giá tuỳ ${by} và số lượng. Bấm “+ Thêm vào báo giá” ở các mẫu muốn so rồi gửi một yêu cầu – YALA {response}.`,
});
const FAQ_TIME = {
  q: "Đặt bao lâu thì nhận được hàng?",
  a: "YALA báo thời gian theo từng đơn khi gửi báo giá. Đơn số lượng lớn hoặc cần đóng hộp nên gửi yêu cầu trước 2–3 tuần để kịp mockup, làm mẫu và sản xuất.",
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
    tetGift: true,
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
    tetGift: true,
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
  {
    slug: "so-tay-in-logo",
    name: "Sổ tay in logo",
    title: "Sổ tay in logo, sổ bìa da dập logo làm quà tặng doanh nghiệp",
    h1: "Sổ tay in logo",
    description: "Sổ tay in logo, sổ bìa da dập logo làm quà tặng nhân viên, khách hàng, hội nghị. Đặt logo xem mockup ngay, báo giá theo số lượng, hoá đơn VAT.",
    lead: "Món quà được mở ra trong mọi cuộc họp. Chọn kiểu bìa, đặt logo xem mockup ngay, gửi một yêu cầu để nhận báo giá theo số lượng.",
    category: "van-phong-pham",
    sub: "so-tay",
    noun: "sổ tay",
    dip: "welcome-kit",
    tetGift: true,
    methods: [
      { name: "Dập nổi / dập chìm", fit: "Bìa da, giả da", note: "Logo nổi hoặc lõm trên bìa, không dùng mực – trông chững chạc, không phai theo thời gian." },
      { name: "Ép kim", fit: "Logo nhũ vàng, bạc", note: "Lớp nhũ ép nhiệt lên bìa, hợp sổ quà Tết, quà tri ân cần nét sang." },
      { name: "In màu bìa", fit: "Bìa giấy, logo nhiều màu", note: "In cả bìa theo thiết kế riêng: logo, màu nhận diện, hình ảnh thương hiệu." },
    ],
    tips: [
      { title: "Bìa da cho quà đối tác", body: "Sổ bìa da dập logo hợp quà tri ân, quà Tết. Sổ bìa giấy in màu hợp hội nghị, welcome kit số lượng lớn." },
      { title: "Lò xo hay dán gáy", body: "Sổ lò xo mở phẳng, dễ ghi trên bàn họp. Sổ dán gáy gọn, trông chỉn chu hơn khi trao tay." },
      { title: "Đi kèm bút cùng logo", body: "Sổ và bút in cùng logo thành một bộ quà hoàn chỉnh. Ghi “kèm bút” trong yêu cầu để YALA báo giá trọn bộ." },
      { title: "Trang đầu in thông điệp", body: "Trang lót đầu sổ có thể in lời chào, giá trị công ty hoặc lịch năm – thứ người nhận đọc đầu tiên khi mở sổ." },
    ],
    faq: [
      faqPrice("Sổ tay", "kiểu bìa, số trang, cách làm logo"),
      { q: "Dập logo hay in logo lên sổ thì đẹp hơn?", a: "Bìa da: dập nổi hoặc ép kim cho cảm giác cao cấp, bền lâu. Bìa giấy: in màu để đúng màu nhận diện. Kỹ thuật phù hợp tuỳ chất liệu từng mẫu – YALA ghi rõ khi gửi mockup." },
      FAQ_PREVIEW,
      FAQ_TIME,
      FAQ_VAT,
    ],
  },
  {
    slug: "balo-in-logo",
    name: "Balo in logo",
    title: "Balo in logo công ty, balo laptop làm quà tặng doanh nghiệp",
    h1: "Balo in logo công ty",
    description: "Balo laptop in logo, thêu logo làm quà tặng nhân viên, đối tác, welcome kit. Nhiều mẫu, đặt logo xem mockup ngay, báo giá theo số lượng, hoá đơn VAT.",
    lead: "Quà mang theo mỗi ngày đi làm, đi công tác. Chọn mẫu balo, đặt logo xem mockup ngay, gửi một yêu cầu để nhận báo giá theo số lượng.",
    category: "balo-tui-phu-kien",
    sub: "balo-laptop",
    noun: "balo laptop",
    dip: "welcome-kit",
    methods: [
      { name: "Thêu", fit: "Logo trên vải dày", note: "Chỉ thêu bền, không bong khi cọ xát – trông chỉn chu trên balo công sở." },
      { name: "In", fit: "Logo nhiều màu", note: "In lên mặt vải theo đúng màu logo. Hợp logo có chi tiết nhỏ, khó thêu." },
      { name: "Tem gắn", fit: "Tem da, cao su, kim loại", note: "Logo làm thành tem rồi may hoặc gắn lên balo – nổi khối, hợp balo cao cấp." },
    ],
    tips: [
      { title: "Chọn theo cỡ laptop", body: "Hỏi trước cỡ máy của người nhận: balo 14 inch gọn nhẹ, 15.6–16 inch vừa phần lớn laptop văn phòng." },
      { title: "Logo vừa phải, đúng chỗ", body: "Balo công sở đẹp nhất với logo vừa phải ở mặt trước hoặc quai đeo – người nhận vẫn dùng hằng ngày mà không ngại." },
      { title: "Một mẫu cho cả công ty", body: "Cả công ty dùng chung một mẫu, một màu – đồng bộ hình ảnh khi đi sự kiện, công tác." },
      { title: "Đựng sẵn welcome kit", body: "Balo đựng sẵn sổ, bình nước, áo đồng phục cho nhân viên mới. Gửi danh sách món cần – YALA báo giá trọn bộ." },
    ],
    faq: [
      faqPrice("Balo", "mẫu balo, vị trí và cách làm logo"),
      { q: "Thêu hay in logo lên balo?", a: "Logo ít màu, muốn bền: thêu. Logo nhiều màu, chi tiết nhỏ: in. Vị trí và kỹ thuật làm logo tuỳ chất liệu từng mẫu – YALA ghi rõ khi gửi mockup." },
      FAQ_PREVIEW,
      FAQ_TIME,
      FAQ_VAT,
    ],
  },
  {
    slug: "tui-tote-in-logo",
    name: "Túi tote in logo",
    title: "Túi tote in logo, túi canvas in theo yêu cầu cho doanh nghiệp",
    h1: "Túi tote in logo",
    description: "Túi tote vải canvas in logo cho sự kiện, hội thảo, welcome kit, quà khách hàng. Đặt logo xem mockup ngay, báo giá theo số lượng, xuất hoá đơn VAT.",
    lead: "Túi vải được mang đi làm, đi chợ, đi cà phê – logo đi theo khắp nơi. Chọn mẫu, đặt logo xem mockup ngay, gửi một yêu cầu để nhận báo giá.",
    category: "balo-tui-phu-kien",
    sub: "tui-tote-tui-rut",
    noun: "túi tote, túi rút",
    dip: "su-kien",
    methods: [
      { name: "In lụa", fit: "Số lượng lớn, logo 1–2 màu", note: "Màu đậm, bền trên vải canvas; mỗi màu một khuôn – tiết kiệm khi in nhiều túi cùng một logo." },
      { name: "In chuyển nhiệt", fit: "Logo nhiều màu, số lượng ít", note: "In đủ màu, chi tiết nhỏ, không cần làm khuôn – hợp đơn vài chục túi." },
      { name: "Thêu", fit: "Logo nhỏ, cần nét sang", note: "Logo thêu ở góc túi cho cảm giác cao cấp hơn bản in." },
    ],
    tips: [
      { title: "Có khoá kéo cho dân văn phòng", body: "Túi tote có khoá kéo giữ đồ an toàn khi đi làm, đi công tác – người nhận dùng lâu hơn." },
      { title: "Thiết kế để người ta muốn mang", body: "Câu chữ hay, hình vẽ đẹp kèm logo nhỏ khiến túi được mang ra đường nhiều hơn một logo to giữa túi." },
      { title: "Túi sự kiện: đặt sớm", body: "Túi phát ở hội thảo, sự kiện cần có trước ngày diễn ra – gửi yêu cầu sớm để kịp duyệt mẫu." },
      { title: "Đựng sẵn cả bộ quà", body: "Túi tote là bao bì cho cả bộ quà: sổ, bút, bình nước. Gửi danh sách món cần – YALA báo giá trọn bộ." },
    ],
    faq: [
      faqPrice("Túi tote", "chất vải, kích thước, cách in"),
      { q: "Túi tote khác gì túi canvas?", a: "Tote là kiểu dáng – túi xách tay hai quai, miệng rộng. Canvas là chất vải dày, bền, in đẹp. Phần lớn túi tote in logo làm bằng vải canvas." },
      FAQ_PREVIEW,
      FAQ_TIME,
      FAQ_VAT,
    ],
  },
  {
    slug: "o-du-in-logo",
    name: "Ô dù in logo",
    title: "Ô dù in logo làm quà tặng, dù cầm tay in logo theo yêu cầu",
    h1: "Ô dù in logo",
    description: "Ô dù cầm tay, dù gấp gọn in logo làm quà tặng khách hàng, quà sự kiện, quảng bá thương hiệu. Đặt logo xem mockup ngay, báo giá theo số lượng.",
    lead: "Mỗi lần mở ra là một lần thương hiệu xuất hiện giữa phố. Chọn mẫu dù, đặt logo xem mockup ngay, gửi một yêu cầu để nhận báo giá theo số lượng.",
    category: "mu-non-ao-mua-o-du",
    sub: "o-du",
    noun: "ô dù",
    dip: "tri-an",
    methods: [
      { name: "In lụa từng múi", fit: "Logo 1–2 màu", note: "In logo lên một hoặc vài múi dù – màu đậm, cách in dù phổ biến nhất." },
      { name: "In tràn", fit: "Thiết kế phủ cả mặt dù", note: "In hình ảnh, hoạ tiết theo nhận diện thương hiệu trên toàn bộ mặt dù." },
      { name: "In bao dù", fit: "Thêm một chỗ cho logo", note: "Logo trên túi đựng dù – thấy ngay cả khi dù đang gấp." },
    ],
    tips: [
      { title: "Gấp gọn cho dân văn phòng", body: "Dù gấp gọn bỏ vừa túi xách, balo – được mang theo thường xuyên hơn dù cán dài." },
      { title: "Bật tự động tiện hơn", body: "Dù bật, gập tự động mở bằng một tay – hợp người hay xách đồ, đi xe." },
      { title: "Dù cán dài cho khách VIP", body: "Dù cán thẳng, tán rộng che được nhiều người – hợp làm quà khách VIP, dùng ở sảnh, sự kiện ngoài trời." },
      { title: "Logo ở hai múi đối diện", body: "In logo ở 2 múi đối diện nhau để người xung quanh nhìn thấy dù người cầm quay hướng nào." },
    ],
    faq: [
      faqPrice("Ô dù", "loại dù, số múi in, số màu logo"),
      { q: "Logo in trên dù có bị phai khi gặp mưa không?", a: "In lụa là cách in dù phổ biến vì bám vải tốt. Độ bền tuỳ chất vải và cách in từng mẫu – YALA ghi rõ khi gửi mockup và báo giá." },
      FAQ_PREVIEW,
      FAQ_TIME,
      FAQ_VAT,
    ],
  },
  {
    slug: "mu-non-in-logo",
    name: "Mũ nón in logo",
    title: "Mũ nón in logo, nón lưỡi trai thêu logo cho công ty, sự kiện",
    h1: "Mũ nón in logo",
    description: "Mũ lưỡi trai, nón bucket thêu logo, in logo cho đồng phục công ty, team building, sự kiện. Đặt logo xem mockup ngay, báo giá theo số lượng.",
    lead: "Đi cùng áo đồng phục trong team building, sự kiện ngoài trời. Chọn kiểu mũ, đặt logo xem mockup ngay, gửi một yêu cầu để nhận báo giá theo số lượng.",
    category: "mu-non-ao-mua-o-du",
    sub: "mu-non",
    noun: "mũ nón",
    dip: "dong-phuc",
    methods: [
      { name: "Thêu phẳng", fit: "Logo ít màu", note: "Cách làm logo phổ biến nhất trên mũ – bền, không bong, giặt được." },
      { name: "Thêu nổi 3D", fit: "Logo khối, chữ đậm", note: "Đường thêu có lớp đệm cho logo nổi khối ở mặt trước – hợp mũ snapback, lưỡi trai thể thao." },
      { name: "In", fit: "Logo nhiều màu, chi tiết nhỏ", note: "In đủ màu logo – hợp hình ảnh, chi tiết nhỏ khó thêu." },
    ],
    tips: [
      { title: "Lưỡi trai cho đồng phục", body: "Mũ lưỡi trai đi cùng áo polo, áo thun đồng phục – kiểu dáng quen thuộc, hợp nhiều lứa tuổi." },
      { title: "Bucket cho team building", body: "Nón bucket che nắng bốn phía, hợp hoạt động ngoài trời, du lịch công ty." },
      { title: "Cùng tông với áo", body: "Chọn màu mũ cùng tông áo đồng phục – cả đội lên ảnh đồng bộ hơn." },
      { title: "Logo trước, slogan sau", body: "Logo ở mặt trước; tên sự kiện hoặc slogan thêu thêm ở bên hông, phía sau." },
    ],
    faq: [
      faqPrice("Mũ nón", "kiểu mũ, số vị trí và cách làm logo"),
      { q: "Nên thêu hay in logo lên mũ?", a: "Logo ít màu, muốn bền: thêu – muốn nổi khối thì thêu 3D. Logo nhiều màu, chi tiết nhỏ: in. YALA ghi rõ kỹ thuật phù hợp từng mẫu khi gửi mockup." },
      FAQ_PREVIEW,
      FAQ_TIME,
      FAQ_VAT,
    ],
  },
  {
    slug: "vali-in-logo",
    name: "Vali in logo",
    title: "Vali in logo làm quà tặng doanh nghiệp, vali gắn logo kim loại",
    h1: "Vali in logo",
    description: "Vali gắn logo kim loại, in logo làm quà cho nhân viên, đối tác, khách hàng thân thiết, du lịch công ty. Mockup miễn phí, báo giá theo số lượng.",
    lead: "Quà giá trị cho người nhận quan trọng. Chọn mẫu vali, gửi logo để xem mockup, gửi một yêu cầu để nhận báo giá theo số lượng.",
    category: "vali-du-lich",
    sub: "vali-nhua-pp-pc-abs",
    noun: "vali",
    dip: "tri-an",
    methods: [
      { name: "Gắn logo kim loại", fit: "Vali cao cấp", note: "Logo kim loại gắn lên thân vali – nổi khối, sang, đi cùng vali suốt thời gian dùng." },
      { name: "In UV lên vỏ", fit: "Logo nhiều màu", note: "In thẳng lên vỏ nhựa theo màu logo – hợp vali thiết kế riêng." },
      { name: "Thẻ treo hành lý", fit: "Thêm một chỗ cho logo", note: "Thẻ treo in hoặc khắc logo đi kèm vali – dễ nhận ra hành lý ở băng chuyền." },
    ],
    tips: [
      { title: "Xách tay hay ký gửi", body: "Vali 20 inch thường vừa hành lý xách tay, hợp người hay công tác ngắn ngày. 24–28 inch cho chuyến đi dài, du lịch gia đình." },
      { title: "Vỏ PC, PP hay ABS", body: "PC dẻo, nhẹ, chịu va đập tốt; PP bền, ít trầy; ABS cứng, giá mềm hơn. Hỏi YALA mẫu hợp ngân sách." },
      { title: "Quà cho người nhận quan trọng", body: "Vali hợp quà tri ân khách hàng thân thiết, quà nhân viên xuất sắc, quà chuyến du lịch công ty." },
      { title: "Logo kín đáo trông sang hơn", body: "Logo kim loại nhỏ ở góc vali trông sang hơn logo in to – người nhận dùng cả cho việc riêng." },
    ],
    faq: [
      faqPrice("Vali", "mẫu vali, kích cỡ, cách gắn logo"),
      { q: "Logo gắn lên vali có bền không?", a: "Logo kim loại gắn cố định lên thân vali, đi cùng vali suốt thời gian sử dụng. Cách gắn tuỳ từng mẫu – YALA ghi rõ khi gửi mockup." },
      FAQ_PREVIEW,
      FAQ_TIME,
      FAQ_VAT,
    ],
  },
  {
    slug: "ly-su-in-logo",
    name: "Ly sứ, cốc in logo",
    title: "Ly sứ in logo, cốc quà tặng in logo cho doanh nghiệp",
    h1: "Ly sứ, cốc in logo",
    description: "Ly sứ tráng men, cốc inox, ly tre, ly nhựa sinh học in logo làm quà nhân viên, khách hàng, sự kiện. Đặt logo xem mockup ngay, báo giá theo số lượng.",
    lead: "Món quà có mặt trên bàn làm việc mỗi sáng. Chọn chất liệu, đặt logo xem mockup ngay, gửi một yêu cầu để nhận báo giá theo số lượng.",
    category: "binh-nuoc-ly-coc",
    sub: "ly-coc",
    noun: "ly, cốc",
    dip: "tri-an",
    methods: [
      { name: "In decal nung", fit: "Ly sứ, logo nhiều màu", note: "Logo in decal rồi nung cùng lớp men – bám chắc vào thân ly, giữ đủ màu logo." },
      { name: "In chuyển nhiệt", fit: "Số lượng ít, in tên từng người", note: "In đủ màu, ảnh chi tiết, không cần làm khuôn – hợp đơn ít hoặc mỗi ly một tên." },
      { name: "Khắc laser", fit: "Cốc inox, ly tre", note: "Logo khắc thẳng lên bề mặt, không dùng mực – hợp logo 1 màu, nét đơn giản." },
    ],
    tips: [
      { title: "Sứ cho bàn làm việc, inox cho người hay đi", body: "Ly sứ hợp dùng ở văn phòng, phòng họp. Cốc inox, cốc giữ nhiệt hợp người hay mang theo khi di chuyển." },
      { title: "Chất liệu xanh cho thông điệp bền vững", body: "Ly tre, ly nhựa sinh học từ bã cà phê hợp doanh nghiệp muốn món quà gắn với thông điệp môi trường." },
      { title: "In logo hai mặt", body: "Logo ở cả hai mặt ly để người cầm và người ngồi đối diện đều nhìn thấy – nhất là ly dùng trong phòng họp." },
      { title: "Kèm hộp cho quà đối tác", body: "Ly đựng trong hộp giấy in logo trông chỉn chu khi trao tay. Ghi “cần hộp” trong yêu cầu để YALA báo giá trọn bộ." },
    ],
    faq: [
      faqPrice("Ly sứ, cốc", "chất liệu, cách in"),
      { q: "Logo in trên ly sứ có bị phai khi rửa không?", a: "Ly sứ thường in decal rồi nung cùng lớp men nên bám chắc khi rửa. Độ bền tuỳ cách in từng mẫu – YALA ghi rõ khi gửi mockup và báo giá." },
      FAQ_PREVIEW,
      FAQ_TIME,
      FAQ_VAT,
    ],
  },
  {
    slug: "but-in-logo",
    name: "Bút bi in logo",
    title: "Bút bi in logo làm quà hội nghị, quà doanh nghiệp",
    h1: "Bút bi in logo",
    description: "Bút bi bấm in logo làm quà hội nghị, hội thảo, welcome kit, quà khách hàng. Đặt logo xem mockup ngay, báo giá theo số lượng, xuất hoá đơn VAT.",
    lead: "Món quà nhỏ được dùng nhiều nhất trong văn phòng. Chọn mẫu bút, đặt logo xem mockup ngay, gửi một yêu cầu để nhận báo giá theo số lượng.",
    category: "van-phong-pham",
    sub: "but-viet",
    noun: "bút bi",
    dip: "su-kien",
    methods: [
      { name: "In pad", fit: "Thân bút nhựa, logo 1–2 màu", note: "Cách in bút phổ biến nhất: mực ép lên thân bút qua đệm silicon, in được trên bề mặt cong." },
      { name: "In UV", fit: "Logo nhiều màu", note: "In đủ màu logo lên thân bút – hợp logo chuyển màu, chi tiết nhỏ." },
      { name: "Khắc laser", fit: "Bút thân kim loại", note: "Logo khắc lên thân kim loại, không phai – hợp bút ký làm quà tri ân." },
    ],
    tips: [
      { title: "Bút đi cùng sổ", body: "Bút và sổ tay in cùng logo thành bộ quà hội nghị, welcome kit. Ghi “kèm sổ” trong yêu cầu để YALA báo giá trọn bộ." },
      { title: "Logo ngang, chữ ngắn", body: "Thân bút nhỏ – logo ngang, tên thương hiệu ngắn đọc rõ hơn logo nhiều chi tiết. Có thể in thêm website hoặc hotline." },
      { title: "Màu bút theo màu thương hiệu", body: "Chọn màu thân bút gần màu nhận diện, logo in màu tương phản để nổi rõ." },
      { title: "Phát ở sự kiện: đặt dư", body: "Bút ở quầy check-in, bàn hội thảo hết rất nhanh – đặt dư so với số khách, phần còn lại dùng tiếp ở văn phòng." },
    ],
    faq: [
      faqPrice("Bút bi", "mẫu bút, số màu logo"),
      { q: "In logo lên bút bằng cách nào?", a: "Bút nhựa thường in pad hoặc in UV; bút thân kim loại thường khắc laser. Kỹ thuật phù hợp tuỳ chất liệu từng mẫu – YALA ghi rõ khi gửi mockup." },
      FAQ_PREVIEW,
      FAQ_TIME,
      FAQ_VAT,
    ],
  },
  {
    slug: "ky-niem-chuong-khac-logo",
    name: "Kỷ niệm chương khắc logo",
    title: "Kỷ niệm chương khắc logo theo yêu cầu cho doanh nghiệp",
    h1: "Kỷ niệm chương khắc logo",
    description: "Kỷ niệm chương thủy tinh, inox, gỗ khắc logo và tên người nhận – vinh danh nhân viên, tri ân đối tác, giải chạy. Mockup miễn phí, báo giá theo số lượng.",
    lead: "Ghi nhận một cột mốc bằng thứ được đặt trang trọng trên bàn làm việc. Chọn chất liệu, gửi logo và nội dung khắc – YALA gửi mockup để duyệt rồi báo giá.",
    category: "van-phong-pham",
    sub: "ky-niem-chuong",
    noun: "kỷ niệm chương, quà trưng bày",
    dip: "tri-an",
    methods: [
      { name: "Khắc laser", fit: "Thủy tinh, gỗ, inox", note: "Khắc logo, tên người nhận, nội dung vinh danh lên mặt kỷ niệm chương – nét mảnh, rõ, không phai." },
      { name: "In UV màu", fit: "Logo nhiều màu", note: "In đúng màu logo lên thủy tinh, inox hoặc gỗ – hợp logo, hình ảnh nhiều màu." },
      { name: "Làm dáng riêng", fit: "Giải chạy, giải đấu, sự kiện", note: "Làm theo hình dáng riêng (biểu tượng giải, sản phẩm, linh vật) thay cho mẫu có sẵn." },
    ],
    tips: [
      { title: "Khắc tên từng người", body: "Vinh danh nhân viên xuất sắc, thâm niên: khắc tên, chức danh, năm trên từng chiếc. Gửi danh sách kèm yêu cầu báo giá." },
      { title: "Soát chữ trước khi duyệt", body: "Nội dung đã khắc không sửa được – kiểm tra kỹ tên, chức danh, ngày tháng trên mockup trước khi duyệt sản xuất." },
      { title: "Thủy tinh trang trọng, gỗ gần gũi", body: "Thủy tinh, inox hợp lễ vinh danh, tri ân đối tác. Gỗ hợp quà kỷ niệm mang thông điệp gần gũi hơn." },
      { title: "Đặt trước ngày trao", body: "Kỷ niệm chương khắc tên cần thời gian duyệt nội dung và làm mẫu – gửi yêu cầu sớm trước ngày lễ, ngày giải." },
    ],
    faq: [
      { q: "Làm kỷ niệm chương khắc logo giá bao nhiêu?", a: "Giá tuỳ chất liệu, kích thước, nội dung khắc và số lượng. Bấm “+ Thêm vào báo giá” ở các mẫu muốn so rồi gửi một yêu cầu – YALA {response}." },
      { q: "Mỗi chiếc khắc một tên khác nhau được không?", a: "Được. Gửi danh sách tên, chức danh kèm yêu cầu – YALA dàn nội dung từng chiếc lên mockup để duyệt. Số lượng tối thiểu tuỳ mẫu, YALA báo rõ khi gửi báo giá." },
      FAQ_PREVIEW,
      FAQ_TIME,
      FAQ_VAT,
    ],
  },
  {
    slug: "huy-chuong-in-logo",
    name: "Huy chương in logo",
    title: "Huy chương in logo cho giải chạy, giải đấu, thiết kế riêng",
    h1: "Huy chương in logo",
    description: "Huy chương kim loại thiết kế riêng, in logo cho giải chạy, giải bóng, hội thao công ty; kèm dây đeo in tên giải, ghim cài áo. Báo giá theo số lượng.",
    lead: "Thứ vận động viên giữ lại sau vạch đích. Gửi logo và tên giải – YALA dựng mockup mặt huy chương để duyệt rồi báo giá theo số lượng.",
    category: "van-phong-pham",
    sub: "huy-hieu-huy-chuong",
    noun: "huy chương, huy hiệu",
    dip: "su-kien",
    methods: [
      { name: "Đúc kim loại", fit: "Huy chương dáng riêng", note: "Mặt huy chương đúc theo hình logo, biểu tượng giải – có phần nổi, phần chìm." },
      { name: "Tô màu, in màu", fit: "Logo nhiều màu", note: "Màu logo được tô hoặc in lên mặt huy chương – giữ đúng màu nhận diện của giải." },
      { name: "In dây đeo", fit: "Tên giải, nhà tài trợ", note: "Dây đeo in tên giải, năm, logo nhà tài trợ – thêm một chỗ cho thương hiệu." },
    ],
    tips: [
      { title: "Mặt sau ghi tên giải và năm", body: "Mặt trước là biểu tượng, mặt sau ghi tên giải, cự ly, năm – người nhận nhớ được đó là giải nào." },
      { title: "Nhiều cự ly, một bộ thiết kế", body: "Giải chạy nhiều cự ly: dùng chung một thiết kế, đổi màu hoặc chữ cự ly cho từng hạng mục." },
      { title: "Ghim cài áo cho thành viên", body: "Ghim cài áo, huy hiệu in logo hợp phát cho thành viên CLB, nhân viên mới, khách mời sự kiện." },
      { title: "Chốt thiết kế sớm", body: "Huy chương dáng riêng cần thời gian làm khuôn và làm mẫu – chốt thiết kế, số lượng từng hạng mục sớm trước ngày giải." },
    ],
    faq: [
      { q: "Làm huy chương theo yêu cầu giá bao nhiêu?", a: "Giá tuỳ kích thước, cách làm mặt huy chương, dây đeo và số lượng. Bấm “+ Thêm vào báo giá” ở các mẫu muốn so rồi gửi một yêu cầu – YALA {response}." },
      { q: "Có làm huy chương cho giải nội bộ công ty không?", a: "Có. Gửi logo công ty, tên giải và số lượng từng hạng mục – YALA gửi mockup để duyệt rồi báo giá. Số lượng tối thiểu tuỳ mẫu, YALA báo rõ khi gửi báo giá." },
      FAQ_PREVIEW,
      FAQ_TIME,
      FAQ_VAT,
    ],
  },
  {
    slug: "non-bao-hiem-in-logo",
    name: "Nón bảo hiểm in logo",
    title: "Nón bảo hiểm in logo làm quà tặng, quà khuyến mãi",
    h1: "Nón bảo hiểm in logo",
    description: "Nón bảo hiểm nửa đầu, 3/4 in logo làm quà khách hàng, quà khuyến mãi, đồng phục nhân viên đi đường. Đặt logo xem mockup ngay, báo giá theo số lượng.",
    lead: "Quà được đội mỗi ngày trên đường – logo đi cùng người nhận khắp phố. Chọn kiểu nón, đặt logo xem mockup ngay, gửi một yêu cầu để nhận báo giá theo số lượng.",
    category: "mu-non-ao-mua-o-du",
    sub: "non-bao-hiem",
    noun: "nón bảo hiểm",
    dip: "su-kien",
    methods: [
      { name: "In decal dán", fit: "Logo nhiều màu", note: "Logo in decal rồi dán lên vỏ nón – giữ đủ màu và chi tiết của logo." },
      { name: "In lụa, in pad", fit: "Logo 1–2 màu, số lượng lớn", note: "Mực in thẳng lên vỏ nón, màu đều trên cả lô." },
      { name: "In nhiều vị trí", fit: "Thêm chỗ cho thương hiệu", note: "Logo hai bên hông, slogan hoặc hotline phía sau – nhìn thấy từ nhiều hướng." },
    ],
    tips: [
      { title: "Hỏi tem hợp quy", body: "Nón bảo hiểm lưu hành ở Việt Nam cần tem hợp quy CR. Hỏi YALA thông tin tem của mẫu trước khi đặt – người nhận yên tâm đội thật." },
      { title: "Nửa đầu cho phố, 3/4 cho đường dài", body: "Nón nửa đầu gọn nhẹ, hợp đi trong phố. Nón 3/4 che kín hơn, hợp nhân viên giao hàng, kỹ thuật hay đi đường dài." },
      { title: "Màu nón theo màu thương hiệu", body: "Vỏ nón trùng màu nhận diện, logo màu tương phản – nhận ra thương hiệu từ xa." },
      { title: "Logo gọn trên mặt cong", body: "Vỏ nón cong nên logo ngang, gọn đọc rõ hơn. Có thể in thêm hotline, website phía sau." },
    ],
    faq: [
      faqPrice("Nón bảo hiểm", "kiểu nón, số vị trí in, số màu logo"),
      { q: "Nón bảo hiểm in logo có tem hợp quy không?", a: "Tuỳ mẫu. YALA ghi rõ thông tin chất lượng, tem hợp quy của từng mẫu khi gửi báo giá – nên hỏi trước nếu nón dùng cho nhân viên đi đường thường xuyên." },
      FAQ_PREVIEW,
      FAQ_TIME,
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
