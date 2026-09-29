/**
 * 34 tỉnh/thành phố sau sắp xếp đơn vị hành chính (hiệu lực 01/07/2025).
 * Cấp hành chính mới: Tỉnh/Thành phố -> Phường/Xã (không còn cấp Quận/Huyện).
 */
export const PROVINCES = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Hải Phòng",
  "Đà Nẵng",
  "Huế",
  "Cần Thơ",
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Tĩnh",
  "Hưng Yên",
  "Khánh Hòa",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Tuyên Quang",
  "Vĩnh Long",
] as const;

export type Province = (typeof PROVINCES)[number];

/** SĐT di động VN: 0xxxxxxxxx hoặc +84xxxxxxxxx (đầu số 3,5,7,8,9) */
export const VN_PHONE_REGEX = /^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/;

export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+84")) return "0" + digits.slice(3);
  if (digits.startsWith("84") && digits.length === 11) return "0" + digits.slice(2);
  return digits;
}

export function isValidVNPhone(input: string): boolean {
  return VN_PHONE_REGEX.test(normalizePhone(input));
}

/** Bỏ dấu tiếng Việt: "Áo thun Nam" -> "Ao thun Nam" */
export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** "Áo Thun In Toàn Thân" -> "ao-thun-in-toan-than" */
export function slugify(input: string): string {
  return removeVietnameseTones(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Chuỗi tìm kiếm không dấu, chữ thường: "Bình Giữ Nhiệt" -> "binh giu nhiet" */
export function toSearchText(...parts: (string | null | undefined)[]): string {
  return removeVietnameseTones(parts.filter(Boolean).join(" "))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Tách từ khoá người dùng gõ thành các token không dấu (tối đa 6) */
export function searchTokens(q: string): string[] {
  return toSearchText(q).split(" ").filter((t) => t.length >= 1).slice(0, 6);
}
