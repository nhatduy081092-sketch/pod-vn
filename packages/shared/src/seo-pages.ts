import type { GarmentKey } from "./ready-designs";
import type { SegmentKey } from "./segments";

/**
 * Trang SEO theo 2 công thức (docs/ban-giao/tai-lieu/yala-seo-2-cong-thuc.md):
 * 1) "Mẫu áo [nhóm] [năm]" – lưới mẫu sửa được ngay (mở Studio), bảng giá dạng chữ, in tên từng người, FAQ.
 * 2) Công cụ + tài nguyên miễn phí – thiết kế áo lớp online, bảng size, slogan áo lớp, tên đội bóng.
 * Câu chữ chỉ nói điều website đang làm được; không nêu số liệu/thời gian chưa kiểm chứng.
 */

export type DesignHub = {
  slug: string;
  /** tên ngắn trên menu, liên kết */
  name: string;
  /** cụm từ khoá chính – dùng trong title/H1: "[số] mẫu áo lớp đẹp [năm]" */
  keyword: string;
  /** tiêu đề/H1 riêng thay mẫu mặc định; {n} = số mẫu, {year} = năm */
  titleTemplate?: string;
  /** hiện khối "Cùng bộ nhận diện" – merchandise in logo (YALA là hệ thống merchandise, đồng phục là cửa vào) */
  showMerch?: boolean;
  intro: string;
  /** bộ mẫu (DESIGN_COLLECTIONS) lấy vào trang – bộ đầu là mẫu đồng phục có ô tên/số */
  collections: string[];
  segment: SegmentKey;
  garments: GarmentKey[];
  tips: { title: string; body: string }[];
  faq: { q: string; a: string }[];
};

const FAQ_NAMES = {
  q: "In tên, số khác nhau trên từng áo có tính thêm phí không?",
  a: "Không. Mẫu có ô tên/số: mỗi áo in đúng tên, số của từng người, cùng giá với áo in chung. Bạn xem trước từng áo trước khi đặt.",
};
const FAQ_LINK = {
  q: "Làm sao thu size của cả nhóm?",
  a: "Mở mẫu, sửa xong bấm Hoàn tất → “Tạo link gom đơn nhóm”. Gửi link vào nhóm chat – mỗi người tự ghi tên, số, size; trưởng nhóm thấy danh sách và đặt một đơn chung.",
};
const FAQ_MIN = {
  q: "Đặt tối thiểu bao nhiêu áo?",
  a: "Đơn nhóm từ 10 sản phẩm. Ít hơn vẫn đặt được, tính như mua lẻ – vẫn in tên/số từng người.",
};
const FAQ_EDIT = {
  q: "Mẫu trên trang có sửa được không?",
  a: "Được. Bấm vào mẫu để mở YALA Studio: sửa chữ, đổi font, đổi màu áo, thêm logo, thêm mặt sau. Mẫu chỉ là điểm bắt đầu.",
};

export const DESIGN_HUBS: DesignHub[] = [
  {
    slug: "dong-phuc-ao-thun",
    name: "Đồng phục áo thun",
    keyword: "đồng phục áo thun",
    titleTemplate: "Đồng phục áo thun in theo yêu cầu {year} – tự thiết kế, xem mockup ngay",
    intro:
      "Tự chỉnh logo, chữ, màu áo và thấy ngay mockup trên áo thật trước khi đặt in. In áo đồng phục, áo thun đồng phục cho công ty, lớp, nhóm, team building: in tên – số từng người, giá theo số lượng. Đơn nhóm từ 10 áo, số lượng ít vẫn đặt được.",
    collections: ["dong-phuc-cong-ty", "team-building", "ao-lop", "doi-bong", "toi-gian"],
    segment: "doanh-nghiep",
    showMerch: true,
    garments: ["tshirt", "longsleeve", "hoodie", "sweater"],
    tips: [
      { title: "Thấy áo thật trước khi đặt", body: "Mỗi thay đổi – logo, chữ, màu áo, vị trí in – hiện ngay trên mockup áo thật, xem được cả trên người mẫu. Cả nhóm duyệt cùng một bản trước khi in, không phải chờ bản vẽ qua lại." },
      { title: "Số lượng ít vẫn in được", body: "Đơn nhóm từ 10 áo, ít hơn vẫn đặt được (tính như mua lẻ). Không cần đặt hàng trăm áo như khi may đồng phục theo mẫu riêng." },
      { title: "In trên áo có sẵn, không may đo", body: "YALA in lên áo thun YALA Everyday có sẵn 6 màu: trắng, đen, kem, xám, navy, hồng – nên xem được mockup ngay và giao nhanh hơn may mới. Cần polo, sơ mi hoặc may theo mẫu riêng: gửi yêu cầu báo giá." },
      { title: "Logo ngực trái hay chữ to giữa ngực", body: "Đồng phục mặc hằng ngày hợp logo nhỏ ngực trái; áo sự kiện, team building hợp tên to giữa ngực để lên ảnh rõ." },
      { title: "Tên – số riêng từng người", body: "Một thiết kế chung, mỗi áo in đúng tên hoặc số của từng người, cùng giá với áo in chung. Thu tên, size cả nhóm bằng một link hoặc file Excel mẫu." },
    ],
    faq: [
      FAQ_MIN,
      { q: "YALA có may đồng phục theo số đo, theo mẫu riêng không?", a: "Đặt online là in trên áo thun có sẵn (YALA Everyday). Đồng phục polo, sơ mi hoặc may theo mẫu riêng: gửi yêu cầu báo giá ở trang Doanh nghiệp, YALA tư vấn chất liệu và số lượng." },
      FAQ_NAMES,
      FAQ_LINK,
      FAQ_EDIT,
    ],
  },
  {
    slug: "mau-ao-lop",
    name: "Mẫu áo lớp",
    keyword: "mẫu áo thun lớp đẹp",
    intro: "Mẫu áo thun lớp, áo phông lớp, áo kỷ yếu, áo họp lớp có sẵn tên lớp, niên khoá và ô tên từng bạn. Bấm vào mẫu để sửa chữ, đổi màu áo – cả lớp tự ghi size qua một link.",
    collections: ["ao-lop", "hoc-sinh-sinh-vien", "20-11", "ban-than"],
    segment: "hoi-nhom",
    garments: ["tshirt", "hoodie", "sweater"],
    tips: [
      { title: "Nội dung nên có", body: "Tên lớp + niên khoá ở mặt trước là đủ nhận ra; câu khẩu hiệu ngắn (dưới 6 chữ) dễ đọc hơn câu dài. Mặt sau hợp để in tên hoặc biệt danh từng bạn." },
      { title: "Chọn màu áo", body: "Lớp đông người nên chọn màu trung tính như trắng, kem, navy – hợp nhiều dáng người và dễ chụp ảnh. Áo tối nên dùng chữ sáng; YALA Studio tự cảnh báo khi màu chữ gần trùng màu áo." },
      { title: "Thu size không cần nhắn từng người", body: "Tạo link gom đơn nhóm từ thiết kế: mỗi bạn tự ghi tên và chọn size, lớp trưởng xem danh sách đếm sẵn theo size rồi đặt một đơn." },
      { title: "Đặt sớm trước sự kiện", body: "Bế giảng, 20/11, chụp kỷ yếu thường dồn đơn – đặt sớm để có thời gian cả lớp góp ý mẫu và sửa tên." },
    ],
    faq: [FAQ_EDIT, FAQ_NAMES, FAQ_LINK, FAQ_MIN],
  },
  {
    slug: "mau-ao-team-building",
    name: "Mẫu áo team building",
    keyword: "mẫu áo đồng phục team building",
    intro: "Mẫu áo đồng phục team building, du lịch công ty, year-end party – sửa tên công ty, khẩu hiệu đội, chia màu theo đội và in tên từng người trong cùng một đơn.",
    collections: ["team-building", "dong-phuc-cong-ty", "viet-nam-du-lich", "mua-he-bien"],
    segment: "su-kien",
    garments: ["tshirt", "hoodie", "tote"],
    tips: [
      { title: "Chia đội bằng màu áo", body: "Giữ một thiết kế, đổi màu áo cho từng đội (ví dụ navy, xám, hồng). Đổi màu ngay trên mockup trong Studio để xem trước cả bộ." },
      { title: "Khẩu hiệu đội ngắn, chữ to", body: "Áo team building hay xuất hiện trong ảnh nhóm chụp xa – chữ to, ít chữ, tương phản mạnh sẽ đọc rõ hơn." },
      { title: "Thu size cả công ty", body: "HR hoặc ban tổ chức gửi một link gom đơn: mọi người tự ghi tên, size; danh sách tự đếm theo size để đặt hàng." },
      { title: "Chuyến đi vùng lạnh", body: "Đi Đà Lạt, Sa Pa nên cân nhắc hoodie hoặc sweater cùng thiết kế; túi tote in logo làm quà tham dự." },
    ],
    faq: [FAQ_EDIT, { q: "Mỗi đội một màu có đặt chung một đơn được không?", a: "Được. Chọn màu áo theo từng đội khi đặt hoặc ghi số lượng từng màu trong yêu cầu báo giá – vẫn là một đơn, giao một lần." }, FAQ_LINK, { q: "Công ty cần hoá đơn VAT?", a: "Ghi thông tin xuất hoá đơn (tên công ty, mã số thuế, email) vào ghi chú đơn hàng hoặc form báo giá – YALA xác nhận khi chốt đơn." }],
  },
  {
    slug: "mau-ao-doi-bong",
    name: "Mẫu áo đội bóng, CLB",
    keyword: "mẫu áo đội bóng, áo CLB đẹp",
    intro: "Mẫu áo đội bóng phong trào, CLB chạy bộ, cầu lông, pickleball có sẵn ô tên và số áo – mỗi thành viên một tên, một số, cả đội tự ghi size qua một link.",
    collections: ["doi-bong", "chay-bo", "pickleball"],
    segment: "the-thao",
    garments: ["tshirt", "longsleeve", "hoodie"],
    tips: [
      { title: "Số áo dễ đọc từ xa", body: "Số lớn, một màu, tương phản mạnh với màu áo. Tên in hoa ngắn gọn (biệt danh cũng được) đặt dưới số." },
      { title: "Không trùng số", body: "Khi gom đơn qua link, đội trưởng thấy toàn bộ danh sách tên – số – size trước khi chốt, dễ phát hiện số trùng." },
      { title: "Áo tập, áo cổ động và áo thi đấu", body: "Áo cotton YALA Everyday hợp làm áo tập nhẹ, áo CLB, áo cổ động viên. Áo thi đấu vải thun lạnh/mè: gửi yêu cầu báo giá theo mẫu." },
      { title: "Màu sân nhà – sân khách", body: "Đổi màu áo ngay trên mockup để chọn cặp màu cho hai bộ; cùng thiết kế, khác màu vẫn đặt chung một đơn." },
    ],
    faq: [FAQ_NAMES, FAQ_LINK, { q: "Áo trên web có mặc đá bóng được không?", a: "Dòng YALA Everyday là áo cotton – hợp làm áo tập nhẹ, áo CLB, áo cổ động viên. Áo thi đấu vải thun lạnh/mè: gửi yêu cầu báo giá, YALA tư vấn chất liệu." }, FAQ_MIN],
  },
  {
    slug: "mau-dong-phuc-cong-ty",
    name: "Mẫu đồng phục công ty",
    keyword: "mẫu áo đồng phục công ty đẹp",
    intro: "Mẫu áo đồng phục công ty, áo đồng phục văn phòng: tên công ty ngực trái, phòng ban, tên nhân viên – sửa theo nhận diện thương hiệu, xem mockup ngay và đặt theo danh sách nhân viên.",
    collections: ["dong-phuc-cong-ty", "team-building", "nghe-nghiep", "toi-gian"],
    segment: "doanh-nghiep",
    showMerch: true,
    garments: ["tshirt", "hoodie", "sweater", "tote"],
    tips: [
      { title: "Logo ngực trái hay giữa ngực", body: "Áo mặc hằng ngày thường in logo nhỏ ở ngực trái, gọn và lịch sự; áo sự kiện hợp tên công ty lớn giữa ngực để lên ảnh rõ." },
      { title: "Đúng màu nhận diện", body: "Tải logo PNG nền trong suốt, nhập mã màu thương hiệu trong Studio; chọn màu áo trung tính để logo nổi bật." },
      { title: "Tên nhân viên trên áo", body: "Ô tên giúp khách hàng gọi đúng tên nhân viên – mỗi áo in một tên, đặt theo danh sách trong cùng một đơn." },
      { title: "Hoá đơn và giao nhiều chi nhánh", body: "Ghi thông tin xuất hoá đơn trong ghi chú hoặc form báo giá; cần chia giao nhiều nơi hãy nêu trong yêu cầu báo giá." },
    ],
    faq: [FAQ_EDIT, FAQ_NAMES, { q: "Công ty cần hoá đơn VAT?", a: "Ghi thông tin xuất hoá đơn (tên công ty, mã số thuế, email) vào ghi chú đơn hàng hoặc form báo giá – YALA xác nhận khi chốt đơn." }, FAQ_MIN],
  },
];

export const findDesignHub = (slug: string) => DESIGN_HUBS.find((h) => h.slug === slug);

/* ---------- Kho câu chữ: slogan áo lớp, tên đội (YALA tự viết) ---------- */
export type PhraseGroup = { title: string; items: string[] };

export const CLASS_SLOGANS: PhraseGroup[] = [
  {
    title: "Áo lớp cấp 3",
    items: [
      "Một thời để nhớ",
      "Thanh xuân có nhau",
      "Ba năm một nhà",
      "Lớp mình là số một",
      "Học hết sức, chơi hết mình",
      "Cùng nhau lớn lên",
      "Ngồi cùng bàn, nhớ cả đời",
      "Chúng ta của năm ấy",
      "Không quậy không phải lớp mình",
      "Đi đâu cũng nhớ lớp",
      "Tuổi mười bảy rực rỡ",
      "Đoàn kết là sức mạnh",
    ],
  },
  {
    title: "Kỷ yếu – ra trường",
    items: [
      "Hẹn gặp lại trên đỉnh vinh quang",
      "Tạm biệt nhé, mái trường",
      "Ra trường rồi vẫn là một nhà",
      "Thanh xuân này không hối tiếc",
      "Mỗi người một hướng, chung một kỷ niệm",
      "Ký tên lên tuổi trẻ",
      "Lưu bút cuối cùng",
      "Khép lại để bắt đầu",
      "Mai này lớn rồi, nhớ về đây",
      "Một chương đẹp nhất",
    ],
  },
  {
    title: "Họp lớp",
    items: [
      "Mười năm gặp lại",
      "Vẫn là lớp mình ngày ấy",
      "Già rồi vẫn quậy",
      "Họp lớp không hỏi lương",
      "Tóc có thể bạc, lớp vẫn xanh",
      "Ngày xưa ngồi bàn cuối",
      "Gặp lại là vui",
      "Lớp cũ, tình chưa cũ",
    ],
  },
  {
    title: "Sinh viên",
    items: [
      "Qua môn là được",
      "Ôn thi bằng niềm tin",
      "Deadline là động lực",
      "Sinh viên năm cuối, bình tĩnh",
      "Giảng đường có nhau",
      "Học vì tương lai, chơi vì hiện tại",
      "Một lớp, nhiều ước mơ",
      "Tốt nghiệp đúng hạn",
    ],
  },
  {
    title: "Tri ân thầy cô",
    items: [
      "Cảm ơn thầy cô",
      "Nhớ ơn người lái đò",
      "Lớp mình kính tặng thầy cô",
      "Thầy cô là ngọn đèn",
      "Một chữ cũng là thầy",
    ],
  },
];

export const TEAM_NAMES: PhraseGroup[] = [
  {
    title: "Đội bóng phong trào",
    items: ["FC Anh Em", "FC Văn Phòng", "FC Chủ Nhật", "FC Hàng Xóm", "FC Đồng Hương", "FC Một Nhà", "FC Không Bỏ Cuộc", "FC Sân Nhà", "FC Sáng Thứ Bảy", "United Phố Cũ", "Lão Tướng FC", "FC Tuổi Trẻ"],
  },
  {
    title: "CLB chạy bộ",
    items: ["Run Club Sáng Sớm", "Chạy Cùng Nhau", "Về Đích Là Vui", "Bình Minh Runners", "Chạy Vì Sức Khoẻ", "Đường Dài Club", "Bước Chân Xanh", "5K Mỗi Sáng"],
  },
  {
    title: "Cầu lông – pickleball",
    items: ["Badminton Club", "Cầu Lông Giờ Vàng", "Sân 3 Club", "Pickle Anh Em", "Đánh Đôi Club", "Pickle Sáng Sớm", "Vợt Vui Vẻ", "Smash Club"],
  },
  {
    title: "Đội công ty – team building",
    items: ["Team Kinh Doanh", "Biệt Đội Marketing", "Team Kỹ Thuật", "Đội Hậu Cần", "Chiến Binh Phòng Họp", "Một Team Một Giấc Mơ", "Team Về Đích", "Đội Không Ngủ Gật", "Năng Lượng Xanh", "Đồng Đội 2026"],
  },
];
