"use client";
/**
 * Tracking wrapper: GA4 (gtag) + Meta Pixel (fbq). Không có ID -> no-op.
 * Sự kiện chuẩn: view_item, add_to_cart, begin_checkout, purchase.
 */
type Item = { id: string; name: string; price: number; quantity: number };
/** single = mua lẻ · team_roster = đồng phục theo danh sách tự nhập · group_link = đặt từ link gom đơn nhóm */
export type OrderType = "single" | "team_roster" | "group_link";

/** Nhóm số lượng để báo cáo dễ đọc (1–9 / 10–29 / 30–49 / 50–99 / 100+) – khớp mốc giá 10/30/50/100 */
export function bucket(n: number) {
  return n >= 100 ? "100+" : n >= 50 ? "50-99" : n >= 30 ? "30-49" : n >= 10 ? "10-29" : n >= 1 ? "1-9" : "0";
}
function once(key: string) {
  try {
    if (sessionStorage.getItem(`trk:${key}`)) return false;
    sessionStorage.setItem(`trk:${key}`, "1");
  } catch {
    /* private mode */
  }
  return true;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

function ga(event: string, params: Record<string, unknown>) {
  window.gtag?.("event", event, params);
}
function fb(event: string, params: Record<string, unknown>, custom = false) {
  window.fbq?.(custom ? "trackCustom" : "track", event, params);
}

export const track = {
  viewItem(item: Item) {
    ga("view_item", { currency: "VND", value: item.price, items: [{ item_id: item.id, item_name: item.name, price: item.price }] });
    fb("ViewContent", { content_ids: [item.id], content_type: "product", value: item.price, currency: "VND" });
  },
  addToCart(item: Item) {
    const value = item.price * item.quantity;
    ga("add_to_cart", { currency: "VND", value, items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.quantity }] });
    fb("AddToCart", { content_ids: [item.id], content_type: "product", value, currency: "VND" });
  },
  beginCheckout(value: number, items: Item[]) {
    ga("begin_checkout", { currency: "VND", value, items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })) });
    fb("InitiateCheckout", { value, currency: "VND", num_items: items.length });
  },
  purchase(orderCode: string, value: number, orderType: OrderType = "single") {
    ga("purchase", { transaction_id: orderCode, currency: "VND", value, order_type: orderType });
    fb("Purchase", { value, currency: "VND", content_category: orderType });
  },
  /**
   * Phễu đơn nhóm (định vị khách tập thể). Không gửi tên/SĐT – chỉ số đếm và nhãn.
   * group_create -> group_share -> group_view (thành viên mở link) -> group_join -> group_close -> group_checkout -> purchase(order_type=group_link)
   */
  groupCreate(p: { product: string; personalized: boolean }) {
    ga("group_create", { product_slug: p.product, personalized: p.personalized });
    fb("GroupCreate", { content_name: p.product }, true);
  },
  groupShare(method: "share" | "copy") {
    ga("group_share", { method });
  },
  /** Mở trang nhóm: 1 lần / mã nhóm / phiên */
  groupView(code: string, role: "leader" | "member", members: number) {
    if (once(`gv:${code}`)) ga("group_view", { role, members_bucket: bucket(members) });
  },
  groupJoin(p: { role: "leader" | "member"; qty: number; members: number }) {
    ga("group_join", { role: p.role, qty: p.qty, members_bucket: bucket(p.members) });
    if (p.role === "member") fb("GroupJoin", {}, true);
  },
  groupClose(members: number) {
    ga("group_close", { members, members_bucket: bucket(members) });
  },
  groupCheckout(members: number, value: number) {
    ga("group_checkout", { members, members_bucket: bucket(members), currency: "VND", value });
  },
  /** Trang sản phẩm – tab Đặt cho nhóm: nạp danh sách */
  rosterUpload(method: "xlsx" | "csv" | "paste", rows: number, errors: number) {
    ga("roster_upload", { method, rows, rows_bucket: bucket(rows), has_errors: errors > 0 });
  },
  lead(topic: string) {
    ga("generate_lead", { topic });
    fb("Lead", { content_category: topic });
  },
  /** Khối quảng bá trên trang chủ (ô "Dòng sản phẩm"): đo CTR từng ô bằng view_promotion / select_promotion */
  viewPromotion(promos: { id: string; name: string; slot: string }[]) {
    if (!promos.length) return;
    ga("view_promotion", { items: promos.map((p) => ({ promotion_id: p.id, promotion_name: p.name, creative_slot: p.slot })) });
  },
  selectPromotion(p: { id: string; name: string; slot: string; color?: string }) {
    ga("select_promotion", { promotion_id: p.id, promotion_name: p.name, creative_slot: p.slot, creative_name: p.color || "default" });
  },
  /** Tải tài nguyên miễn phí (file mẫu danh sách…) – tên riêng để không trùng file_download tự động của GA4 */
  resourceDownload(file: string, from: string) {
    ga("resource_download", { file_name: file, page: from });
    fb("ResourceDownload", { content_name: file }, true);
  },
  contact(channel: "zalo" | "phone" | "messenger") {
    ga("contact", { channel });
    fb("Contact", { channel });
  },
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid"];
const UTM_STORE = "pod_utm_v1";

/** Lưu UTM lần chạm đầu (first-touch) trong 30 ngày */
export function captureUtm() {
  try {
    const url = new URL(window.location.href);
    const found: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = url.searchParams.get(k);
      if (v) found[k] = v.slice(0, 200);
    }
    if (!Object.keys(found).length) return;
    const existing = readUtm();
    if (existing) return;
    localStorage.setItem(UTM_STORE, JSON.stringify({ ...found, landing: url.pathname, at: Date.now() }));
  } catch {
    /* private mode */
  }
}

export function readUtm(): Record<string, string> | undefined {
  try {
    const raw = localStorage.getItem(UTM_STORE);
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
