import Link from "next/link";
import { BASIC_COLORS, formatVND, GARMENT_COLORS, GARMENT_PRODUCT, type ColorKey, type GarmentKey, type ReadyDesign } from "@pod/shared";
import { DesignPreview } from "./DesignPreview";

export type BasicPrice = { basePrice: number; compareAtPrice: number | null };

/** Màu xem được trên dáng: màu chọn nếu dáng có bán, không thì màu mặc định của dáng */
export function colorFor(garment: GarmentKey, color: ColorKey): ColorKey {
  return GARMENT_COLORS[garment].includes(color) ? color : GARMENT_COLORS[garment][0]!;
}

/** Link mở YALA Studio với mẫu đã đặt sẵn trên phôi YALA Everyday (dáng + màu áo đang xem) */
export function readyDesignHref(d: ReadyDesign, color?: ColorKey, garment?: GarmentKey) {
  const g = garment ?? d.garment;
  const q = new URLSearchParams({ preset: d.slug, mau: BASIC_COLORS[colorFor(g, color ?? d.color)].name, back: `/bo-suu-tap/${d.collection}` });
  return `/thiet-ke/${GARMENT_PRODUCT[g].slug}?${q.toString()}`;
}

/** Thẻ mẫu có sẵn: ảnh cận ngực, rê chuột xem cả áo + nhấc thẻ; giá theo phôi */
export function ReadyDesignCard({ d, price, color, garment }: { d: ReadyDesign; price?: BasicPrice; /** xem mẫu trên màu áo khác */ color?: ColorKey; /** xem mẫu trên dáng khác (hoodie, túi…) */ garment?: GarmentKey }) {
  const off = price?.compareAtPrice && price.compareAtPrice > price.basePrice ? Math.round((1 - price.basePrice / price.compareAtPrice) * 100) : 0;
  const g = garment ?? d.garment;
  const c = colorFor(g, color ?? d.color);
  return (
    <Link href={readyDesignHref(d, c, g)} className="group block" prefetch={false}>
      <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-transparent bg-surface transition-[transform,box-shadow,border-color] duration-200 [@media(hover:hover)]:group-hover:-translate-y-1 [@media(hover:hover)]:group-hover:border-ink [@media(hover:hover)]:group-hover:shadow-sticker">
        <DesignPreview design={d} color={c} garment={g} className="absolute inset-0 h-full w-full transition duration-500 [@media(hover:hover)]:group-hover:opacity-0" />
        <DesignPreview design={d} color={c} garment={g} zoom={false} className="absolute inset-0 h-full w-full opacity-0 transition duration-500 [@media(hover:hover)]:group-hover:opacity-100" />
        {off > 0 && <span className="absolute left-2.5 top-2.5 -rotate-3 rounded-lg border-2 border-ink bg-sale px-2 py-0.5 text-[11px] font-bold text-white shadow-sticker-sm md:text-xs">-{off}%</span>}
        <span className="absolute bottom-2.5 right-2.5 rounded-full border-2 border-ink bg-white px-2.5 py-0.5 text-[11px] font-bold opacity-0 transition group-hover:opacity-100 md:text-xs">Sửa chữ</span>
      </div>
      <h3 className="mt-3 line-clamp-2 text-[13px] font-medium leading-[1.3] transition-colors group-hover:text-brand-dark md:text-[15px]">
        {GARMENT_PRODUCT[g].label} {d.title}
      </h3>
      {price ? (
        <p className="mt-1 flex items-baseline gap-2">
          <span className={`text-[15px] font-semibold md:text-base ${off ? "text-sale" : ""}`}>{formatVND(price.basePrice)}</span>
          {off > 0 && <span className="text-xs text-muted line-through md:text-[13px]">{formatVND(price.compareAtPrice!)}</span>}
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted">Sửa chữ miễn phí</p>
      )}
    </Link>
  );
}
