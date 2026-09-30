import Link from "next/link";
import { BASIC_COLORS, formatVND, GARMENT_PRODUCT, type ReadyDesign } from "@pod/shared";
import { DesignPreview } from "./DesignPreview";

export type BasicPrice = { basePrice: number; compareAtPrice: number | null };

/** Link mở YALA Studio với mẫu đã đặt sẵn trên phôi YALA Everyday */
export function readyDesignHref(d: ReadyDesign) {
  const q = new URLSearchParams({ preset: d.slug, mau: BASIC_COLORS[d.color].name, back: `/bo-suu-tap/${d.collection}` });
  return `/thiet-ke/${GARMENT_PRODUCT[d.garment].slug}?${q.toString()}`;
}

/** Thẻ mẫu có sẵn: ảnh cận ngực, rê chuột xem cả áo; giá theo phôi */
export function ReadyDesignCard({ d, price }: { d: ReadyDesign; price?: BasicPrice }) {
  const off = price?.compareAtPrice && price.compareAtPrice > price.basePrice ? Math.round((1 - price.basePrice / price.compareAtPrice) * 100) : 0;
  return (
    <Link href={readyDesignHref(d)} className="group block" prefetch={false}>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-surface">
        <DesignPreview design={d} className="absolute inset-0 h-full w-full transition duration-500 [@media(hover:hover)]:group-hover:opacity-0" />
        <DesignPreview design={d} zoom={false} className="absolute inset-0 h-full w-full opacity-0 transition duration-500 [@media(hover:hover)]:group-hover:opacity-100" />
        {off > 0 && <span className="absolute left-2 top-2 rounded-full bg-sale px-2 py-0.5 text-[11px] font-semibold text-white md:text-xs">-{off}%</span>}
      </div>
      <h3 className="mt-2.5 line-clamp-2 text-[13px] font-medium leading-[1.3] md:text-[15px]">
        {GARMENT_PRODUCT[d.garment].label} {d.title}
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
