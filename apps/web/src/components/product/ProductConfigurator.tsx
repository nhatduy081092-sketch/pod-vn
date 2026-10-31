"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { areaExtraPrice, BASIC_COLORS, designFields, displayCompareAt, formatVND, GROUP_MIN_QTY, isAiImage, linePrice, saleActive, TEAM_SIZE_LABEL, type ColorKey, type RosterRow } from "@pod/shared";
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
import { AddToQuote } from "../b2b/AddToQuote";
import { takeGroupRoster } from "@/lib/group";

export function ProductConfigurator({
  product,
  zalo,
  hasSizeGuide = false,
  quote,
}: {
  product: ProductDetail;
  zalo: string;
  hasSizeGuide?: boolean;
  /** Sản phẩm doanh nghiệp: từ ngưỡng số lượng -> gợi ý (hoặc bắt buộc) gửi yêu cầu báo giá */
  quote?: { threshold: number; enforce: boolean };
}) {
  const router = useRouter();
  const cart = useCart();
  const design = useAttachedDesign(product.id);
  const [sel, setSel] = useState(() => defaultVariant(product.variants));
  const [qty, setQty] = useState(Math.max(1, product.minQty));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  // định vị áo nhóm: sản phẩm có size (áo) mở sẵn "Đặt cho nhóm"; khách lẻ bấm "Mua lẻ"
  const [mode, setMode] = useState<"single" | "team">(() => (product.variants.some((v) => v.size) ? "team" : "single"));
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [imgIdx, setImgIdx] = useState(0);

  const variant = product.variants.find((v) => v.color === sel.color && v.size === sel.size) ?? null;
  const blocked = !!quote?.enforce && mode === "single" && qty >= quote.threshold;
  const quoteProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: product.images[0] ?? "",
    priceLabel: `Giá lẻ ${formatVND(product.basePrice)}${product.minQty > 1 ? ` · tối thiểu ${product.minQty}` : ""}`,
  };
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
  // phôi YALA Everyday (ảnh /blanks/<dáng>-<màu>.webp): đổi màu -> ảnh chính đổi theo màu đang chọn
  const colorPhoto = useMemo(() => {
    const g = product.images.map((u) => /\/blanks\/([a-z]+)-[a-z-]+\.webp$/.exec(u)?.[1]).find(Boolean);
    const key = (Object.keys(BASIC_COLORS) as ColorKey[]).find((k) => BASIC_COLORS[k].name === sel.color);
    return g && key ? `/blanks/${g}-${key}.webp` : null;
  }, [product.images, sel.color]);
  const gallery = useMemo(
    () => [...new Set([...(design?.files.map((f) => f.previewUrl) ?? []), ...(colorPhoto ? [colorPhoto] : []), ...product.images])].slice(0, 10),
    [design, product.images, colorPhoto],
  );
  useEffect(() => {
    if (colorPhoto && !design) setImgIdx(0);
  }, [colorPhoto, design]);
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

  // từ trang gom đơn nhóm (/nhom/<mã>): danh sách thành viên có sẵn -> đặt đồng phục ngay
  const [groupCode, setGroupCode] = useState("");
  useEffect(() => {
    const g = takeGroupRoster(product.id);
    if (!g?.rows.length) return;
    setMode("team");
    setRoster(g.rows);
    setGroupCode(g.code);
    setNote((n) => n || `Gom đơn nhóm /nhom/${g.code}`);
  }, [product.id]);

  useEffect(() => {
    track.viewItem({ id: product.id, name: product.name, price: product.basePrice, quantity: 1, category: product.category.name });
  }, [product.id, product.name, product.basePrice, product.category.name]);

  function addToCart() {
    setError("");
    if (mode === "team") {
      if (!roster.length) return setError("Tải file hoặc dán danh sách thành viên trước");
      if (roster.length < product.minQty) return setError(`Đặt tối thiểu ${product.minQty} sản phẩm`);
    } else {
      if (teamFields.length) return setError("Thiết kế có ô tên/số áo – chọn Đặt cho nhóm và nhập tên/số (1 áo cũng được)");
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
      groupCode: team && groupCode ? groupCode : undefined,
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
    track.addToCart({ id: product.id, name: product.name, price: unit, quantity: effQty, category: product.category.name, variant: team ? "team" : [variant?.color, variant?.size].filter(Boolean).join(" / ") || undefined });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    return true;
  }

  const zaloHref = `https://zalo.me/${zalo.replace(/\D/g, "")}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
      {/* Cột trái: ảnh lớn trên nền nhạt (redesign 31/10/2026: không viền, nhãn ≥ 13px) */}
      <div className="md:max-w-[520px] lg:sticky lg:top-28 lg:max-w-none lg:self-start">
        <div className="shutter-in relative aspect-square w-full overflow-hidden rounded-lg bg-surface">
          <img src={assetUrl(gallery[imgIdx] ?? gallery[0])} alt={product.name} className="h-full w-full object-contain" />
          {design && imgIdx < design.files.length && (
            <span className="absolute left-3 top-3 rounded-md bg-ink px-2 py-0.5 text-[13px] font-semibold text-white">Thiết kế của bạn · {design.files[imgIdx]?.name}</span>
          )}
          {isAiImage(gallery[imgIdx] ?? gallery[0]) && (
            <span className="absolute bottom-3 right-3 rounded-md bg-white px-2 py-0.5 text-[13px] font-semibold text-ink/80">Ảnh minh hoạ · in theo đúng file thiết kế</span>
          )}
        </div>
        <Thumbs images={gallery} active={imgIdx} onPick={setImgIdx} name={product.name} />
      </div>

      {/* Cột phải: tuỳ chọn */}
      <div>
        <h1 className="font-display text-[clamp(32px,3.4vw,52px)] font-bold leading-[1.05] tracking-[-0.03em] [text-wrap:balance]">{product.name}</h1>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[clamp(28px,2.6vw,36px)] font-bold tabular-nums">{formatVND(unit)}</span>
          {compareAt && compareAt > unit && <span className="text-base tabular-nums text-ink/60 line-through">{formatVND(compareAt)}</span>}
          {onSale && <span className="rounded-md bg-sale px-2 py-0.5 text-[13px] font-bold text-white">Khuyến mãi</span>}
          {unit < listUnit && <span className="rounded-md bg-ink px-2 py-0.5 text-[13px] font-bold text-white">Giá sỉ</span>}
        </div>
        {onSale && product.saleEndsAt && <SaleCountdown endsAt={product.saleEndsAt} />}
        {product.productionDays && <p className="mt-2 text-base text-ink/80">Thời gian sản xuất: {product.productionDays}</p>}

        {product.priceTiers.length > 0 && (
          <div className="mt-5 rounded-lg bg-surface p-4">
            <p className="text-[15px] font-bold">Giá sỉ theo số lượng (đồng phục, nhóm)</p>
            <ul className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
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
            <p className="mt-3 text-[15px] leading-relaxed text-ink/80">
              Chưa có ý tưởng?{" "}
              <a href={zaloHref} target="_blank" rel="noopener noreferrer" className="font-bold text-zalo underline">
                Gửi ý tưởng qua Zalo
              </a>{" "}
              – bên mình thiết kế & gửi mockup miễn phí. Bạn vẫn có thể đặt trước rồi gửi file sau.
            </p>
          )}
        </div>

        {/* Chế độ đặt */}
        <div className="mt-8 grid grid-cols-2 gap-2" role="tablist" aria-label="Hình thức đặt">
          {(
            [
              ["team", "Đặt cho nhóm", `Từ ${GROUP_MIN_QTY} áo · tên, số, size từng người`],
              ["single", "Mua lẻ", "Chọn màu, size, số lượng"],
            ] as const
          ).map(([m, title, sub]) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => (setMode(m), setError(""))}
              className={`rounded-lg px-4 py-3 text-left transition-colors ${mode === m ? "bg-ink text-white" : "bg-surface text-ink hover:bg-ink/10"}`}
            >
              <span className="block text-base font-bold">{title}</span>
              <span className={`mt-0.5 block text-[13px] leading-snug ${mode === m ? "text-white/80" : "text-ink/70"}`}>{sub}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <VariantPicker variants={product.variants} color={sel.color} size={sel.size} onChange={setSel} hideSize={mode === "team"} sizeGuide={hasSizeGuide} step={{ color: "2. Màu", size: "3. Size" }} />
        </div>

        {mode === "single" && teamFields.length > 0 && (
          <p className="mt-4 rounded-lg bg-navy-light px-4 py-3 text-[15px] text-navy-dark">
            Thiết kế có ô <b>tên/số áo</b> – chọn <b>Đặt cho nhóm</b> để nhập tên, số từng người (đặt 1 áo cũng được).
          </p>
        )}
        {mode === "team" && groupCode && (
          <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-[15px] text-green-800">
            Đã lấy {roster.length} áo từ danh sách nhóm. Kiểm tra lại tên/size rồi thêm vào giỏ.{" "}
            <a href={`/nhom/${groupCode}`} className="font-bold underline">
              Quay lại nhóm
            </a>
          </p>
        )}
        {mode === "team" && !roster.length && !groupCode && (
          <p className="mt-4 rounded-lg bg-sun/40 px-4 py-3 text-[15px] leading-relaxed">
            Chưa có danh sách? Thiết kế xong bấm <b>Hoàn tất → Tạo link gom đơn nhóm</b>: gửi link vào nhóm chat, mỗi người tự ghi tên, số, size – bạn chỉ việc chốt đơn.
          </p>
        )}
        {mode === "team" && roster.length > 0 && roster.length < GROUP_MIN_QTY && (
          <p className="mt-4 rounded-lg bg-surface px-4 py-3 text-[15px]">
            Thêm {GROUP_MIN_QTY - roster.length} áo nữa để thành đơn nhóm (từ {GROUP_MIN_QTY} áo). Ít hơn vẫn đặt được, tính như mua lẻ.
          </p>
        )}
        {mode === "team" && <TeamOrderPanel sizes={teamSizes} productSlug={product.slug} rows={roster} onChange={setRoster} />}
        {mode === "team" && design && teamFields.length > 0 && <TeamPreview areas={product.printAreas} design={design} rows={roster} garmentColor={garmentHex} />}

        {/* Số lượng */}
        <section className="mt-6">
          {mode === "single" ? (
            <>
              <h2 className="label">4. Số lượng</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center overflow-hidden rounded-md bg-surface">
                  <button type="button" className="h-11 w-11 text-lg font-bold hover:bg-ink/10" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Giảm">
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={1000}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
                    className="h-11 w-16 bg-white text-center text-base font-bold tabular-nums outline-none focus:ring-2 focus:ring-brand/40"
                    aria-label="Số lượng"
                  />
                  <button type="button" className="h-11 w-11 text-lg font-bold hover:bg-ink/10" onClick={() => setQty((q) => Math.min(1000, q + 1))} aria-label="Tăng">
                    +
                  </button>
                </div>
                <p className="text-base text-ink/80">
                  Tạm tính: <b className="tabular-nums text-ink">{formatVND(unit * qty)}</b>
                </p>
              </div>
              {variant?.sku && <p className="mt-1.5 text-[13px] text-ink/60">Mã phân loại: {variant.sku}</p>}
            </>
          ) : (
            <p className="rounded-lg bg-surface px-4 py-3 text-base">
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

        {error && <p className="mt-3 rounded-md bg-red-50 px-4 py-3 text-[15px] font-semibold text-red-700">{error}</p>}

        {quote && mode === "single" && qty >= quote.threshold && (
          <div className="mt-4 rounded-lg bg-brand-light p-4 text-[15px]">
            <p className="text-base font-bold">Đơn từ {quote.threshold} sản phẩm – nhận giá số lượng lớn</p>
            <p className="mt-1 text-ink/80">
              Gửi yêu cầu báo giá để được giá tốt hơn, tư vấn in/khắc logo và mockup miễn phí{quote.enforce ? " (đơn số lượng này không đặt online)." : "."}
            </p>
            <AddToQuote variant="primary" className="mt-2.5" quantity={qty} product={quoteProduct} />
          </div>
        )}

        <div className={`sticky bottom-0 z-10 -mx-4 mt-6 flex gap-2 bg-white px-4 py-3 md:static md:mx-0 md:p-0 ${blocked ? "hidden" : ""}`}>
          <button type="button" onClick={addToCart} className="btn-outline flex-1 py-3.5 text-base">
            {added ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (addToCart()) router.push("/thanh-toan");
            }}
            className="btn-primary flex-1 py-3.5 text-base"
          >
            Đặt ngay
          </button>
        </div>
        {quote && !(mode === "single" && qty >= quote.threshold) && (
          <AddToQuote variant="compact" className="mt-2" quantity={Math.max(qty, quote.threshold)} product={quoteProduct} />
        )}
        {!design && <p className="mt-3 text-[15px] text-ink/70">Đặt khi chưa có thiết kế: bên mình liên hệ qua Zalo để nhận file trước khi in.</p>}

        {/* thông số + cam kết: bảng 2 cột nền nhạt, không dấu tích */}
        <dl className="mt-8 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 rounded-lg bg-surface p-5 text-base">
          <dt className="font-semibold">Chất liệu</dt>
          <dd className="text-ink/80">{product.material || "—"}</dd>
          <dt className="font-semibold">Công nghệ in</dt>
          <dd className="text-ink/80">{product.printMethod}</dd>
          <dt className="font-semibold">Đặt tối thiểu</dt>
          <dd className="text-ink/80">{product.minQty} sản phẩm</dd>
          <dt className="font-semibold">Cam kết</dt>
          <dd className="text-ink/80">Duyệt mockup trước khi in · Đổi mới nếu lỗi in · COD toàn quốc</dd>
        </dl>
      </div>
    </div>
  );
}

function TierCell({ label, price, active }: { label: string; price: number; active: boolean }) {
  return (
    <li className={`rounded-md px-3 py-2 ${active ? "bg-ink text-white" : "bg-white"}`}>
      <p className={`text-[13px] ${active ? "text-white/80" : "text-ink/70"}`}>{label}</p>
      <p className="text-base font-bold tabular-nums">{formatVND(price)}</p>
    </li>
  );
}
