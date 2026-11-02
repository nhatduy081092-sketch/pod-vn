/**
 * Nhóm nguồn khách của 1 đơn – tính phía máy chủ từ bộ utm trình duyệt gửi kèm (xem apps/web/src/lib/track.ts).
 * Lưu thành cột riêng trên Order để báo cáo nhanh và còn dùng được sau khi chi tiết utm bị dọn (90 ngày).
 */
export const SOURCE_GROUPS = {
  google_ads: "Google Ads",
  meta_ads: "Quảng cáo Facebook / Instagram",
  tiktok_ads: "Quảng cáo TikTok",
  other_ads: "Quảng cáo khác",
  google: "Google (tự nhiên)",
  search_other: "Tìm kiếm khác (Cốc Cốc, Bing…)",
  facebook: "Facebook / Instagram (tự nhiên)",
  zalo: "Zalo",
  tiktok: "TikTok (tự nhiên)",
  social_other: "Mạng xã hội khác",
  email: "Email",
  referral: "Web khác dẫn sang",
  direct: "Trực tiếp / không rõ",
} as const;
export type SourceGroup = keyof typeof SOURCE_GROUPS;

const PAID_MEDIUM = /^(cpc|ppc|paid|paid[_-]?social|paidsocial|cpm|ads?|display|retargeting)$/i;
const SEARCH = /(^|\.)(google|bing|coccoc|yahoo|duckduckgo|yandex|baidu|ecosia)\./i;
const FACEBOOK = /(^|\.)(facebook|fb|instagram|messenger)\.(com|me)$/i;
const ZALO = /(^|\.)zalo(app)?\.(me|vn)$|^zalo$/i;
const TIKTOK = /(^|\.)tiktok\.com$|^tiktok$/i;
const SOCIAL = /(^|\.)(youtube|youtu|threads|twitter|x|linkedin|pinterest|reddit|t)\.(com|be|net|me|co)$/i;

/** Gom 1 lần chạm (utm_source/medium, mã click, tên miền dẫn tới) thành 1 nhóm */
function groupOf(t: { source?: string; medium?: string; ref?: string; gclid?: boolean; ttclid?: boolean; fbclid?: boolean }): SourceGroup {
  const src = (t.source ?? "").toLowerCase().trim();
  const medium = (t.medium ?? "").toLowerCase().trim();
  const paid = PAID_MEDIUM.test(medium);
  // mã click chỉ có ở quảng cáo (gclid/gbraid/wbraid của Google, ttclid của TikTok)
  if (t.gclid) return "google_ads";
  if (t.ttclid) return "tiktok_ads";
  // fbclid Facebook gắn cả vào bài đăng thường -> chỉ tính quảng cáo khi utm_medium là trả phí
  const site = src || t.ref || "";
  const isFb = FACEBOOK.test(site) || /^(fb|facebook|ig|instagram|meta)$/.test(src);
  if (paid) return /google|adwords/.test(src) ? "google_ads" : isFb || t.fbclid ? "meta_ads" : TIKTOK.test(site) ? "tiktok_ads" : "other_ads";
  if (medium === "email" || src === "email" || src === "newsletter") return "email";
  if (isFb || t.fbclid) return "facebook";
  if (ZALO.test(site)) return "zalo";
  if (TIKTOK.test(site)) return "tiktok";
  if (/(^|\.)google\./.test(site) || src === "google") return "google";
  if (SEARCH.test(site) || /^(bing|coccoc|yahoo)$/.test(src)) return "search_other";
  if (SOCIAL.test(site) || /^(youtube|threads|linkedin|x|twitter)$/.test(src) || medium === "social") return "social_other";
  return site ? "referral" : "direct";
}

function touchOf(utm: Record<string, string>, prefix: string) {
  const g = (k: string) => utm[`${prefix}${k}`];
  return {
    source: g("utm_source"),
    medium: g("utm_medium"),
    ref: g("ref"),
    gclid: Boolean(g("gclid") || g("gbraid") || g("wbraid")),
    ttclid: Boolean(g("ttclid")),
    fbclid: Boolean(g("fbclid")),
  };
}

/** first = lần chạm đầu, last = lần chạm gần nhất (khoá last_* nếu có, không thì trùng first) */
export function sourceGroups(utm?: Record<string, string> | null): { first: SourceGroup; last: SourceGroup } {
  if (!utm) return { first: "direct", last: "direct" };
  const first = groupOf(touchOf(utm, ""));
  const hasLast = Object.keys(utm).some((k) => k.startsWith("last_") && k !== "last_landing");
  return { first, last: hasLast ? groupOf(touchOf(utm, "last_")) : first };
}

/** Tên miền dẫn tới của lần chạm gần nhất – chỉ nhận dạng tên miền, cắt 100 ký tự */
export function referrerHostOf(utm?: Record<string, string> | null) {
  const host = (utm?.last_ref || utm?.ref || "").toLowerCase();
  return /^[a-z0-9.-]{1,100}$/.test(host) ? host : "";
}
