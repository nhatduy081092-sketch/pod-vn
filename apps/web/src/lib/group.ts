"use client";
import type { OrderDesign, RosterRow } from "@pod/shared";

/** Khoá lưu trên máy: khoá quản lý của trưởng nhóm, khoá sửa từng dòng của thành viên, danh sách mang sang trang sản phẩm */
const ADMIN = (code: string) => `yala-group-admin:${code}`;
const MINE = (code: string) => `yala-group-mine:${code}`;
const ROSTER = (productId: string) => `yala-group-roster:${productId}`;

const safe = <T,>(fn: () => T, fb: T): T => {
  try {
    return fn();
  } catch {
    return fb;
  }
};

export const groupAdminKey = (code: string) => safe(() => localStorage.getItem(ADMIN(code)) ?? "", "");
export const setGroupAdminKey = (code: string, key: string) => safe(() => localStorage.setItem(ADMIN(code), key), undefined);
export const myGroupRows = (code: string): Record<string, string> => safe(() => JSON.parse(localStorage.getItem(MINE(code)) ?? "{}") as Record<string, string>, {});
export function rememberGroupRow(code: string, id: string, key: string | null) {
  const cur = myGroupRows(code);
  if (key) cur[id] = key;
  else delete cur[id];
  safe(() => localStorage.setItem(MINE(code), JSON.stringify(cur)), undefined);
}

/** Danh sách nhóm -> trang sản phẩm (đặt đơn đồng phục) */
export const stashGroupRoster = (productId: string, rows: RosterRow[], code: string) => safe(() => sessionStorage.setItem(ROSTER(productId), JSON.stringify({ rows, code })), undefined);
export function takeGroupRoster(productId: string): { rows: RosterRow[]; code: string } | null {
  return safe(() => {
    const raw = sessionStorage.getItem(ROSTER(productId));
    if (!raw) return null;
    sessionStorage.removeItem(ROSTER(productId));
    return JSON.parse(raw) as { rows: RosterRow[]; code: string };
  }, null);
}

/** Tạo nhóm từ thiết kế đã hoàn tất -> mã nhóm (khoá quản lý lưu sẵn trên máy này) */
export async function createGroup(input: { productId: string; color?: string; title?: string; design: OrderDesign }): Promise<string> {
  const res = await fetch("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ color: "", title: "", ...input }) });
  const data = (await res.json().catch(() => ({}))) as { code?: string; adminKey?: string; error?: string };
  if (!res.ok || !data.code || !data.adminKey) throw new Error(data.error ?? "Không tạo được nhóm, thử lại sau");
  setGroupAdminKey(data.code, data.adminKey);
  return data.code;
}
