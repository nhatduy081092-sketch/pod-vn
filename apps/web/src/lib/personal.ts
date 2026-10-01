import type { ProductCardData } from "./types";

/** Cá nhân hoá phía trình duyệt: sản phẩm vừa xem + "lối" khách (Cá nhân | Doanh nghiệp). Không gửi dữ liệu cá nhân lên server. */
const RECENT = "yala_recent_v1";
const LANE = "yala_lane";
export const RECENT_EVENT = "yala:recent";

export type RecentItem = Pick<ProductCardData, "id" | "slug" | "name" | "images" | "basePrice" | "compareAtPrice" | "priceFrom" | "salePrice" | "saleEndsAt" | "minQty" | "audience" | "isBestSeller" | "category">;

export function readRecent(): RecentItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT) ?? "[]") as RecentItem[];
    return Array.isArray(v) ? v.filter((x) => x && x.id && x.slug) : [];
  } catch {
    return [];
  }
}

export function pushRecent(p: RecentItem) {
  try {
    const list = [p, ...readRecent().filter((x) => x.id !== p.id)].slice(0, 12);
    localStorage.setItem(RECENT, JSON.stringify(list));
    window.dispatchEvent(new Event(RECENT_EVENT));
  } catch {
    /* ignore */
  }
}

export type Lane = "personal" | "b2b";
export function setLane(lane: Lane) {
  try {
    localStorage.setItem(LANE, lane);
    document.documentElement.dataset.lane = lane;
  } catch {
    /* ignore */
  }
}

/** Gắn vào <head>: đặt data-lane trước khi vẽ trang -> sắp xếp khối không bị nháy */
export const LANE_BOOT_SCRIPT = `try{var l=localStorage.getItem("${LANE}");if(l==="b2b"||l==="personal")document.documentElement.dataset.lane=l}catch(e){}`;

/** Gửi 1 lượt xem / sản phẩm / phiên */
export function sendView(productId: string) {
  try {
    const k = `yala_v_${productId}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch {
    /* vẫn gửi */
  }
  const body = JSON.stringify({ productId });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/events/view", new Blob([body], { type: "application/json" }));
  else void fetch("/api/events/view", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
}
