/**
 * Dọn chữ lấy từ website nhà cung cấp OEM Group (oemgroup.vn) trước khi hiện trên YALA:
 * - bỏ đoạn quảng cáo cuối mô tả (giới thiệu "OEM GROUP – … KINH NGHIỆM …", "Bạn còn trăn trở…", email + hotline của họ);
 * - câu nhắc tên họ trong thân bài: bỏ tên ("… từ OEM Group", "… của OEM Group") hoặc thay bằng YALA khi câu nói về việc nhận đơn.
 * Chỉ xoá/thay tên, không viết thêm nội dung mới. Dùng khi nhập catalog và khi dọn dữ liệu cũ (settings-updates).
 */
const OEM = String.raw`OEM(?:\s+GROUP)?`;
const re = (s: string, f = "gi") => new RegExp(s, f);

/** Dòng thuộc đoạn quảng cáo cuối mô tả của nhà cung cấp */
const FOOTER_LINE = [
  re(String.raw`^\s*${OEM}\s*[–-].*KINH NGHIỆM`, "i"), // OEM GROUP – 8 NĂM KINH NGHIỆM GIA CÔNG SẢN XUẤT …
  /^\s*Bạn còn trăn trở/i, // … Liên hệ để được chúng tôi tư vấn ngay hôm nay!!
  /oemgroup\.vn/i, // Email: b2b@oemgroup.vn, website
  /1819\s*333/, // Hotline: 093 1819 333
];

/** Thay thế trong câu, theo thứ tự (cụm cụ thể trước, cụm chung sau) */
const PHRASES: [RegExp, string][] = [
  // câu hứa ưu đãi không có thật trên YALA
  [re(String.raw`\s*${OEM} nhận ngay ưu đãi vận chuyển\.?`), ""],
  [re(String.raw`là tiếng mà ${OEM} ưu ái gọi tên bộ sưu tập giỏ quà Tết \d{4} của mình`), "là tên bộ sưu tập giỏ quà Tết"],
  [re(String.raw`Bên đó, ${OEM} nhận`), "Bên cạnh đó, YALA nhận"],
  // YALA không phải xưởng sản xuất -> "nhận làm / nhận may"
  [re(String.raw`${OEM} chuyên sản xuất`), "YALA nhận làm"],
  [re(String.raw`${OEM} chuyên may`), "YALA nhận may"],
  // bỏ tên khỏi câu mô tả sản phẩm
  [re(String.raw`\s*(?:độc quyền\s+)?(?:tại|từ)\s+(?:xưởng\s+)?${OEM}\b`), ""],
  [re(String.raw`\s+của\s+${OEM}\b`), ""],
  [re(String.raw`\s+được\s+${OEM}\s+`), " được "],
  [re(String.raw`^(Gối hơi)\s+${OEM}\s+`, "gim"), "$1 "],
  [re(String.raw`^${OEM}\s+(?=vali\b)`, "gim"), ""],
  // còn lại: câu nói về việc nhận đơn, in logo, giao hàng -> YALA
  [re(String.raw`\b${OEM}\b`), "YALA"],
];

export function cleanOemText(text: string): string {
  if (!/\bOEM\b|oemgroup|1819\s*333/i.test(text)) return text;
  let out = text
    .split("\n")
    .filter((l) => !FOOTER_LINE.some((r) => r.test(l)))
    .join("\n");
  for (const [r, to] of PHRASES) out = out.replace(r, to);
  return out
    .replace(/[ \t]+([.,!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Tên sản phẩm: "OEM GROUP vali Về Nhà" -> "Vali Về Nhà" */
export function cleanOemName(name: string): string {
  const out = cleanOemText(name);
  return out.charAt(0).toUpperCase() + out.slice(1);
}
