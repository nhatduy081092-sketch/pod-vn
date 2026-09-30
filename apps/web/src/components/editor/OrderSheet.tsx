"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { areaExtraPrice, formatVND, linePrice, type OrderDesign } from "@pod/shared";
import { useCart } from "@/lib/cart";
import { assetUrl } from "@/lib/config";
import { track } from "@/lib/track";
import type { ProductDetail } from "@/lib/types";

/**
 * Đặt ngay trong công cụ thiết kế: chọn màu + số lượng từng size -> thêm giỏ (mỗi size 1 dòng).
 * Giá sỉ tính theo tổng số lượng của sản phẩm (giỏ hàng + server tính lại).
 */
export function OrderSheet({
  product,
  design,
  initialColor,
  initialSize,
  onProductPage,
  onClose,
}: {
  product: ProductDetail;
  design: OrderDesign;
  initialColor?: string | null;
  initialSize?: string | null;
  onProductPage: () => void;
  onClose: () => void;
}) {
  const cart = useCart();
  const colors = useMemo(() => [...new Set(product.variants.map((v) => v.color))], [product.variants]);
  const [color, setColor] = useState(initialColor && colors.includes(initialColor) ? initialColor : (colors[0] ?? ""));
  const variants = product.variants.filter((v) => v.color === color);
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const first = variants.find((v) => v.size === initialSize) ?? variants[0];
    return first ? { [first.size]: Math.max(1, product.minQty) } : {};
  });
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const total = Object.values(qty).reduce((s, n) => s + n, 0);
  const areaExtras = areaExtraPrice(product.printAreas, design.files.map((f) => f.area));
  const priceSrc = { basePrice: product.basePrice, salePrice: product.salePrice, saleEndsAt: product.saleEndsAt, priceTiers: product.priceTiers };
  const unit = (delta: number) => linePrice({ product: priceSrc, totalQty: Math.max(1, total), variantDelta: delta, areaExtras });
  const sum = variants.reduce((s, v) => s + (qty[v.size] ?? 0) * unit(v.priceDelta), 0);
  const hex = product.variants.find((v) => v.color === color && /^#[0-9a-f]{6}$/i.test(v.colorHex))?.colorHex;

  function add() {
    setError("");
    if (!total) return setError("Nhập số lượng ít nhất 1 size");
    if (total < product.minQty) return setError(`Đặt tối thiểu ${product.minQty} sản phẩm`);
    for (const v of variants) {
      const n = qty[v.size] ?? 0;
      if (!n) continue;
      cart.add({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: design.files[0]?.previewUrl ?? product.images[0] ?? "",
        size: v.size || "Free size",
        color: v.color,
        quantity: n,
        basePrice: product.basePrice,
        priceTiers: product.priceTiers,
        salePrice: product.salePrice ?? null,
        saleEndsAt: product.saleEndsAt ?? null,
        minQty: 1,
        variantId: v.id,
        sku: v.sku,
        variantDelta: v.priceDelta,
        areaExtras,
        design,
        designUrl: design.files[0]?.printUrl ?? "",
        designPreview: design.files[0] ? assetUrl(design.files[0].previewUrl) : "",
        printMode: "FILL",
        designNote: "",
      });
    }
    track.addToCart({ id: product.id, name: product.name, price: unit(0), quantity: total });
    setAdded(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="order-title">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        {added ? (
          <>
            <h2 id="order-title" className="text-lg font-black">
              ✓ Đã thêm {total} sản phẩm vào giỏ
            </h2>
            <p className="mt-1 text-sm text-ink/70">Thiết kế và file in đã được gắn vào từng dòng trong giỏ hàng.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="btn border-ink/20 bg-white" onClick={onClose}>
                Thiết kế tiếp
              </button>
              <Link href="/gio-hang" className="btn border-ink bg-brand">
                Xem giỏ hàng
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-3">
              {design.files[0] && <img src={assetUrl(design.files[0].previewUrl)} alt="" className="h-20 w-20 shrink-0 rounded-lg border border-ink/10 object-contain" />}
              <div className="min-w-0">
                <h2 id="order-title" className="text-lg font-black leading-tight">
                  Đặt ngay
                </h2>
                <p className="truncate text-sm text-ink/70">{product.name}</p>
                <p className="text-xs text-ink/55">{design.files.length} mặt in · xưởng in đúng file thiết kế</p>
              </div>
            </div>

            {colors.length > 1 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-ink/70">Màu: {color}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {colors.map((c) => {
                    const h = product.variants.find((v) => v.color === c)?.colorHex;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setColor(c);
                          setQty({});
                        }}
                        className={`flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-xs font-bold ${color === c ? "border-ink bg-brand" : "border-ink/15"}`}
                      >
                        {h && /^#[0-9a-f]{6}$/i.test(h) && <span className="h-3.5 w-3.5 rounded-full border border-ink/20" style={{ background: h }} />}
                        {c}
                      </button>
                    );
                  })}
                </div>
                {hex && <p className="mt-1 text-[11px] text-ink/55">Ảnh xem trước được tạo với màu đã chọn trong công cụ thiết kế.</p>}
              </div>
            )}

            <div className="mt-4">
              <p className="text-xs font-bold text-ink/70">Số lượng theo size</p>
              <ul className="mt-1 divide-y divide-ink/10 rounded-lg border border-ink/10">
                {variants.map((v) => (
                  <li key={v.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                    <span className="w-24 truncate font-bold">{v.size || "Free size"}</span>
                    <span className="flex-1 text-xs text-ink/60">
                      {formatVND(unit(v.priceDelta))}
                      {v.priceDelta ? ` (+${formatVND(v.priceDelta)})` : ""}
                    </span>
                    <div className="flex items-center">
                      <button type="button" className="h-8 w-8 rounded-l-md border border-ink/20 font-bold" onClick={() => setQty((q) => ({ ...q, [v.size]: Math.max(0, (q[v.size] ?? 0) - 1) }))} aria-label={`Bớt ${v.size}`}>
                        −
                      </button>
                      <input
                        inputMode="numeric"
                        value={qty[v.size] ?? 0}
                        onChange={(e) => setQty((q) => ({ ...q, [v.size]: Math.min(9999, Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0)) }))}
                        className="h-8 w-12 border-y border-ink/20 text-center text-sm font-bold"
                        aria-label={`Số lượng ${v.size}`}
                      />
                      <button type="button" className="h-8 w-8 rounded-r-md border border-ink/20 font-bold" onClick={() => setQty((q) => ({ ...q, [v.size]: (q[v.size] ?? 0) + 1 }))} aria-label={`Thêm ${v.size}`}>
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-sm text-ink/70">
                {total} sản phẩm{unit(0) < linePrice({ product: priceSrc, totalQty: 1, areaExtras }) ? " · đã áp giá sỉ" : ""}
              </span>
              <span className="text-xl font-black">{formatVND(sum)}</span>
            </div>
            {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="btn border-ink/20 bg-white px-2 text-sm" onClick={onProductPage}>
                Trang sản phẩm
              </button>
              <button type="button" className="btn border-ink bg-brand px-2 text-sm" onClick={add}>
                Thêm vào giỏ
              </button>
            </div>
            <button type="button" className="mt-2 w-full text-center text-xs text-ink/60 underline" onClick={onClose}>
              Quay lại chỉnh thiết kế
            </button>
          </>
        )}
      </div>
    </div>
  );
}
