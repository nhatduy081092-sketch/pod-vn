import type { DesignLayer, TextLayer } from "./design";
import type { TextPreset } from "./design-presets";

/**
 * Mẫu in sẵn theo chủ đề (câu chữ tự viết – không dùng slogan/nhân vật/thương hiệu của bên khác).
 * Khách chọn mẫu → chọn phôi → mở editor với mẫu gắn sẵn, sửa chữ hoặc đặt luôn.
 * Toạ độ theo vùng gốc 300×300 mm (giống TEXT_PRESETS).
 */
type T = Omit<TextLayer, "id" | "w" | "h" | "rotation" | "opacity" | "align" | "lineHeight" | "type"> & Partial<Pick<TextLayer, "align" | "lineHeight" | "rotation">>;
const t = (p: T): DesignLayer => ({ type: "text", id: "", w: 10, h: 10, rotation: 0, opacity: 1, align: "center", lineHeight: 1.1, ...p });
const P = (id: string, name: string, category: string, layers: DesignLayer[]): TextPreset => ({ id: `mau-${id}`, name, category, data: { srcW: 300, srcH: 300, bg: null, layers } });

const INK = "#1d1d1f";
const RED = "#e11d48";
const ORANGE = "#f97316";
const BLUE = "#1c4d99";
const GREEN = "#16a34a";
const PINK = "#ec4899";
const PURPLE = "#7c3aed";
const YELLOW = "#facc15";

/** Thứ tự tab chủ đề trên trang Mẫu in sẵn */
export const READY_THEMES = ["Hài hước đời thường", "Cặp đôi", "Nghề nghiệp", "Thể thao", "Cà phê & ăn uống", "Việt Nam", "Gia đình"] as const;

export const SLOGAN_PRESETS: TextPreset[] = [
  /* ---------- Hài hước đời thường ---------- */
  P("met-nhung-vui", "Mệt nhưng vui", "Hài hước đời thường", [
    t({ text: "MỆT", font: "Anton", fontSize: 120, color: INK, x: 150, y: 110 }),
    t({ text: "nhưng vẫn vui", font: "Pacifico", fontSize: 40, color: ORANGE, x: 150, y: 200, rotation: -4 }),
  ]),
  P("luong-ve", "Lương về rồi đi", "Hài hước đời thường", [
    t({ text: "LƯƠNG VỀ", font: "Anton", fontSize: 72, color: GREEN, x: 150, y: 110 }),
    t({ text: "RỒI ĐI", font: "Anton", fontSize: 72, color: INK, x: 150, y: 190 }),
    t({ text: "trong 3 ngày", font: "Dancing Script", fontSize: 30, color: INK, bold: true, x: 150, y: 250 }),
  ]),
  P("ngu-them-5p", "Ngủ thêm 5 phút", "Hài hước đời thường", [
    t({ text: "5 PHÚT", font: "Anton", fontSize: 96, color: PURPLE, x: 150, y: 125 }),
    t({ text: "NỮA THÔI MÀ…", font: "Oswald", fontSize: 32, color: INK, bold: true, x: 150, y: 210, letterSpacing: 0.12 }),
  ]),
  P("dang-co-gang", "Đang cố gắng", "Hài hước đời thường", [
    t({ text: "ĐANG", font: "Montserrat", fontSize: 34, color: INK, bold: true, x: 150, y: 90, letterSpacing: 0.4 }),
    t({ text: "CỐ GẮNG", font: "Anton", fontSize: 84, color: ORANGE, x: 150, y: 160, stroke: { color: INK, width: 2 } }),
    t({ text: "(đừng hỏi cố gắng gì)", font: "Nunito", fontSize: 22, color: INK, italic: true, x: 150, y: 230 }),
  ]),
  P("no-drama", "Không drama", "Hài hước đời thường", [
    t({ text: "KHÔNG", font: "Oswald", fontSize: 50, color: INK, bold: true, x: 150, y: 95, letterSpacing: 0.3 }),
    t({ text: "DRAMA", font: "Anton", fontSize: 110, color: RED, x: 150, y: 180 }),
    t({ text: "chỉ có trà sữa", font: "Pacifico", fontSize: 28, color: INK, x: 150, y: 255 }),
  ]),
  P("introvert", "Hướng nội có điều kiện", "Hài hước đời thường", [
    t({ text: "Hướng nội", font: "Lobster", fontSize: 64, color: BLUE, x: 150, y: 115 }),
    t({ text: "TRỪ KHI CÓ ĐỒ ĂN", font: "Oswald", fontSize: 32, color: INK, bold: true, x: 150, y: 195, letterSpacing: 0.08 }),
  ]),
  P("cuoi-tuan", "Chờ cuối tuần", "Hài hước đời thường", [
    t({ text: "THỨ 2 → THỨ 6", font: "Oswald", fontSize: 34, color: INK, bold: true, x: 150, y: 90, letterSpacing: 0.1 }),
    t({ text: "chỉ là", font: "Dancing Script", fontSize: 38, color: INK, bold: true, x: 150, y: 140 }),
    t({ text: "CHỜ CUỐI TUẦN", font: "Anton", fontSize: 50, color: PINK, x: 150, y: 205 }),
  ]),
  P("be-vui", "Vui là chính", "Hài hước đời thường", [
    t({ text: "• VUI LÀ CHÍNH • ĂN LÀ CHỦ YẾU ", font: "Oswald", fontSize: 26, color: INK, bold: true, x: 150, y: 150, curve: 100, letterSpacing: 0.06 }),
    t({ text: ":)", font: "Anton", fontSize: 80, color: ORANGE, bold: true, x: 150, y: 150 }),
  ]),

  /* ---------- Cặp đôi ---------- */
  P("couple-nguoi-yeu", "Người yêu của …", "Cặp đôi", [
    t({ text: "Người yêu của", font: "Dancing Script", fontSize: 44, color: INK, bold: true, x: 150, y: 115 }),
    t({ text: "TÊN ẤY", font: "Anton", fontSize: 90, color: RED, x: 150, y: 190 }),
  ]),
  P("couple-mot-nua", "Một nửa – Nửa kia", "Cặp đôi", [
    t({ text: "MỘT NỬA", font: "Anton", fontSize: 82, color: INK, x: 150, y: 125 }),
    t({ text: "(nửa kia đang đứng cạnh)", font: "Nunito", fontSize: 20, color: RED, bold: true, x: 150, y: 195 }),
  ]),
  P("couple-sep", "Sếp nhà mình", "Cặp đôi", [
    t({ text: "SẾP", font: "Anton", fontSize: 130, color: INK, x: 150, y: 120 }),
    t({ text: "ở nhà là vợ", font: "Pacifico", fontSize: 36, color: PINK, x: 150, y: 215 }),
  ]),
  P("couple-since", "Yêu từ năm …", "Cặp đôi", [
    t({ text: "♥", font: "Nunito", fontSize: 90, color: RED, bold: true, x: 150, y: 100 }),
    t({ text: "YÊU TỪ", font: "Oswald", fontSize: 36, color: INK, bold: true, x: 150, y: 170, letterSpacing: 0.3 }),
    t({ text: "2026", font: "Anton", fontSize: 70, color: INK, x: 150, y: 235 }),
  ]),

  /* ---------- Nghề nghiệp ---------- */
  P("job-dev", "Lập trình viên", "Nghề nghiệp", [
    t({ text: "Chạy được", font: "Montserrat", fontSize: 40, color: GREEN, bold: true, x: 150, y: 105 }),
    t({ text: "ĐỪNG SỬA", font: "Anton", fontSize: 90, color: INK, x: 150, y: 180 }),
    t({ text: "// lập trình viên", font: "Montserrat", fontSize: 18, color: INK, x: 150, y: 240, letterSpacing: 0.1 }),
  ]),
  P("job-ke-toan", "Kế toán", "Nghề nghiệp", [
    t({ text: "KẾ TOÁN", font: "Anton", fontSize: 82, color: BLUE, x: 150, y: 115 }),
    t({ text: "Tiền không phải của tôi\nnhưng tôi giữ kỹ lắm", font: "Nunito", fontSize: 22, color: INK, bold: true, x: 150, y: 205, lineHeight: 1.25 }),
  ]),
  P("job-giao-vien", "Giáo viên", "Nghề nghiệp", [
    t({ text: "Cô giáo", font: "Lobster", fontSize: 70, color: PINK, x: 150, y: 115 }),
    t({ text: "NÓI 1 LẦN – NHẮC 10 LẦN", font: "Oswald", fontSize: 24, color: INK, bold: true, x: 150, y: 200, letterSpacing: 0.05 }),
  ]),
  P("job-y-ta", "Y tá / Điều dưỡng", "Nghề nghiệp", [
    t({ text: "+", font: "Anton", fontSize: 90, color: RED, x: 150, y: 90 }),
    t({ text: "ĐIỀU DƯỠNG", font: "Anton", fontSize: 60, color: INK, x: 150, y: 170 }),
    t({ text: "trực đêm vẫn cười", font: "Pacifico", fontSize: 28, color: RED, x: 150, y: 235 }),
  ]),
  P("job-shipper", "Shipper", "Nghề nghiệp", [
    t({ text: "SHIPPER", font: "Anton", fontSize: 84, color: ORANGE, x: 150, y: 120, stroke: { color: INK, width: 2 } }),
    t({ text: "GIAO HÀNG – GIAO CẢ NIỀM VUI", font: "Oswald", fontSize: 20, color: INK, bold: true, x: 150, y: 200, letterSpacing: 0.05 }),
  ]),

  /* ---------- Thể thao ---------- */
  P("sport-pickleball", "Pickleball", "Thể thao", [
    t({ text: "PICKLEBALL", font: "Anton", fontSize: 62, color: GREEN, x: 150, y: 120, curve: 18 }),
    t({ text: "sáng đánh – chiều khoe", font: "Dancing Script", fontSize: 28, color: INK, bold: true, x: 150, y: 200 }),
  ]),
  P("sport-cau-long", "Cầu lông", "Thể thao", [
    t({ text: "CẦU LÔNG", font: "Anton", fontSize: 74, color: BLUE, x: 150, y: 120 }),
    t({ text: "ĐÁNH VÌ ĐAM MÊ · THUA VÌ ĐỒNG ĐỘI", font: "Oswald", fontSize: 18, color: INK, bold: true, x: 150, y: 190, letterSpacing: 0.05 }),
  ]),
  P("sport-chay-bo", "Chạy bộ", "Thể thao", [
    t({ text: "Chạy để", font: "Pacifico", fontSize: 44, color: ORANGE, x: 150, y: 105 }),
    t({ text: "ĂN THÊM", font: "Anton", fontSize: 86, color: INK, x: 150, y: 185 }),
  ]),
  P("sport-gym", "Gym", "Thể thao", [
    t({ text: "HÔM NAY", font: "Oswald", fontSize: 36, color: INK, bold: true, x: 150, y: 90, letterSpacing: 0.3 }),
    t({ text: "TẬP CHÂN", font: "Anton", fontSize: 76, color: RED, x: 150, y: 160 }),
    t({ text: "mai đi cầu thang bằng ý chí", font: "Nunito", fontSize: 18, color: INK, bold: true, x: 150, y: 230 }),
  ]),
  P("sport-bong-da", "Bóng đá phủi", "Thể thao", [
    t({ text: "ĐÁ PHỦI", font: "Anton", fontSize: 86, color: INK, x: 150, y: 125, stroke: { color: YELLOW, width: 2.5 } }),
    t({ text: "THẮNG THÌ NHẬU · THUA CŨNG NHẬU", font: "Oswald", fontSize: 18, color: INK, bold: true, x: 150, y: 200, letterSpacing: 0.05 }),
  ]),

  /* ---------- Cà phê & ăn uống ---------- */
  P("food-cafe", "Cà phê trước đã", "Cà phê & ăn uống", [
    t({ text: "Cà phê", font: "Lobster", fontSize: 76, color: "#7c4a1e", x: 150, y: 115 }),
    t({ text: "TRƯỚC ĐÃ, NÓI SAU", font: "Oswald", fontSize: 28, color: INK, bold: true, x: 150, y: 195, letterSpacing: 0.08 }),
  ]),
  P("food-tra-sua", "Trà sữa full topping", "Cà phê & ăn uống", [
    t({ text: "FULL TOPPING", font: "Anton", fontSize: 52, color: PINK, x: 150, y: 120, curve: 16 }),
    t({ text: "ít đường thôi cho healthy", font: "Dancing Script", fontSize: 26, color: INK, bold: true, x: 150, y: 200 }),
  ]),
  P("food-bun-dau", "Hội ăn uống", "Cà phê & ăn uống", [
    t({ text: "HỘI", font: "Oswald", fontSize: 40, color: INK, bold: true, x: 150, y: 90, letterSpacing: 0.5 }),
    t({ text: "ĂN UỐNG", font: "Anton", fontSize: 86, color: ORANGE, x: 150, y: 165 }),
    t({ text: "giảm cân từ thứ Hai (tuần sau)", font: "Nunito", fontSize: 17, color: INK, bold: true, x: 150, y: 235 }),
  ]),

  /* ---------- Việt Nam ---------- */
  P("vn-sai-gon", "Sài Gòn", "Việt Nam", [
    t({ text: "SÀI GÒN", font: "Anton", fontSize: 88, color: INK, x: 150, y: 125 }),
    t({ text: "nắng – mưa – vẫn thương", font: "Dancing Script", fontSize: 28, color: RED, bold: true, x: 150, y: 200 }),
  ]),
  P("vn-ha-noi", "Hà Nội", "Việt Nam", [
    t({ text: "Hà Nội", font: "Playfair Display", fontSize: 80, color: INK, bold: true, italic: true, x: 150, y: 120 }),
    t({ text: "MÙA THU · CỐM · TRÀ ĐÁ", font: "Oswald", fontSize: 20, color: GREEN, bold: true, x: 150, y: 195, letterSpacing: 0.1 }),
  ]),
  P("vn-yeu-nuoc", "Việt Nam ơi", "Việt Nam", [
    t({ text: "★", font: "Nunito", fontSize: 80, color: YELLOW, bold: true, x: 150, y: 90, stroke: { color: RED, width: 2 } }),
    t({ text: "VIỆT NAM", font: "Anton", fontSize: 78, color: RED, x: 150, y: 170 }),
    t({ text: "TỰ HÀO LẮM", font: "Oswald", fontSize: 30, color: INK, bold: true, x: 150, y: 235, letterSpacing: 0.3 }),
  ]),

  /* ---------- Gia đình ---------- */
  P("fam-bo", "Bố – Siêu nhân", "Gia đình", [
    t({ text: "BỐ", font: "Anton", fontSize: 130, color: BLUE, x: 150, y: 115 }),
    t({ text: "siêu nhân không cần áo choàng", font: "Nunito", fontSize: 18, color: INK, bold: true, x: 150, y: 210 }),
  ]),
  P("fam-me", "Mẹ – Nóc nhà", "Gia đình", [
    t({ text: "MẸ", font: "Anton", fontSize: 130, color: PINK, x: 150, y: 115 }),
    t({ text: "nóc nhà – nói là nghe", font: "Pacifico", fontSize: 24, color: INK, x: 150, y: 210 }),
  ]),
  P("fam-con", "Con của bố mẹ", "Gia đình", [
    t({ text: "Hàng hiếm", font: "Lobster", fontSize: 60, color: ORANGE, x: 150, y: 115 }),
    t({ text: "CỦA BỐ MẸ", font: "Anton", fontSize: 60, color: INK, x: 150, y: 190 }),
  ]),
];
