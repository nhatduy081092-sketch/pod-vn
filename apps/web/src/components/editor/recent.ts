"use client";
/** Sản phẩm thiết kế gần đây (lưu trên máy khách, tối đa 12) */
export type RecentProduct = { id: string; slug: string; name: string; image: string; at: number };
const KEY = "yala-recent-designs";

export function readRecent(): RecentProduct[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(v) ? (v as RecentProduct[]).filter((x) => x && typeof x.slug === "string").slice(0, 12) : [];
  } catch {
    return [];
  }
}

export function pushRecent(p: Omit<RecentProduct, "at">) {
  try {
    const next = [{ ...p, at: Date.now() }, ...readRecent().filter((x) => x.id !== p.id)].slice(0, 12);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* chế độ riêng tư */
  }
}
