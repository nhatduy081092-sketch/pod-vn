"use client";
/**
 * Tracking YALA – 1 nguồn sự kiện, 2 chế độ (xem docs/tracking/TRACKING.md):
 *  - Luôn đẩy sự kiện chuẩn GA4 e-commerce vào window.dataLayer (kèm event_id).
 *  - Có GTM (NEXT_PUBLIC_GTM_ID): GTM đọc dataLayer và bắn GA4 / Meta / TikTok / Google Ads – code KHÔNG gọi thẳng gtag/fbq/ttq (tránh đếm đôi).
 *  - Không có GTM: gọi thẳng gtag / fbq / ttq nếu có ID tương ứng. Không có ID nào -> chỉ có dataLayer (vô hại).
 * Không gửi tên, SĐT, email, địa chỉ – chỉ mã, số đếm, giá trị.
 */
type Item = { id: string; name: string; price: number; quantity: number; category?: string; variant?: string };
/** single = mua lẻ · team_roster = đồng phục theo danh sách tự nhập · group_link = đặt từ link gom đơn nhóm */
export type OrderType = "single" | "team_roster" | "group_link";

/** Nhóm số lượng để báo cáo dễ đọc (1–9 / 10–29 / 30–49 / 50–99 / 100+) – khớp mốc giá 10/30/50/100 */
export function bucket(n: number) {
  return n >= 100 ? "100+" : n >= 50 ? "50-99" : n >= 30 ? "30-49" : n >= 10 ? "10-29" : n >= 1 ? "1-9" : "0";
}
function once(key: string, store: "session" | "local" = "session") {
  try {
    const s = store === "local" ? localStorage : sessionStorage;
    if (s.getItem(`trk:${key}`)) return false;
    s.setItem(`trk:${key}`, "1");
  } catch {
    /* private mode */
  }
  return true;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (...args: unknown[]) => void; page: () => void };
    /** true khi GTM đã được nạp -> GTM lo việc gửi đi các nền tảng */
    __yalaGtm?: boolean;
  }
}

const INTERNAL_KEY = "yala_internal";
/** Máy nội bộ (chủ shop, nhân viên, người test): mở 1 lần yala.vn/?yala_internal=1 (tắt: =0) */
export function isInternal() {
  try {
    return localStorage.getItem(INTERNAL_KEY) === "1";
  } catch {
    return false;
  }
}
function syncInternalFlag(url: URL) {
  const v = url.searchParams.get(INTERNAL_KEY);
  try {
    if (v === "1") localStorage.setItem(INTERNAL_KEY, "1");
    if (v === "0") localStorage.removeItem(INTERNAL_KEY);
  } catch {
    /* private mode */
  }
}

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

const gaItem = (i: Item, index?: number, list?: string) => ({
  item_id: i.id,
  item_name: i.name,
  ...(i.category ? { item_category: i.category } : {}),
  ...(i.variant ? { item_variant: i.variant } : {}),
  ...(list ? { item_list_name: list } : {}),
  ...(index !== undefined ? { index } : {}),
  price: i.price,
  quantity: i.quantity,
});
const sum = (items: Item[]) => items.reduce((s, i) => s + i.price * i.quantity, 0);

/** Chuyển trang trong web có thể gắn lại component 2 lần -> cùng 1 sự kiện (cùng khoá) trong 3 giây chỉ tính 1 lần */
const recent = new Map<string, number>();
function fresh(key: string, ms = 3000) {
  const now = Date.now();
  const last = recent.get(key);
  recent.set(key, now);
  return !last || now - last >= ms;
}

type Platform = { meta?: string; metaCustom?: boolean; tiktok?: string };
/**
 * Gửi 1 sự kiện: dataLayer (luôn) + gửi thẳng khi không có GTM.
 * ecommerce = tham số chuẩn GA4 (items, value, currency…); extra = tham số riêng (order_type, topic…).
 */
function emit(event: string, ecommerce: Record<string, unknown> | null, extra: Record<string, unknown> = {}, to: Platform = {}, eventId = newId()) {
  if (typeof window === "undefined") return;
  const internal = isInternal();
  const dl = (window.dataLayer = window.dataLayer || []);
  if (ecommerce) dl.push({ ecommerce: null }); // xoá ecommerce của sự kiện trước (khuyến nghị GA4)
  dl.push({ event, event_id: eventId, ...(internal ? { traffic_type: "internal" } : {}), ...extra, ...(ecommerce ? { ecommerce } : {}) });
  if (window.__yalaGtm) return;

  window.gtag?.("event", event, { ...ecommerce, ...extra, event_id: eventId, ...(internal ? { traffic_type: "internal", debug_mode: true } : {}) });
  // máy nội bộ không gửi sang nền tảng quảng cáo (không làm bẩn tối ưu chuyển đổi)
  if (internal) return;
  const value = ecommerce?.value;
  const items = (ecommerce?.items as { item_id: string; quantity?: number }[] | undefined) ?? [];
  const common = {
    ...(value !== undefined ? { value, currency: "VND" } : {}),
    ...(items.length ? { content_ids: items.map((i) => i.item_id), content_type: "product", contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity ?? 1 })) } : {}),
  };
  if (to.meta) window.fbq?.(to.metaCustom ? "trackCustom" : "track", to.meta, { ...common, ...extra }, { eventID: eventId });
  if (to.tiktok)
    window.ttq?.track(
      to.tiktok,
      { ...(value !== undefined ? { value, currency: "VND" } : {}), ...(items.length ? { content_type: "product", contents: items.map((i) => ({ content_id: i.item_id, quantity: i.quantity ?? 1 })) } : {}) },
      { event_id: eventId },
    );
}

export const track = {
  /** Danh sách sản phẩm (danh mục, tìm kiếm, bán chạy…) */
  viewItemList(listId: string, listName: string, items: Item[]) {
    if (!items.length) return;
    emit("view_item_list", { item_list_id: listId, item_list_name: listName, items: items.map((i, k) => gaItem(i, k, listName)) });
  },
  selectItem(listId: string, listName: string, item: Item, index: number) {
    emit("select_item", { item_list_id: listId, item_list_name: listName, items: [gaItem(item, index, listName)] });
  },
  search(term: string, results?: number) {
    const t = term.trim().slice(0, 100);
    if (!t) return;
    emit("search", null, { search_term: t, ...(results !== undefined ? { results } : {}) }, { meta: "Search", tiktok: "Search" });
  },
  viewItem(item: Item) {
    if (!fresh(`view_item:${item.id}`)) return;
    emit("view_item", { currency: "VND", value: item.price, items: [gaItem({ ...item, quantity: 1 })] }, {}, { meta: "ViewContent", tiktok: "ViewContent" });
  },
  addToCart(item: Item) {
    emit("add_to_cart", { currency: "VND", value: item.price * item.quantity, items: [gaItem(item)] }, {}, { meta: "AddToCart", tiktok: "AddToCart" });
  },
  removeFromCart(item: Item) {
    emit("remove_from_cart", { currency: "VND", value: item.price * item.quantity, items: [gaItem(item)] });
  },
  viewCart(value: number, items: Item[]) {
    if (!items.length || !fresh(`view_cart:${items.map((i) => `${i.id}x${i.quantity}`).join(",")}`)) return;
    emit("view_cart", { currency: "VND", value, items: items.map((i) => gaItem(i)) });
  },
  /** Vào trang thanh toán */
  beginCheckout(value: number, items: Item[]) {
    if (!items.length || !fresh(`begin_checkout:${items.map((i) => `${i.id}x${i.quantity}`).join(",")}`)) return;
    emit("begin_checkout", { currency: "VND", value, items: items.map((i) => gaItem(i)) }, {}, { meta: "InitiateCheckout", tiktok: "InitiateCheckout" });
  },
  addShippingInfo(value: number, items: Item[], shippingTier: string) {
    emit("add_shipping_info", { currency: "VND", value, shipping_tier: shippingTier, items: items.map((i) => gaItem(i)) });
  },
  addPaymentInfo(value: number, items: Item[], paymentType: string) {
    emit("add_payment_info", { currency: "VND", value, payment_type: paymentType, items: items.map((i) => gaItem(i)) }, {}, { meta: "AddPaymentInfo", tiktok: "AddPaymentInfo" });
  },
  /**
   * Đặt hàng thành công – chỉ gọi SAU KHI API tạo đơn trả mã đơn.
   * event_id = mã đơn (để khử trùng với Conversions API phía server sau này); 1 mã đơn chỉ gửi 1 lần trên máy này.
   * value = tổng tiền đơn do server tính (gồm phí ship), không lấy từ giỏ ước tính.
   */
  purchase(p: { code: string; total: number; shipping: number; paymentType: string; orderType: OrderType; items: Item[] }) {
    if (!once(`purchase:${p.code}`, "local")) return;
    emit(
      "purchase",
      { transaction_id: p.code, currency: "VND", value: p.total, shipping: p.shipping, tax: 0, payment_type: p.paymentType, items: p.items.map((i) => gaItem(i)) },
      { order_type: p.orderType },
      { meta: "Purchase", tiktok: "PlaceAnOrder" },
      p.code,
    );
  },
  signUp(method = "phone") {
    emit("sign_up", null, { method }, { meta: "CompleteRegistration", tiktok: "CompleteRegistration" });
  },
  login(method = "phone") {
    emit("login", null, { method });
  },
  /**
   * Phễu đơn nhóm (định vị khách tập thể). Không gửi tên/SĐT – chỉ số đếm và nhãn.
   * group_create -> group_share -> group_view (thành viên mở link) -> group_join -> group_close -> group_checkout -> purchase(order_type=group_link)
   */
  groupCreate(p: { product: string; personalized: boolean }) {
    emit("group_create", null, { product_slug: p.product, personalized: p.personalized }, { meta: "GroupCreate", metaCustom: true });
  },
  groupShare(method: "share" | "copy") {
    emit("group_share", null, { method });
  },
  /** Mở trang nhóm: 1 lần / mã nhóm / phiên */
  groupView(code: string, role: "leader" | "member", members: number) {
    if (once(`gv:${code}`)) emit("group_view", null, { role, members_bucket: bucket(members) });
  },
  groupJoin(p: { role: "leader" | "member"; qty: number; members: number }) {
    emit("group_join", null, { role: p.role, qty: p.qty, members_bucket: bucket(p.members) }, p.role === "member" ? { meta: "GroupJoin", metaCustom: true } : {});
  },
  groupClose(members: number) {
    emit("group_close", null, { members, members_bucket: bucket(members) });
  },
  groupCheckout(members: number, value: number) {
    emit("group_checkout", null, { members, members_bucket: bucket(members), currency: "VND", value });
  },
  /** Trang sản phẩm – tab Đặt cho nhóm: nạp danh sách */
  rosterUpload(method: "xlsx" | "csv" | "paste", rows: number, errors: number) {
    emit("roster_upload", null, { method, rows, rows_bucket: bucket(rows), has_errors: errors > 0 });
  },
  /** Gửi thông tin tư vấn / báo giá */
  lead(topic: string) {
    emit("generate_lead", null, { topic }, { meta: "Lead", tiktok: "SubmitForm" });
  },
  /** Khối quảng bá trên trang chủ (ô "Dòng sản phẩm"): đo CTR từng ô bằng view_promotion / select_promotion */
  viewPromotion(promos: { id: string; name: string; slot: string }[]) {
    if (!promos.length) return;
    emit("view_promotion", { items: promos.map((p) => ({ promotion_id: p.id, promotion_name: p.name, creative_slot: p.slot })) });
  },
  selectPromotion(p: { id: string; name: string; slot: string; color?: string }) {
    emit("select_promotion", { promotion_id: p.id, promotion_name: p.name, creative_slot: p.slot, creative_name: p.color || "default" });
  },
  /** Tải tài nguyên miễn phí (file mẫu danh sách…) – tên riêng để không trùng file_download tự động của GA4 */
  resourceDownload(file: string, from: string) {
    emit("resource_download", null, { file_name: file, page: from }, { meta: "ResourceDownload", metaCustom: true });
  },
  contact(channel: "zalo" | "phone" | "messenger") {
    emit("contact", null, { channel }, { meta: "Contact", tiktok: "Contact" });
  },
  /** Chuyển trang trong web (Next.js không tải lại trang): Meta/TikTok cần PageView thủ công, GTM nhận "virtual_page_view" */
  pageView(path: string) {
    if (typeof window === "undefined") return;
    (window.dataLayer = window.dataLayer || []).push({ event: "virtual_page_view", page_path: path, page_location: window.location.href, page_title: document.title });
    if (window.__yalaGtm || isInternal()) return;
    window.fbq?.("track", "PageView");
    window.ttq?.page();
  },
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "gbraid", "wbraid", "ttclid"];
const UTM_STORE = "pod_utm_v1";
const UTM_LAST = "pod_utm_last_v1";

/**
 * Lưu nguồn khách 30 ngày: lần chạm đầu (first-touch, không ghi đè) + lần chạm gần nhất (last-touch).
 * Gửi kèm đơn hàng / yêu cầu báo giá -> CMS biết đơn đến từ quảng cáo nào, kể cả khi trình chặn quảng cáo chặn GA/Pixel.
 */
export function captureUtm() {
  try {
    const url = new URL(window.location.href);
    syncInternalFlag(url);
    const found: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = url.searchParams.get(k);
      if (v) found[k] = v.slice(0, 200);
    }
    if (!Object.keys(found).length) return;
    const touch = JSON.stringify({ ...found, landing: url.pathname, at: Date.now() });
    localStorage.setItem(UTM_LAST, touch);
    if (!readUtm()) localStorage.setItem(UTM_STORE, touch);
  } catch {
    /* private mode */
  }
}

function readTouch(key: string): Record<string, string> | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const data = JSON.parse(raw) as Record<string, string | number>;
    if (Date.now() - Number(data.at) > 30 * 86400_000) return undefined;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) if (k !== "at") out[k] = String(v);
    return out;
  } catch {
    return undefined;
  }
}

/** Nguồn khách lưu kèm đơn: first-touch + các khoá last_* của lần chạm gần nhất (nếu khác) */
export function readUtm(): Record<string, string> | undefined {
  const first = readTouch(UTM_STORE);
  if (!first) return undefined;
  const last = readTouch(UTM_LAST);
  const out = { ...first };
  if (last && JSON.stringify(last) !== JSON.stringify(first)) for (const [k, v] of Object.entries(last)) out[`last_${k}`] = v;
  return out;
}
