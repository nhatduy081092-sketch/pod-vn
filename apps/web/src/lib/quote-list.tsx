"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** 1 dòng trong danh sách yêu cầu báo giá (doanh nghiệp) – lưu trên trình duyệt */
export type QuoteItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  quantity: number;
  note: string;
  /** "Từ 120.000đ" / "Liên hệ báo giá" – chỉ để hiển thị */
  priceLabel: string;
};

type Ctx = {
  items: QuoteItem[];
  ready: boolean;
  count: number;
  /** Thêm (cộng dồn số lượng nếu đã có) */
  add: (item: Omit<QuoteItem, "note"> & { note?: string }) => void;
  update: (productId: string, patch: Partial<Pick<QuoteItem, "quantity" | "note">>) => void;
  remove: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
};

const QuoteCtx = createContext<Ctx | null>(null);
const STORE = "yala_rfq_v1";
const MAX_ITEMS = 30;
export const clampQty = (n: number) => Math.max(1, Math.min(1_000_000, Math.floor(n) || 1));

export function QuoteListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) setItems((JSON.parse(raw) as QuoteItem[]).filter((i) => i && i.productId).slice(0, MAX_ITEMS));
    } catch {
      /* ignore */
    }
    setReady(true);
    // đồng bộ giữa các tab
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORE) return;
      try {
        setItems(e.newValue ? (JSON.parse(e.newValue) as QuoteItem[]) : []);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORE, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const add = useCallback<Ctx["add"]>((item) => {
    setItems((prev) => {
      const same = prev.find((p) => p.productId === item.productId);
      if (same) return prev.map((p) => (p === same ? { ...p, quantity: clampQty(p.quantity + item.quantity), note: item.note || p.note } : p));
      if (prev.length >= MAX_ITEMS) return prev;
      return [...prev, { ...item, quantity: clampQty(item.quantity), note: item.note ?? "" }];
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      items,
      ready,
      count: items.length,
      add,
      update: (id, patch) =>
        setItems((prev) => prev.map((p) => (p.productId === id ? { ...p, ...patch, quantity: patch.quantity !== undefined ? clampQty(patch.quantity) : p.quantity } : p))),
      remove: (id) => setItems((prev) => prev.filter((p) => p.productId !== id)),
      clear: () => setItems([]),
      has: (id) => items.some((p) => p.productId === id),
    }),
    [items, ready, add],
  );
  return <QuoteCtx.Provider value={value}>{children}</QuoteCtx.Provider>;
}

export function useQuoteList() {
  const c = useContext(QuoteCtx);
  if (!c) throw new Error("useQuoteList phải nằm trong QuoteListProvider");
  return c;
}
