import { solarToLunar } from "./lunar";

/**
 * Bộ sưu tập nội dung theo mùa / dịp của người Việt – gợi ý tên nhóm thư viện và lịch chuẩn bị nội dung.
 * Dịp âm lịch (Tết, Vu Lan, Trung thu) tự quy đổi sang ngày dương theo từng năm.
 */
export type ContentSeason = { name: string; solar?: { d: number; m: number }; lunar?: { d: number; m: number }; hint: string };

export const CONTENT_SEASONS: ContentSeason[] = [
  { name: "Tết Nguyên đán", lunar: { d: 1, m: 1 }, hint: "Áo gia đình, bao lì xì, lịch, cốc quà Tết" },
  { name: "Valentine", solar: { d: 14, m: 2 }, hint: "Áo đôi, cốc đôi, gối in ảnh" },
  { name: "Quốc tế Phụ nữ 8/3", solar: { d: 8, m: 3 }, hint: "Quà tặng mẹ, cô, đồng nghiệp" },
  { name: "30/4 – 1/5", solar: { d: 30, m: 4 }, hint: "Áo cờ đỏ sao vàng, du lịch nhóm" },
  { name: "Tốt nghiệp – kỷ yếu", solar: { d: 15, m: 5 }, hint: "Áo lớp, cờ lớp, sổ kỷ niệm" },
  { name: "Quốc tế Thiếu nhi 1/6", solar: { d: 1, m: 6 }, hint: "Áo trẻ em, gia đình" },
  { name: "Mùa hè – du lịch", solar: { d: 15, m: 6 }, hint: "Áo team building, đi biển" },
  { name: "Vu Lan", lunar: { d: 15, m: 7 }, hint: "Quà tặng cha mẹ" },
  { name: "Khai giảng", solar: { d: 5, m: 9 }, hint: "Áo lớp, balo, bình nước" },
  { name: "Trung thu", lunar: { d: 15, m: 8 }, hint: "Áo trẻ em, đèn lồng, quà doanh nghiệp" },
  { name: "Phụ nữ Việt Nam 20/10", solar: { d: 20, m: 10 }, hint: "Quà tặng, cốc, gối" },
  { name: "Halloween", solar: { d: 31, m: 10 }, hint: "Áo hoá trang, sự kiện" },
  { name: "Nhà giáo Việt Nam 20/11", solar: { d: 20, m: 11 }, hint: "Quà tri ân thầy cô, áo lớp" },
  { name: "Giáng sinh", solar: { d: 24, m: 12 }, hint: "Áo gia đình, áo công ty, quà" },
];

/** Nhóm dùng quanh năm */
export const EVERGREEN_SERIES = ["Sinh nhật", "Gia đình", "Tình yêu", "Thú cưng", "Đồng phục lớp", "Đội nhóm – thể thao", "Công ty – sự kiện", "Chữ & châm ngôn", "Hoa lá – hoạ tiết", "Động vật", "Hoạt hình tự vẽ"];

/** Số ngày chuẩn bị nội dung trước dịp (thiết kế + chạy quảng cáo) */
export const SEASON_LEAD_DAYS = 45;

/** Ngày dương gần nhất (từ hôm nay trở đi) của 1 dịp */
export function nextSeasonDate(s: ContentSeason, from = new Date()): Date {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (s.solar) {
    const d = new Date(start.getFullYear(), s.solar.m - 1, s.solar.d);
    return d < start ? new Date(start.getFullYear() + 1, s.solar.m - 1, s.solar.d) : d;
  }
  const l = s.lunar!;
  for (let i = 0; i < 400; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const x = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear());
    if (!x.leap && x.day === l.d && x.month === l.m) return d;
  }
  return start;
}

/** Danh sách dịp sắp tới, sắp theo ngày */
export function upcomingSeasons(from = new Date()) {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  return CONTENT_SEASONS.map((s) => {
    const date = nextSeasonDate(s, from);
    return { ...s, date, daysLeft: Math.round((date.getTime() - today) / 86_400_000) };
  }).sort((a, b) => a.daysLeft - b.daysLeft);
}
