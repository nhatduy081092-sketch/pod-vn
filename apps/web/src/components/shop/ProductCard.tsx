import Link from "next/link";
import { discountPercent, displayCompareAt, effectiveBasePrice, formatVND, isAiImage, saleActive } from "@pod/shared";
import type { ProductCardData } from "@/lib/types";
import { Img } from "../ui/Img";
import { ZoomFrame } from "./ZoomFrame";

const isVector = (u?: string) => !!u && /\.svg(\?|$)/i.test(u);

/**
 * Card sản phẩm: ảnh "nổi" (nền chiếu sáng + bóng đổ), rê chuột -> khung nhấc lên kiểu sticker
 * và phóng to đúng chỗ con trỏ. Ảnh vẽ (SVG) giữ nguyên tỉ lệ; ảnh chụp phủ kín khung.
 */
export function ProductCard({ p, priority = false, color }: { p: ProductCardData; priority?: boolean; /** màu khách đã chọn -> chọn sẵn ở trang sản phẩm */ color?: string }) {
  const sale = saleActive(p);
  const price = p.basePrice > 0 ? effectiveBasePrice(p) : 0;
  const compare = p.basePrice > 0 ? displayCompareAt(p) : null;
  const off = compare ? discountPercent(price, compare) : 0;
  const isNew = !!p.newUntil && new Date(p.newUntil).getTime() > Date.now();
  const [first, second] = p.images;
  const hasSecond = !!second && second !== first;
  const fit = (u?: string) => (isVector(u) ? "object-contain p-[6%]" : "object-cover");
  const SIZES = "(min-width:1280px) 440px, (min-width:768px) 45vw, 70vw"; // dư ~1,6× để phóng to vẫn nét
  return (
    <Link href={color ? `/san-pham/${p.slug}?mau=${encodeURIComponent(color)}` : `/san-pham/${p.slug}`} className="product-card group block">
      <ZoomFrame className="relative aspect-square overflow-hidden rounded-2xl border-2 border-transparent bg-surface transition-[transform,box-shadow,border-color] duration-200 [@media(hover:hover)]:group-hover:-translate-x-0.5 [@media(hover:hover)]:group-hover:-translate-y-1 [@media(hover:hover)]:group-hover:border-ink [@media(hover:hover)]:group-hover:shadow-sticker">
        {/* nền chiếu sáng nhẹ + bóng đổ dưới sản phẩm -> ảnh "nổi" khỏi nền */}
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_42%,#fff_0%,transparent_70%)]" aria-hidden />
        <Img
          src={first}
          alt={p.name}
          priority={priority}
          sizes={SIZES}
          className={`zoom-img ${fit(first)} ${isVector(first) ? "drop-shadow-[0_18px_16px_rgba(29,29,31,.22)]" : ""}`}
        />
        {(isNew || off > 0) && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex gap-1.5">
            {off > 0 && <span className="-rotate-3 rounded-lg border-2 border-ink bg-sale px-2 py-0.5 text-[11px] font-bold text-white shadow-sticker-sm md:text-xs">-{off}%</span>}
            {isNew && <span className="rotate-2 rounded-lg border-2 border-ink bg-sun px-2 py-0.5 text-[11px] font-bold text-ink shadow-sticker-sm md:text-xs">Mới</span>}
          </span>
        )}
        {hasSecond && (
          <span className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-ink/70 md:text-[11px]">
            +{p.images.length - 1} ảnh
          </span>
        )}
        {isAiImage(first) && <span className="pointer-events-none absolute bottom-1.5 left-1.5 z-10 rounded bg-white/85 px-1 py-px text-[9px] font-medium text-ink/65 md:text-[10px]">Ảnh minh hoạ</span>}
      </ZoomFrame>
      <h3 className="mt-3 line-clamp-2 min-h-[2.6em] text-[13px] font-medium leading-[1.3] text-ink transition-colors group-hover:text-brand-dark md:text-[15px]">{p.name}</h3>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
        {p.basePrice > 0 ? (
          <span className={`text-[15px] font-semibold md:text-base ${sale || off > 0 ? "text-sale" : "text-ink"}`}>{formatVND(price)}</span>
        ) : p.priceFrom ? (
          <span className="text-[15px] font-semibold text-ink md:text-base">
            <span className="text-xs font-normal text-muted">Từ </span>
            {formatVND(p.priceFrom)}
          </span>
        ) : (
          <span className="text-sm font-semibold text-ink underline decoration-line underline-offset-4">Liên hệ báo giá</span>
        )}
        {compare && compare > price && <span className="text-xs text-muted line-through md:text-[13px]">{formatVND(compare)}</span>}
      </p>
      {(p.minQty ?? 1) > 1 ? (
        <p className="mt-0.5 text-[11px] text-muted md:text-xs">Tối thiểu {p.minQty} sản phẩm</p>
      ) : (
        p.productionDays && <p className="mt-0.5 text-[11px] text-muted md:text-xs">Sản xuất {p.productionDays}</p>
      )}
    </Link>
  );
}

/** Nhãn giá ngắn cho danh sách báo giá */
export function priceLabelOf(p: Pick<ProductCardData, "basePrice" | "priceFrom" | "minQty">) {
  const base = p.basePrice > 0 ? `Giá lẻ ${formatVND(p.basePrice)}` : p.priceFrom ? `Từ ${formatVND(p.priceFrom)}` : "Liên hệ báo giá";
  return (p.minQty ?? 1) > 1 ? `${base} · tối thiểu ${p.minQty}` : base;
}

/** Lưới sản phẩm; even = làm tròn về 4/8 ô để không lẻ hàng cuối (khối trang chủ) */
export function ProductGrid({
  items: all,
  dense = false,
  color,
  even = false,
  after,
  mobileMax,
}: {
  items: ProductCardData[];
  dense?: boolean;
  color?: string;
  even?: boolean;
  /** Nội dung dưới mỗi card (VD nút "Thêm vào báo giá") – nằm ngoài link của card */
  after?: (p: ProductCardData) => React.ReactNode;
  /** Mobile chỉ hiện tối đa n sản phẩm (khối trang chủ, đỡ dài) */
  mobileMax?: number;
}) {
  const items = even && all.length > 4 ? all.slice(0, all.length >= 8 ? 8 : 4) : all;
  return (
    <ul className={`grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:gap-x-5 md:gap-y-8 ${dense ? "xl:grid-cols-4" : "lg:grid-cols-4"}`}>
      {items.map((p, i) => (
        <li key={p.id} className={[after ? "flex flex-col" : "", mobileMax && i >= mobileMax ? "hidden sm:block" : ""].filter(Boolean).join(" ") || undefined}>
          <ProductCard p={p} priority={i < 2} color={color} />
          {after && <div className="mt-auto pt-2">{after(p)}</div>}
        </li>
      ))}
    </ul>
  );
}
