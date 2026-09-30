"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { areaExtraPrice, designFields, displayCompareAt, formatVND, isAiImage, linePrice, saleActive, TEAM_SIZE_LABEL, type RosterRow } from "@pod/shared";
import { useCart } from "@/lib/cart";
import { assetUrl } from "@/lib/config";
import { track } from "@/lib/track";
import type { ProductDetail } from "@/lib/types";
import { TeamOrderPanel } from "./TeamOrderPanel";
import { Thumbs } from "./ProductGallery";
import { VariantPicker, defaultVariant } from "./VariantPicker";
import { DesignCard, useAttachedDesign } from "./DesignCard";
import { SaleCountdown } from "./SaleCountdown";
import { TeamPreview } from "./TeamPreview";

export function ProductConfigurator({ product, zalo, hasSizeGuide = false }: { product: ProductDetail; zalo: string; hasSizeGuide?: boolean }) {
  const router = useRouter();
  const cart = useCart();
  const design = useAttachedDesign(product.id);
  const [sel, setSel] = useState(() => defaultVariant(product.variants));
  const [qty, setQty] = useState(Math.max(1, product.minQty));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [mode, setMode] = useState<"single" | "team">("single");
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [imgIdx, setImgIdx] = useState(0);

  const variant = product.variants.find((v) => v.color === sel.color && v.size === sel.size) ?? null;
  const colorVariants = product.variants.filter((v) => v.color === sel.color);
  const teamSizes = (colorVariants.length ? colorVariants : product.variants).map((v) => v.size).filter(Boolean);
  const teamFields = design ? designFields(design.json) : [];
  const garmentHex = product.variants.find((v) => v.color === sel.color && /^#[0-9a-f]{6}$/i.test(v.colorHex))?.colorHex ?? null;
  const areaExtras = design ? areaExtraPrice(product.printAreas, design.files.map((f) => f.area)) : 0;
  const effQty = mode === "team" ? roster.length : qty;
  const priceSrc = { basePrice: product.basePrice, salePrice: product.salePrice, saleEndsAt: product.saleEndsAt, priceTiers: product.priceTiers };
  const unit = linePrice({ product: priceSrc, totalQty: Math.max(1, effQty), variantDelta: mode === "team" ? 0 : (variant?.priceDelta ?? 0), areaExtras });
  const listUnit = linePrice({ product: priceSrc, totalQty: 1, variantDelta: mode === "team" ? 0 : (variant?.priceDelta ?? 0), areaExtras });
  const onSale = saleActive(priceSrc);
  const compareAt = displayCompareAt({ ...priceSrc, compareAtPrice: product.compareAtPrice });
  const sizeDeltas = useMemo(() => Object.fromEntries(colorVariants.filter((v) => v.priceDelta).map((v) => [v.size, v.priceDelta])), [colorVariants]);
  const teamTotal = roster.reduce((s, r) => s + unit + (sizeDeltas[r.size] ?? 0), 0);

  // Ảnh bên trái: ảnh xem trước thiết kế (nếu có) rồi đến ảnh sản phẩm
  const gallery = useMemo(() => [...(design?.files.map((f) => f.previewUrl) ?? []), ...product.images].slice(0, 10), [design, product.images]);
  useEffect(() => setImgIdx(0), [design?.updatedAt]);
  // ?mau=Đen (từ khối "Dòng sản phẩm" / trang danh mục) -> chọn sẵn màu đó. Đọc ở client để trang vẫn tĩnh (ISR).
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get("mau")?.trim().toLowerCase();
    if (!want) return;
    const v = product.variants.find((x) => x.color.toLowerCase() === want && x.size === sel.size) ?? product.variants.find((x) => x.color.toLowerCase() === want);
    if (v) setSel({ color: v.color, size: v.size });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);
  // màu áo đã chọn trong công cụ thiết kế -> chọn sẵn phân loại màu đó
  useEffect(() => {
    const c = design?.color;
    if (!c || c === sel.color) return;
    const v = product.variants.find((x) => x.color === c && x.size === sel.size) ?? product.variants.find((x) => x.color === c);
    if (v) setSel({ color: v.color, size: v.size });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design?.updatedAt]);
  // thiết kế có ô tên/số -> chuyển sang đặt đồng phục (nhập tên/số từng áo)
  useEffect(() => {
    if (teamFields.length) setMode("team");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design?.updatedAt]);

  useEffect(() => {
    track.viewItem({ id: product.id, name: product.name, price: product.basePrice, quantity: 1 });
  }, [product.id, product.name, product.basePrice]);

  function addToCart() {
    setError("");
    if (mode === "team") {
      if (!roster.length) return setError("Tải file hoặc dán danh sách thành viên trước");
      if (roster.length < product.minQty) return setError(`Đặt tối thiểu ${product.minQty} sản phẩm`);
    } else {
      if (teamFields.length) return setError("Thiết kế có ô tên/số áo – chọn Đồng phục nhóm và nhập tên/số (1 áo cũng được)");
      if (product.variants.length && !variant) return setError("Vui lòng chọn phân loại (màu / size)");
      if (qty < product.minQty) return setError(`Đặt tối thiểu ${product.minQty} sản phẩm`);
    }
    const team = mode === "team";
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: design?.files[0]?.previewUrl ?? product.images[0] ?? "",
      size: team ? TEAM_SIZE_LABEL : sel.size || "Free size",
      color: sel.color,
      quantity: team ? roster.length : qty,
      roster: team ? roster : undefined,
      sizeDeltas: team ? sizeDeltas : undefined,
      basePrice: product.basePrice,
      priceTiers: product.priceTiers,
      salePrice: product.salePrice ?? null,
      saleEndsAt: product.saleEndsAt ?? null,
      minQty: product.minQty,
      variantId: team ? undefined : variant?.id,
      sku: team ? undefined : variant?.sku,
      variantDelta: team ? 0 : (variant?.priceDelta ?? 0),
      areaExtras,
      design: design ? { json: design.json, files: design.files } : undefined,
      designUrl: design?.files[0]?.printUrl ?? "",
      designPreview: design?.files[0] ? assetUrl(design.files[0].previewUrl) : "",
      printMode: "FILL",
      designNote: note,
    });
    track.addToCart({ id: product.id, name: product.name, price: unit, quantity: effQty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    return true;
  }

  const zaloHref = `https://zalo.me/${zalo.replace(/\D/g, "")}`;

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-10">
      {/* Cột trái: ảnh */}
      <div className="md:sticky md:top-20 md:self-start">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-ink bg-white">
          <img src={assetUrl(gallery[imgIdx] ?? gallery[0])} alt={product.name} className="h-full w-full object-contain" />
          {design && imgIdx < design.files.length && (
            <span className="absolute left-2 top-2 rounded bg-ink px-2 py-0.5 text-[11px] font-bold text-brand-badge">Thiết kế của bạn · {design.files[imgIdx]?.name}</span>
          )}
          {isAiImage(gallery[imgIdx] ?? gallery[0]) && (
            <span className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink/75">Ảnh minh hoạ · sản phẩm in theo đúng file thiết kế</span>
          )}
        </div>
        <Thumbs images={gallery} active={imgIdx} onPick={setImgIdx} name={product.name} />
      </div>

      {/* Cột phải: tuỳ chọn */}
      <div>
        <p className="text-sm font-semibold text-brand-dark">{product.category.name}</p>
        <h1 className="mt-1 text-xl font-black leading-snug md:text-3xl">{product.name}</h1>
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-3xl font-black">{formatVND(unit)}</span>
          {compareAt && compareAt > unit && <span className="text-sm text-ink/50 line-through">{formatVND(compareAt)}</span>}
          {onSale && <span className="rounded bg-[#e11d48] px-1.5 py-0.5 text-xs font-bold text-white">KHUYẾN MÃI</span>}
          {unit < listUnit && <span className="rounded bg-ink px-1.5 py-0.5 text-xs font-bold text-brand-badge">Giá sỉ</span>}
        </div>
        {onSale && product.saleEndsAt && <SaleCountdown endsAt={product.saleEndsAt} />}
        {product.productionDays && <p className="mt-1 text-sm text-ink/70">⏱ Thời gian sản xuất: {product.productionDays}</p>}

        {product.priceTiers.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border-2 border-ink">
            <p className="bg-brand px-3 py-1.5 text-xs font-extrabold uppercase">Giá sỉ theo số lượng (đồng phục, nhóm)</p>
            <ul className="grid grid-cols-2 divide-x divide-y divide-ink/10 text-sm sm:grid-cols-4">
              <TierCell label={`1–${product.priceTiers[0]!.minQty - 1} cái`} price={product.basePrice} active={effQty < product.priceTiers[0]!.minQty} />
              {product.priceTiers.map((t, i) => {
                const next = product.priceTiers[i + 1];
                return <TierCell key={t.minQty} label={next ? `${t.minQty}–${next.minQty - 1} cái` : `${t.minQty}+ cái`} price={t.price} active={effQty >= t.minQty && (!next || effQty < next.minQty)} />;
              })}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <DesignCard slug={product.slug} productId={product.id} areas={product.printAreas} design={design} step="1. Thiết kế" color={sel.color} />
          {!design && (
            <p className="mt-2 text-xs text-ink/70">
              Chưa có ý tưởng?{" "}
              <a href={zaloHref} target="_blank" rel="noopener noreferrer" className="font-bold text-zalo underline">
                Gửi ý tưởng qua Zalo
              </a>{" "}
              – bên mình thiết kế & gửi mockup miễn phí. Bạn vẫn có thể đặt trước rồi gửi file sau.
            </p>
          )}
        </div>

        {/* Chế độ đặt */}
        <div className="mt-5 grid grid-cols-2 gap-2" role="tablist" aria-label="Hình thức đặt">
          {(
            [
              ["single", "Đặt lẻ", "Chọn phân loại & số lượng"],
              ["team", "Đồng phục nhóm", "Tải danh sách tên, số, size"],
            ] as const
          ).map(([m, title, sub]) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => (setMode(m), setError(""))}
              className={`rounded-lg border-2 px-3 py-2 text-left ${mode === m ? "border-ink bg-brand" : "border-ink/20 bg-white"}`}
            >
              <span className="block text-sm font-extrabold">{title}</span>
              <span className="block text-[11px] text-ink/70">{sub}</span>
            </button>
          ))}
        </div>

        <div className="mt-5">
          <VariantPicker variants={product.variants} color={sel.color} size={sel.size} onChange={setSel} hideSize={mode === "team"} sizeGuide={hasSizeGuide} step={{ color: "2. Màu", size: "2. Size" }} />
        </div>

        {mode === "single" && teamFields.length > 0 && (
          <p className="mt-4 rounded-lg bg-navy-light px-3 py-2 text-sm text-navy-dark">
            Thiết kế có ô <b>tên/số áo</b> – chọn <b>Đồng phục nhóm</b> để nhập tên, số từng người (đặt 1 áo cũng được).
          </p>
        )}
        {mode === "team" && <TeamOrderPanel sizes={teamSizes} productSlug={product.slug} rows={roster} onChange={setRoster} />}
        {mode === "team" && design && teamFields.length > 0 && <TeamPreview areas={product.printAreas} design={design} rows={roster} garmentColor={garmentHex} />}

        {/* Số lượng */}
        <section className="mt-5">
          {mode === "single" ? (
            <>
              <h2 className="label">3. Số lượng</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center overflow-hidden rounded-md border-2 border-ink">
                  <button type="button" className="h-10 w-10 text-lg font-bold" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Giảm">
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={1000}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
                    className="h-10 w-16 border-x-2 border-ink text-center font-bold outline-none"
                    aria-label="Số lượng"
                  />
                  <button type="button" className="h-10 w-10 text-lg font-bold" onClick={() => setQty((q) => Math.min(1000, q + 1))} aria-label="Tăng">
                    +
                  </button>
                </div>
                <p className="text-sm text-ink/70">
                  Tạm tính: <b className="text-ink">{formatVND(unit * qty)}</b>
                </p>
              </div>
              {variant?.sku && <p className="mt-1 text-[11px] text-ink/50">Mã phân loại: {variant.sku}</p>}
            </>
          ) : (
            <p className="rounded-lg bg-cream px-3 py-2 text-sm">
              {roster.length ? (
                <>
                  <b>{roster.length} áo</b> · Tổng <b className="text-base">{formatVND(teamTotal)}</b>
                </>
              ) : (
                "Tải danh sách để xem tổng tiền và giá sỉ."
              )}
            </p>
          )}
          <label className="mt-3 block">
            <span className="label">Ghi chú cho xưởng (tuỳ chọn)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 250))} rows={2} placeholder="VD: in đậm màu hơn, gấp gói riêng từng áo..." className="input" />
          </label>
        </section>

        {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

        <div className="sticky bottom-0 z-10 -mx-4 mt-5 flex gap-2 border-t border-ink/10 bg-white px-4 py-3 md:static md:mx-0 md:border-0 md:p-0">
          <button type="button" onClick={addToCart} className="btn-outline flex-1">
            {added ? "✓ Đã thêm" : "Thêm vào giỏ"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (addToCart()) router.push("/thanh-toan");
            }}
            className="btn-primary flex-1"
          >
            Đặt ngay
          </button>
        </div>
        {!design && <p className="mt-2 text-center text-xs text-ink/60">Đặt khi chưa có thiết kế: bên mình liên hệ qua Zalo để nhận file trước khi in.</p>}

        <ul className="mt-6 space-y-1.5 rounded-lg bg-cream p-4 text-sm">
          <li>
            <b>Chất liệu:</b> {product.material || "—"}
          </li>
          <li>
            <b>Công nghệ in:</b> {product.printMethod}
          </li>
          <li>
            <b>Đặt tối thiểu:</b> {product.minQty} sản phẩm
          </li>
          <li>✓ Duyệt mockup trước khi in · ✓ Đổi mới nếu lỗi in · ✓ COD toàn quốc</li>
        </ul>
      </div>
    </div>
  );
}

function TierCell({ label, price, active }: { label: string; price: number; active: boolean }) {
  return (
    <li className={`px-3 py-2 ${active ? "bg-brand-badge/60" : ""}`}>
      <p className="text-xs text-ink/60">{label}</p>
      <p className="font-extrabold">{formatVND(price)}</p>
    </li>
  );
}
