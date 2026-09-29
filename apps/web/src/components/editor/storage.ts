"use client";
import type { DesignJson, OrderDesign } from "@pod/shared";
import type { AttachedDesign } from "@/lib/types";

/**
 * Lưu tạm phía trình duyệt:
 * - Bản nháp editor (localStorage) – mở lại vẫn còn
 * - Thiết kế đã hoàn tất gắn vào trang sản phẩm (sessionStorage) – dùng khi thêm giỏ / gửi báo giá
 */
const DRAFT = (productId: string) => `pod_draft:${productId}`;
const ATTACH = (productId: string) => `pod_design:${productId}`;
export const SELLER_DESIGN_KEY = "pod_seller_design";

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function loadDraft(productId: string): { design: DesignJson; savedAt: number } | null {
  return safe(() => {
    const raw = localStorage.getItem(DRAFT(productId));
    return raw ? (JSON.parse(raw) as { design: DesignJson; savedAt: number }) : null;
  }, null);
}

export function saveDraft(productId: string, design: DesignJson) {
  safe(() => localStorage.setItem(DRAFT(productId), JSON.stringify({ design, savedAt: Date.now() })), undefined);
}

export function clearDraft(productId: string) {
  safe(() => localStorage.removeItem(DRAFT(productId)), undefined);
}

export function attachDesign(productId: string, d: OrderDesign, color?: string) {
  const v: AttachedDesign = { ...d, color, updatedAt: Date.now() };
  safe(() => sessionStorage.setItem(ATTACH(productId), JSON.stringify(v)), undefined);
  window.dispatchEvent(new CustomEvent("pod:design", { detail: { productId } }));
}

export function readAttached(productId: string): AttachedDesign | null {
  return safe(() => {
    const raw = sessionStorage.getItem(ATTACH(productId));
    return raw ? (JSON.parse(raw) as AttachedDesign) : null;
  }, null);
}

export function clearAttached(productId: string) {
  safe(() => sessionStorage.removeItem(ATTACH(productId)), undefined);
  window.dispatchEvent(new CustomEvent("pod:design", { detail: { productId } }));
}

export function stashSellerDesign(productId: string, d: OrderDesign) {
  safe(() => sessionStorage.setItem(SELLER_DESIGN_KEY, JSON.stringify({ productId, design: d })), undefined);
}

export function takeSellerDesign(): { productId: string; design: OrderDesign } | null {
  return safe(() => {
    const raw = sessionStorage.getItem(SELLER_DESIGN_KEY);
    return raw ? (JSON.parse(raw) as { productId: string; design: OrderDesign }) : null;
  }, null);
}
