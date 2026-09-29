/** 129000 -> "129.000₫" */
export function formatVND(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "";
  return new Intl.NumberFormat("vi-VN").format(Math.round(amount)) + "₫";
}

/** Rút gọn giá: 129000 -> "129K" (dùng cho badge) */
export function formatShortVND(amount: number): string {
  if (amount >= 1_000_000) return `${+(amount / 1_000_000).toFixed(1)}TR`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K`;
  return String(amount);
}

export function discountPercent(price: number, compareAt?: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function formatDateVN(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function formatDateTimeVN(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}
