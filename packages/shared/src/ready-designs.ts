import type { DesignLayer, DesignTemplateData, TextLayer } from "./design";
import { luminance } from "./showcase";

/**
 * Thiết kế có sẵn theo chủ đề ("Mẫu có sẵn"): khách chưa có ý tưởng chọn mẫu -> mở YALA Studio với mẫu đã đặt sẵn
 * trên phôi YALA Everyday -> sửa chữ (tuỳ thích) -> đặt hàng. Toàn bộ câu chữ do YALA tự viết (không dùng câu/hình
 * có bản quyền, không logo thương hiệu). Toạ độ theo vùng in ngực áo 300×380 mm, (x, y) = tâm lớp.
 */

export type GarmentKey = "tshirt" | "longsleeve" | "sweater" | "hoodie" | "tote";
export type ColorKey = "trang" | "den" | "kem" | "xam" | "navy";

/** Màu phôi (khớp phân loại màu của sản phẩm YALA Everyday) */
export const BASIC_COLORS: Record<ColorKey, { name: string; hex: string; dark: boolean }> = {
  trang: { name: "Trắng", hex: "#f7f6f2", dark: false },
  den: { name: "Đen", hex: "#1f1f22", dark: true },
  kem: { name: "Kem", hex: "#ece2cf", dark: false },
  xam: { name: "Xám", hex: "#a7a9ad", dark: false },
  navy: { name: "Navy", hex: "#233049", dark: true },
};

/** Phôi -> slug sản phẩm YALA Everyday (tạo tự động ở API: starter-catalog) */
export const GARMENT_PRODUCT: Record<GarmentKey, { slug: string; label: string }> = {
  tshirt: { slug: "ao-thun-relaxed-fit-yala-everyday", label: "Áo thun" },
  longsleeve: { slug: "ao-thun-dai-tay-yala-everyday", label: "Áo dài tay" },
  sweater: { slug: "ao-sweater-ni-bong-yala-everyday", label: "Sweater" },
  hoodie: { slug: "ao-hoodie-ni-bong-yala-everyday", label: "Hoodie" },
  tote: { slug: "tui-tote-canvas-yala-everyday", label: "Túi tote" },
};

/** Vùng in ngực trên ảnh phôi (tỉ lệ 0–1) – dùng chung cho ảnh xem trước & vùng in của sản phẩm */
export const GARMENT_ZONE: Record<GarmentKey, { x: number; y: number; w: number; h: number; widthMm: number; heightMm: number }> = {
  tshirt: { x: 0.3675, y: 0.24, w: 0.265, h: 0.3357, widthMm: 300, heightMm: 380 },
  longsleeve: { x: 0.3675, y: 0.24, w: 0.265, h: 0.3357, widthMm: 300, heightMm: 380 },
  sweater: { x: 0.3675, y: 0.25, w: 0.265, h: 0.3357, widthMm: 300, heightMm: 380 },
  hoodie: { x: 0.3675, y: 0.31, w: 0.265, h: 0.2207, widthMm: 300, heightMm: 250 },
  tote: { x: 0.275, y: 0.46, w: 0.45, h: 0.45, widthMm: 300, heightMm: 300 },
};

export type ReadyDesign = {
  slug: string;
  title: string;
  collection: string;
  garment: GarmentKey;
  color: ColorKey;
  template: DesignTemplateData;
};
export type DesignCollection = { slug: string; name: string; blurb: string; tint: string; designs: ReadyDesign[] };

/* ---------- Bố cục chữ ---------- */
type TL = Omit<TextLayer, "id" | "w" | "h" | "rotation" | "opacity" | "align" | "lineHeight" | "type"> & Partial<Pick<TextLayer, "align" | "lineHeight" | "rotation">>;
const t = (p: TL): DesignLayer => ({ type: "text", id: "t", w: 10, h: 10, rotation: 0, opacity: 1, align: "center", lineHeight: 1.08, ...p });
const W = 300;
const H = 380;
const lines = (s: string) => s.split("\n").length;

type Ink = { main: string; accent: string; soft: string };
/** Trộn màu hex với trắng/đen theo tỉ lệ t (0–1) */
function mix(hex: string, to: "#ffffff" | "#000000", t: number): string {
  const a = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const b = to === "#ffffff" ? 255 : 0;
  return "#" + a.map((v) => Math.round(v + (b - v) * t).toString(16).padStart(2, "0")).join("");
}
/** Màu chữ theo nền áo; màu nhấn tự sáng lên trên áo tối / tối đi trên áo sáng để luôn đọc rõ */
const inkFor = (dark: boolean, accent: string): Ink => {
  let a = accent;
  for (let i = 0; i < 6 && dark && luminance(a) < 0.3; i++) a = mix(a, "#ffffff", 0.3);
  for (let i = 0; i < 6 && !dark && luminance(a) > 0.45; i++) a = mix(a, "#000000", 0.25);
  return dark ? { main: "#ffffff", accent: a, soft: "#d6d3ce" } : { main: "#1d1d1f", accent: a, soft: "#57534e" };
};

/** Độ rộng trung bình 1 ký tự / cỡ chữ theo font (ước lượng để tự co chữ vừa vùng in) */
const CHAR_W: Record<string, number> = { Anton: 0.46, Oswald: 0.5, Montserrat: 0.66, Nunito: 0.58, "Dancing Script": 0.44, Pacifico: 0.56, Lobster: 0.46, "Playfair Display": 0.56, "Be Vietnam Pro": 0.58 };
const longest = (s: string) => Math.max(...s.split("\n").map((x) => [...x].length), 1);
/** Ngắt dòng tự động: giữ dòng đã xuống, dòng dài hơn max ký tự thì chia theo từ (không cắt giữa từ) */
function wrap(text: string, max: number): string {
  return text
    .split("\n")
    .flatMap((ln) => {
      const out: string[] = [];
      let cur = "";
      for (const w of ln.split(/\s+/).filter(Boolean)) {
        if (cur && [...`${cur} ${w}`].length > max) {
          out.push(cur);
          cur = w;
        } else cur = cur ? `${cur} ${w}` : w;
      }
      if (cur) out.push(cur);
      return out.length ? out : [""];
    })
    .join("\n");
}

/** Cỡ chữ lớn nhất ≤ max sao cho dòng dài nhất chiếm ≤ fill × bề ngang vùng in */
const fit = (s: string, font: string, max: number, fill = 0.92, spacing = 0) => Math.round(Math.min(max, (fill * W) / (longest(s) * ((CHAR_W[font] ?? 0.55) + spacing))));

/** Chữ lớn nhiều dòng (Anton) + dòng nhỏ giãn chữ phía dưới */
function bigStack(text: string, caption: string, ink: Ink, font: "Anton" | "Oswald" = "Anton"): DesignLayer[] {
  const up = wrap(text, 11).toLocaleUpperCase("vi");
  const n = lines(up);
  const size = fit(up, font, n >= 3 ? 70 : n === 2 ? 92 : 118);
  const block = n * size * 1.02;
  const top = 150 - block / 2;
  const cap = caption.toLocaleUpperCase("vi");
  return [
    t({ text: up, font, fontSize: size, color: ink.main, x: W / 2, y: top + block / 2, lineHeight: 1.02, bold: font === "Oswald" }),
    ...(caption ? [t({ text: cap, font: "Montserrat", fontSize: fit(cap, "Montserrat", 16, 0.85, 0.22), color: ink.accent, bold: true, x: W / 2, y: top + block + 26, letterSpacing: 0.22 })] : []),
  ];
}

/** Nhãn nhỏ phía trên + chữ viết tay lớn + chú thích */
function scriptMid(label: string, scriptRaw: string, foot: string, ink: Ink, font: "Dancing Script" | "Pacifico" | "Lobster" = "Dancing Script"): DesignLayer[] {
  const script = wrap(scriptRaw, 12);
  const size = fit(script, font, 92);
  const block = lines(script) * size * 1.08;
  const lab = label.toLocaleUpperCase("vi");
  return [
    t({ text: lab, font: "Montserrat", fontSize: fit(lab, "Montserrat", 16, 0.8, 0.3), color: ink.soft, bold: true, x: W / 2, y: 150 - block / 2 - 26, letterSpacing: 0.3 }),
    t({ text: script, font, fontSize: size, color: ink.accent, bold: font === "Dancing Script", x: W / 2, y: 150, lineHeight: 1.08 }),
    ...(foot ? [t({ text: foot, font: "Be Vietnam Pro", fontSize: fit(foot, "Be Vietnam Pro", 19, 0.85), color: ink.main, x: W / 2, y: 150 + block / 2 + 26 })] : []),
  ];
}

/** Huy hiệu: chữ cong phía trên + chữ lớn giữa + dòng dưới */
function badge(arc: string, mid: string, bottom: string, ink: Ink): DesignLayer[] {
  const m = mid.toLocaleUpperCase("vi");
  const size = fit(m, "Anton", 108);
  const b = bottom.toLocaleUpperCase("vi");
  return [
    t({ text: arc.toLocaleUpperCase("vi"), font: "Oswald", fontSize: 30, color: ink.main, bold: true, x: W / 2, y: 150 - size / 2 - 40, curve: 30, letterSpacing: 0.08 }),
    t({ text: m, font: "Anton", fontSize: size, color: ink.accent, x: W / 2, y: 150 }),
    t({ text: b, font: "Montserrat", fontSize: fit(b, "Montserrat", 16, 0.85, 0.25), color: ink.main, bold: true, x: W / 2, y: 150 + size / 2 + 26, letterSpacing: 0.25 }),
  ];
}

/** Câu thoại thường ngày: chữ tròn Nunito */
function note(raw: string, sign: string, ink: Ink): DesignLayer[] {
  const text = wrap(raw, 11);
  const n = lines(text);
  const size = fit(text, "Nunito", 56);
  return [
    t({ text, font: "Nunito", fontSize: size, color: ink.main, bold: true, x: W / 2, y: 150, lineHeight: 1.16 }),
    ...(sign ? [t({ text: sign, font: "Be Vietnam Pro", fontSize: fit(sign, "Be Vietnam Pro", 19, 0.8), color: ink.accent, x: W / 2, y: 150 + (n * size * 1.16) / 2 + 26, italic: true })] : []),
  ];
}

/** Tối giản: 1 từ ở ngực trái (in nhỏ kiểu logo túi áo) */
function pocket(word: string, sub: string, ink: Ink): DesignLayer[] {
  return [
    t({ text: word, font: "Playfair Display", fontSize: 32, color: ink.main, bold: true, italic: true, x: 222, y: 44, align: "center" }),
    ...(sub ? [t({ text: sub.toLocaleUpperCase("vi"), font: "Montserrat", fontSize: 8.5, color: ink.soft, bold: true, x: 222, y: 68, letterSpacing: 0.3 })] : []),
  ];
}

type Recipe = "stack" | "stackO" | "script" | "pacifico" | "lobster" | "badge" | "note" | "pocket";
type Spec = [title: string, recipe: Recipe, a: string, b?: string, c?: string, garment?: GarmentKey, color?: ColorKey];

function build(slug: string, s: Spec, accent: string, defGarment: GarmentKey, defColor: ColorKey, i: number): ReadyDesign {
  const [title, recipe, a, b = "", c = "", g = defGarment, col = defColor] = s;
  const ink = inkFor(BASIC_COLORS[col].dark, accent);
  const layers =
    recipe === "stack" ? bigStack(a, b, ink)
    : recipe === "stackO" ? bigStack(a, b, ink, "Oswald")
    : recipe === "script" ? scriptMid(a, b, c, ink)
    : recipe === "pacifico" ? scriptMid(a, b, c, ink, "Pacifico")
    : recipe === "lobster" ? scriptMid(a, b, c, ink, "Lobster")
    : recipe === "badge" ? badge(a, b, c, ink)
    : recipe === "note" ? note(a, b, ink)
    : pocket(a, b, ink);
  return { slug: `${slug}-${i + 1}`, title, collection: slug, garment: g, color: col, template: { srcW: W, srcH: H, bg: null, layers } };
}

function C(slug: string, name: string, blurb: string, tint: string, accent: string, garment: GarmentKey, color: ColorKey, specs: Spec[]): DesignCollection {
  return { slug, name, blurb, tint, designs: specs.map((s, i) => build(slug, s, accent, garment, color, i)) };
}

/* ---------- 24 bộ sưu tập ---------- */
export const DESIGN_COLLECTIONS: DesignCollection[] = [
  C("mua-thu-ha-noi", "Mùa thu Hà Nội", "Gió heo may, cốm xanh, hoa sữa – mặc ấm mà vẫn thơ.", "#efe4d2", "#b45309", "sweater", "kem", [
    ["Hà Nội mùa thu", "script", "Tháng Mười", "Hà Nội\nmùa thu", "gió heo may về rồi"],
    ["Cốm xanh hoa sữa", "stackO", "Cốm xanh\nhoa sữa", "Hà Nội · 10.2026", "", "hoodie", "kem"],
    ["Gió heo may", "note", "Gió heo may\nvề ngang phố\nnhớ ai không?", "— tháng Mười", "", "sweater", "navy"],
    ["Hồ Gươm sáng sớm", "badge", "Một vòng Hồ Gươm", "5H SÁNG", "đi bộ cho khoẻ", "hoodie", "xam"],
  ]),
  C("chuyen-phong-gym", "Chuyện phòng gym", "Tập vì sức khoẻ, mặc vì vui.", "#e7e9ec", "#ea580c", "tshirt", "den", [
    ["Hôm nay tập chân", "stack", "Hôm nay\ntập chân", "mai tính tiếp"],
    ["Cơ bắp đang tải", "note", "Cơ bắp\nđang tải…\n75%", "kiên nhẫn nha"],
    ["Gym để ăn thêm", "stack", "Tập gym\nđể ăn thêm", "không phải để gầy", "", "tshirt", "xam"],
    ["Ngày nghỉ", "badge", "Rest day", "Ngủ", "cũng là tập luyện", "tshirt", "trang"],
  ]),
  C("pickleball", "Pickleball", "Ra sân lúc 5 giờ sáng, về nhà khoe cả ngày.", "#e4efd9", "#65a30d", "tshirt", "trang", [
    ["Thua tại vợt", "stack", "Thua\nlà tại vợt", "pickleball club"],
    ["Sống chậm đánh nhanh", "script", "Pickleball", "Sống chậm\nđánh nhanh", "ra sân 5h sáng"],
    ["Kitchen là của tôi", "badge", "Non-volley zone", "Kitchen", "là nhà của tôi", "tshirt", "navy"],
    ["Dink cả ngày", "note", "Dink một chút\nvui cả ngày", "— hội pickle phường", "", "tshirt", "kem"],
  ]),
  C("ca-phe-tra-sua", "Cà phê & trà sữa", "Cho người không thể bắt đầu ngày mới nếu thiếu một ly.", "#f1e6da", "#92400e", "tshirt", "kem", [
    ["Chưa uống cà phê", "note", "Chưa uống cà phê\nthì chưa phải là tôi", "— 7h sáng"],
    ["Trà sữa full topping", "pacifico", "Order", "Trà sữa\nfull topping", "ít đá, nhiều yêu thương", "tshirt", "trang"],
    ["Một ly ba tiếng", "stack", "Một ly\nba tiếng\ntâm sự", "cà phê vỉa hè", "", "tshirt", "den"],
    ["Sữa đá không đường", "badge", "Cà phê sữa đá", "Ít ngọt", "như lời em nói", "sweater", "kem"],
  ]),
  C("doi-game-thu", "Đời game thủ", "Một trận nữa thôi… lần thứ mười.", "#e4e2f3", "#7c3aed", "tshirt", "den", [
    ["Một trận nữa thôi", "stack", "Một trận\nnữa thôi", "lần thứ 10"],
    ["Lag không phải lỗi em", "note", "Lag không phải\nlỗi của em", "— wifi nhà hàng xóm"],
    ["AFK đi ăn cơm", "badge", "Mẹ gọi", "AFK", "đi ăn cơm", "hoodie", "den"],
    ["Rank theo năm", "stackO", "Leo rank\ntheo năm", "không theo mùa", "", "tshirt", "navy"],
  ]),
  C("dan-van-phong", "Dân văn phòng", "Deadline dí nhưng vẫn phải xinh.", "#e6ecf2", "#2563eb", "tshirt", "trang", [
    ["Deadline vẫn xinh", "script", "Deadline dí", "vẫn xinh", "như thường lệ"],
    ["Đang họp", "stack", "Đang họp\nđừng gọi", "nhắn tin được", "", "tshirt", "den"],
    ["Thứ Hai", "note", "Thứ Hai\nlà một trạng thái\nkhông phải một ngày", "", "", "sweater", "xam"],
    ["Lương về", "badge", "Ngày mùng 5", "Lương về", "và đi luôn", "tshirt", "kem"],
  ]),
  C("hoang-thuong-meo-cun", "Hoàng thượng mèo cún", "Cho các sen đang được boss nuôi.", "#f3e3e3", "#db2777", "tshirt", "trang", [
    ["Sen của hoàng thượng", "script", "Chức danh", "Sen\ncủa hoàng thượng", "làm việc 24/7"],
    ["Nhà có boss", "stack", "Nhà có boss", "vào nhẹ nhàng", "", "tshirt", "kem"],
    ["Mèo không cần bạn", "note", "Mèo không cần bạn\nbạn mới cần mèo", "— sự thật", "", "tshirt", "xam"],
    ["Đi dạo cùng cún", "pacifico", "7h tối", "Đi dạo\ncùng Cún", "", "hoodie", "kem"],
  ]),
  C("cap-doi", "Cặp đôi", "Mặc đôi cho cả thế giới biết.", "#f5dfe3", "#e11d48", "tshirt", "trang", [
    ["Của anh", "lobster", "Chính chủ", "Của anh", "since 2026"],
    ["Của em", "lobster", "Chính chủ", "Của em", "since 2026"],
    ["Đã có chủ", "badge", "Thông báo", "Đã có chủ", "vui lòng giữ khoảng cách", "tshirt", "den"],
    ["Yêu từ cái nhìn đầu tiên", "note", "Yêu từ\ncái nhìn đầu tiên\nvà cả lần thứ 1000", "", "", "sweater", "kem"],
  ]),
  C("gia-dinh", "Gia đình", "Áo gia đình cho những chuyến đi và ảnh Tết.", "#e3eef0", "#0891b2", "tshirt", "trang", [
    ["Team bố", "badge", "Nhà mình", "Team bố", "quản lý ví tiền"],
    ["Team mẹ", "badge", "Nhà mình", "Team mẹ", "quản lý team bố"],
    ["Team con", "badge", "Nhà mình", "Team con", "quản lý cả nhà"],
    ["Nhà mình là nhất", "script", "Family", "Nhà mình\nlà nhất", "chuyến đi 2026", "tshirt", "kem"],
  ]),
  C("viet-nam-du-lich", "Việt Nam đi đâu cũng đẹp", "Kỷ niệm chuyến đi, mặc lên là nhớ.", "#e0ece2", "#15803d", "tshirt", "trang", [
    ["Đà Lạt mộng mơ", "script", "Thành phố sương", "Đà Lạt\nmộng mơ", "1.500m so với mực nước biển"],
    ["Hà Giang một lần đi", "stack", "Hà Giang\nmột lần đi", "cả đời nhớ", "", "tshirt", "den"],
    ["Sài Gòn không ngủ", "stackO", "Sài Gòn\nkhông ngủ", "cà phê 24/7", "", "tshirt", "navy"],
    ["Hội An phố cổ", "pacifico", "Quảng Nam", "Hội An", "đèn lồng & phố cổ", "tshirt", "kem"],
  ]),
  C("cham-ngon-tich-cuc", "Châm ngôn tích cực", "Mặc một câu tử tế cho ngày tốt hơn.", "#f3eedf", "#ca8a04", "tshirt", "kem", [
    ["Sống chậm lại", "script", "Nhắc nhẹ", "Sống chậm lại", "mọi thứ vẫn kịp"],
    ["Cứ vui đi", "stack", "Cứ vui đi\nrồi tính", "", "", "tshirt", "trang"],
    ["Mọi chuyện sẽ ổn", "note", "Mọi chuyện\nrồi sẽ ổn", "— tin mình đi", "", "sweater", "xam"],
    ["Tự tin là đẹp", "badge", "Ghi nhớ", "Tự tin", "là đẹp nhất", "tshirt", "den"],
  ]),
  C("tet-li-xi", "Tết & lì xì", "Áo Tết cả nhà, chụp ảnh là có không khí.", "#f6dcd6", "#dc2626", "tshirt", "trang", [
    ["Lì xì đi rồi nói", "stack", "Lì xì đi\nrồi nói", "chúc mừng năm mới"],
    ["Năm mới phát tài", "script", "Xuân 2027", "Năm mới\nphát tài", "vạn sự như ý"],
    ["Không hỏi khi nào cưới", "note", "Tết này\nkhông hỏi\nkhi nào cưới", "— cảm ơn cả nhà", "", "tshirt", "kem"],
    ["Ăn Tết xuyên Tết", "badge", "Mùng 1 đến mùng 10", "Ăn Tết", "không ngừng nghỉ", "sweater", "den"],
  ]),
  C("hoc-sinh-sinh-vien", "Học sinh – sinh viên", "Ôn thi bằng niềm tin, qua môn bằng nỗ lực.", "#e5e9f5", "#4f46e5", "tshirt", "trang", [
    ["Ôn thi bằng niềm tin", "note", "Ôn thi\nbằng niềm tin", "— và cà phê"],
    ["Qua môn là được", "stack", "Qua môn\nlà được", "điểm cao là mơ", "", "tshirt", "den"],
    ["Deadline là động lực", "badge", "Sinh viên năm cuối", "Deadline", "là động lực", "hoodie", "xam"],
    ["Lớp mình số 1", "script", "Kỷ niệm lớp", "Lớp mình\nlà số 1", "niên khoá 2023 – 2027", "tshirt", "kem"],
  ]),
  C("chay-bo", "Chạy bộ", "Pace chậm, tim nhanh, tinh thần thép.", "#e0edf0", "#0d9488", "tshirt", "den", [
    ["5km mỗi sáng", "badge", "Morning run", "5KM", "mỗi sáng", "tshirt", "den"],
    ["Chạy vì trà sữa", "stack", "Chạy\nvì trà sữa", "đốt 300 kcal, nạp 500", "", "tshirt", "trang"],
    ["Pace chậm tim nhanh", "note", "Pace chậm\nnhưng tim nhanh", "— runner phong trào", "", "tshirt", "xam"],
    ["Không bỏ cuộc", "stackO", "Runner\nkhông bỏ cuộc", "chỉ đi bộ một chút", "", "tshirt", "navy"],
  ]),
  C("foodie", "Foodie", "Ăn trước, giảm cân sau.", "#f5e5d3", "#ea580c", "tshirt", "kem", [
    ["Ăn trước giảm cân sau", "stack", "Ăn trước\ngiảm cân sau", "đúng thứ tự"],
    ["Phở là chân ái", "script", "Bữa sáng", "Phở\nlà chân ái", "thêm quẩy, bớt hành", "tshirt", "trang"],
    ["Đói là mất đẹp", "note", "Đói là\nmất đẹp", "— cho ăn trước đi", "", "tshirt", "den"],
    ["Bún chả", "badge", "Món ngon Hà Nội", "Bún chả", "là chân lý", "tshirt", "trang"],
  ]),
  C("nghe-nghiep", "Nghề nghiệp", "Mặc đúng nghề, nói đúng chất.", "#e9e9e7", "#0f766e", "tshirt", "den", [
    ["Dev chính hiệu", "note", "It works\non my machine", "— dev chính hiệu"],
    ["Designer sửa lần cuối", "stack", "Sửa lần cuối\n(final_v7)", "designer chính hiệu", "", "tshirt", "trang"],
    ["Sale chốt đơn", "badge", "Nghề sale", "Chốt đơn", "không chốt không về", "tshirt", "navy"],
    ["Kế toán", "script", "Nghề kế toán", "Cân mọi thứ", "trừ cân nặng", "tshirt", "kem"],
  ]),
  C("karaoke", "Karaoke & âm nhạc", "Hát hay không bằng hay hát.", "#ece3f3", "#9333ea", "tshirt", "den", [
    ["Hay hát", "stack", "Hát hay\nkhông bằng\nhay hát", "", ""],
    ["Micro là của em", "pacifico", "Phòng số 5", "Micro\nlà của em", "", "tshirt", "trang"],
    ["Một bài nữa thôi", "note", "Một bài nữa thôi\nrồi về", "— 1h sáng", "", "tshirt", "xam"],
    ["Bass căng", "badge", "Loa kẹo kéo", "Bass căng", "lòng nhẹ nhàng", "tshirt", "den"],
  ]),
  C("mua-he-bien", "Mùa hè & biển", "Nắng này là của em.", "#dcecf3", "#0284c7", "tshirt", "trang", [
    ["Nắng là của em", "pacifico", "Summer 2026", "Nắng này\nlà của em", ""],
    ["Hè rồi đi đâu", "stack", "Hè rồi\nđi đâu đây", "gọi hội bạn thân", "", "tshirt", "kem"],
    ["Say biển", "note", "Say nắng\nsay luôn biển", "— kỳ nghỉ 3 ngày", "", "tshirt", "trang"],
    ["Vitamin sea", "badge", "Kỳ nghỉ", "Vitamin sea", "uống mỗi ngày", "tshirt", "navy"],
  ]),
  C("tam-trang", "Tâm trạng", "Nói hộ những điều không tiện nói.", "#ecebea", "#57534e", "tshirt", "xam", [
    ["Đang sạc pin", "badge", "Trạng thái", "Đang sạc", "vui lòng quay lại sau", "tshirt", "xam"],
    ["Tôi ổn", "note", "Tôi ổn\n(thật đấy)", "", "", "tshirt", "trang"],
    ["Không drama", "stack", "Không\ndrama", "chỉ cần bình yên", "", "tshirt", "den"],
    ["Buồn ngủ", "script", "Cả ngày", "Buồn ngủ", "dù đã ngủ đủ 9 tiếng", "sweater", "kem"],
  ]),
  C("tu-hao-viet-nam", "Tự hào Việt Nam", "Người Việt, hàng Việt, niềm vui Việt.", "#f3dedd", "#dc2626", "tshirt", "trang", [
    ["Tự hào Việt Nam", "stack", "Tự hào\nViệt Nam", "made with love"],
    ["Made in Việt Nam", "badge", "Chính hiệu", "Made in", "Việt Nam", "tshirt", "den"],
    ["Chữ S thân yêu", "script", "Quê hương", "Chữ S\nthân yêu", "từ Hà Giang đến Cà Mau", "tshirt", "kem"],
    ["Người Việt", "note", "Người Việt\ndùng hàng Việt", "", "", "tshirt", "navy"],
  ]),
  C("toi-gian", "Tối giản", "Một chữ nhỏ ở ngực – mặc đi đâu cũng hợp.", "#eeece8", "#1d1d1f", "tshirt", "trang", [
    ["Chill", "pocket", "chill", "every day"],
    ["Bình yên", "pocket", "bình yên", "slow living", "", "tshirt", "kem"],
    ["Vui", "pocket", "vui", "always", "", "tshirt", "den"],
    ["Tự do", "pocket", "tự do", "since forever", "", "sweater", "xam"],
  ]),
  C("team-building", "Team building & công ty", "Đồng phục vui cho đội nhóm (sửa tên công ty trong Studio).", "#e2ebf5", "#1d4ed8", "tshirt", "trang", [
    ["Team building 2026", "badge", "Công ty của bạn", "Team building", "2026 · hết mình", "tshirt", "trang"],
    ["Một team", "stack", "Một team\nmột giấc mơ", "sửa tên team ở đây"],
    ["Cùng nhau là vui", "script", "Year end party", "Cùng nhau\nlà vui", "tên công ty", "tshirt", "navy"],
    ["Hết mình", "stackO", "Hết mình\nhết sức", "phòng kinh doanh", "", "tshirt", "den"],
  ]),
  C("ban-than", "Bạn thân & hội chị em", "Đi đâu cũng có nhau.", "#f4e4ec", "#c026d3", "tshirt", "trang", [
    ["Bạn thân nhất", "script", "Chứng nhận", "Bạn thân\nnhất quả đất", "không đổi trả"],
    ["Hội chị em", "badge", "Thành viên", "Hội chị em", "tám không ngừng", "tshirt", "kem"],
    ["Anh em một nhà", "stack", "Anh em\nmột nhà", "đi đâu cũng có nhau", "", "tshirt", "den"],
    ["Đi đâu cũng có nhau", "note", "Đi đâu\ncũng có nhau\n(trừ đi làm)", "", "", "sweater", "xam"],
  ]),
  C("tui-tote", "Túi tote chữ", "Túi vải canvas in chữ – đi chợ, đi học, đi cà phê.", "#efe8da", "#1d1d1f", "tote", "kem", [
    ["Túi đi chợ", "stack", "Túi\nđi chợ", "bảo vệ môi trường"],
    ["Đựng cả thế giới", "script", "Túi của em", "Đựng cả\nthế giới", "trừ người yêu cũ"],
    ["Sách và cà phê", "note", "Sách\nvà cà phê", "— đủ cho một ngày", "", "tote", "kem"],
    ["Không túi nilon", "badge", "Sống xanh", "No nilon", "cảm ơn bạn", "tote", "den"],
  ]),
];

export const READY_DESIGNS: ReadyDesign[] = DESIGN_COLLECTIONS.flatMap((c) => c.designs);
export const findReadyDesign = (slug: string) => READY_DESIGNS.find((d) => d.slug === slug);
export const findDesignCollection = (slug: string) => DESIGN_COLLECTIONS.find((c) => c.slug === slug);

/** Font cần tải để hiện các mẫu (link Google Fonts chỉ gồm font đang dùng) */
export function readyDesignFontsHref(designs: ReadyDesign[]): string {
  const used = new Map<string, Set<number>>();
  for (const d of designs)
    for (const l of d.template.layers)
      if (l.type === "text") {
        const s = used.get(l.font) ?? new Set<number>();
        s.add(l.bold ? 700 : 400);
        used.set(l.font, s);
      }
  const single = new Set(["Anton", "Lobster", "Pacifico"]);
  const fams = [...used.entries()].map(([f, w]) => {
    const fam = f.replace(/ /g, "+");
    if (single.has(f)) return `family=${fam}`;
    const ws = [...w].sort();
    const ital = f === "Playfair Display" || f === "Be Vietnam Pro";
    return ital ? `family=${fam}:ital,wght@${ws.flatMap((x) => [`0,${x}`, `1,${x}`]).sort().join(";")}` : `family=${fam}:wght@${ws.join(";")}`;
  });
  return `https://fonts.googleapis.com/css2?${fams.join("&")}&subset=vietnamese&display=swap`;
}
