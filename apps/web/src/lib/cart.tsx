"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { linePrice, type OrderDesign, type PriceTier, type PrintMode, type RosterRow } from "@pod/shared";

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  basePrice: number;
  priceTiers: PriceTier[];
  minQty: number;
  designUrl: string; // "/uploads/..." hoặc ""
  designPreview: string; // URL đầy đủ để hiển thị
  printMode: PrintMode;
  designNote: string;
  roster?: RosterRow[]; // đồng phục nhóm: quantity = roster.length
  /** Biến thể (màu × size) */
  variantId?: string;
  sku?: string;
  /** Thiết kế từ editor: file in + ảnh xem trước từng mặt */
  design?: OrderDesign;
  /** Phụ phí biến thể / mặt in thêm (đ/sp) */
  variantDelta?: number;
  areaExtras?: number;
  /** Đồng phục nhóm: phụ phí theo size (VD 3XL +20.000) */
  sizeDeltas?: Record<string, number>;
  /** Khuyến mãi có hạn tại thời điểm thêm giỏ – server vẫn kiểm tra lại */
  salePrice?: number | null;
  saleEndsAt?: string | null;
};

type CartCtx = {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "key">) => void;
  updateQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  unitPrice: (item: CartItem) => number;
  lineTotal: (item: CartItem) => number;
};

const Ctx = createContext<CartCtx | null>(null);
const STORE = "pod_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORE, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  // Giá sỉ tính theo TỔNG số lượng của cùng 1 sản phẩm (khớp logic server)
  const qtyByProduct = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) m.set(i.productId, (m.get(i.productId) ?? 0) + i.quantity);
    return m;
  }, [items]);

  // Cùng công thức với server (packages/shared/pricing.ts → linePrice)
  const unitPrice = useCallback(
    (i: CartItem) =>
      linePrice({
        product: { basePrice: i.basePrice, salePrice: i.salePrice, saleEndsAt: i.saleEndsAt, priceTiers: i.priceTiers },
        totalQty: qtyByProduct.get(i.productId) ?? i.quantity,
        variantDelta: i.variantDelta ?? 0,
        areaExtras: i.areaExtras ?? 0,
      }),
    [qtyByProduct],
  );

  const lineTotal = useCallback(
    (i: CartItem) => {
      if (i.roster?.length && i.sizeDeltas) {
        const base = unitPrice({ ...i, variantDelta: 0 });
        return i.roster.reduce((s, r) => s + base + (i.sizeDeltas?.[r.size] ?? 0), 0);
      }
      return unitPrice(i) * i.quantity;
    },
    [unitPrice],
  );

  const add = useCallback((item: Omit<CartItem, "key">) => {
    setItems((prev) => {
      const newItem = { ...item, key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
      if (item.roster?.length) return [...prev, newItem]; // danh sách đồng phục luôn là 1 dòng riêng
      const same = prev.find(
        (p) =>
          p.productId === item.productId &&
          p.size === item.size &&
          p.color === item.color &&
          (p.variantId ?? "") === (item.variantId ?? "") &&
          p.designUrl === item.designUrl &&
          (p.design?.files[0]?.printUrl ?? "") === (item.design?.files[0]?.printUrl ?? "") &&
          p.printMode === item.printMode &&
          p.designNote === item.designNote,
      );
      if (same) return prev.map((p) => (p === same ? { ...p, quantity: Math.min(1000, p.quantity + item.quantity) } : p));
      return [...prev, newItem];
    });
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + lineTotal(i), 0),
      add,
      updateQty: (key, qty) =>
        setItems((prev) =>
          prev.map((p) => (p.key === key && !p.roster?.length ? { ...p, quantity: Math.max(1, Math.min(1000, Math.floor(qty) || 1)) } : p)),
        ),
      remove: (key) => setItems((prev) => prev.filter((p) => p.key !== key)),
      clear: () => setItems([]),
      unitPrice,
      lineTotal,
    }),
    [items, ready, add, unitPrice, lineTotal],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart phải nằm trong CartProvider");
  return ctx;
}
