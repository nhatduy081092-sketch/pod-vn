"use client";
/**
 * Tracking wrapper: GA4 (gtag) + Meta Pixel (fbq). Không có ID -> no-op.
 * Sự kiện chuẩn: view_item, add_to_cart, begin_checkout, purchase.
 */
type Item = { id: string; name: string; price: number; quantity: number };

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
  purchase(orderCode: string, value: number) {
    ga("purchase", { transaction_id: orderCode, currency: "VND", value });
    fb("Purchase", { value, currency: "VND" });
  },
  lead(topic: string) {
    ga("generate_lead", { topic });
    fb("Lead", { content_category: topic });
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
