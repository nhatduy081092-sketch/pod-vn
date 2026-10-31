import Link from "next/link";
import { BASIC_COLORS, formatVND, GARMENT_COLORS, GARMENT_PRODUCT, type ColorKey, type GarmentKey, type ReadyDesign } from "@pod/shared";
import { DesignPreview } from "./DesignPreview";

export type BasicPrice = { basePrice: number; compareAtPrice: number | null };

/** Màu xem được trên dáng: màu chọn nếu dáng có bán, không thì màu mặc định của dáng */
export function colorFor(garment: GarmentKey, color: ColorKey): ColorKey {
  return GARMENT_COLORS[garment].includes(color) ? color : GARMENT_COLORS[garment][0]!;
}

/** Link mở YALA Studio với mẫu đã đặt sẵn trên phôi YALA Everyday (dáng + màu áo đang xem) */
export function readyDesignHref(d: ReadyDesign, color?: ColorKey, garment?: GarmentKey, back?: string) {
  const g = garment ?? d.garment;
  const q = new URLSearchParams({ preset: d.slug, mau: BASIC_COLORS[colorFor(g, color ?? d.color)].name, back: back ?? `/bo-suu-tap/${d.collection}` });
  return `/thiet-ke/${GARMENT_PRODUCT[g].slug}?${q.toString()}`;
}

/** Thẻ mẫu có sẵn: ảnh cận ngực, rê chuột xem cả áo; khung nền nhạt không viền/bóng (như thẻ sản phẩm); giá theo phôi */
export function ReadyDesignCard({ d, price, color, garment, back }: { d: ReadyDesign; price?: BasicPrice; /** xem mẫu trên màu áo khác */ color?: ColorKey; /** xem mẫu trên dáng khác (hoodie, túi…) */ garment?: GarmentKey; /** trang quay về sau Studio */ back?: string }) {
  const off = price?.compareAtPrice && price.compareAtPrice > price.basePrice ? Math.round((1 - price.basePrice / price.compareAtPrice) * 100) : 0;
  const g = garment ?? d.garment;
  const c = colorFor(g, color ?? d.color);
  return (
    <Link href={readyDesignHref(d, c, g, back)} className="group block" prefetch={false}>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
        <DesignPreview design={d} color={c} garment={g} className="absolute inset-0 h-full w-full transition duration-500 [@media(hover:hover)]:group-hover:opacity-0" />
        <DesignPreview design={d} color={c} garment={g} zoom={false} className="absolute inset-0 h-full w-full opacity-0 transition duration-500 [@media(hover:hover)]:group-hover:opacity-100" />
        {off > 0 && <span className="absolute left-2 top-2 rounded-md bg-sale px-2 py-0.5 text-[13px] font-bold tabular-nums text-white">-{off}%</span>}
        <span className="absolute bottom-2 right-2 rounded-md bg-white px-2 py-0.5 text-[13px] font-semibold text-ink/80 opacity-0 transition group-hover:opacity-100">Sửa chữ</span>
      </div>
      <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-[1.3] transition-colors group-hover:text-brand-dark md:text-[17px]">
        {GARMENT_PRODUCT[g].label} {d.title}
      </h3>
      {price ? (
        <p className="mt-1 flex items-baseline gap-2">
          <span className={`text-base font-bold tabular-nums md:text-lg ${off ? "text-sale" : ""}`}>{formatVND(price.basePrice)}</span>
          {off > 0 && <span className="text-[13px] tabular-nums text-ink/60 line-through md:text-[15px]">{formatVND(price.compareAtPrice!)}</span>}
        </p>
      ) : (
        <p className="mt-1 text-[15px] text-ink/70">Sửa chữ miễn phí</p>
      )}
    </Link>
  );
}
