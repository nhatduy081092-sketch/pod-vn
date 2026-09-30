import Link from "next/link";
import { discountPercent, displayCompareAt, effectiveBasePrice, formatVND, saleActive } from "@pod/shared";
import type { ProductCardData } from "@/lib/types";
import { Img } from "../ui/Img";

/** Card sản phẩm kiểu "cửa sổ": thanh 3 chấm + nhãn, khung cam, badge -% đen, nhãn MỚI / SALE */
export function ProductCard({ p, priority = false, color }: { p: ProductCardData; priority?: boolean; /** màu khách đã chọn -> chọn sẵn ở trang sản phẩm */ color?: string }) {
  const sale = saleActive(p);
  const price = p.basePrice > 0 ? effectiveBasePrice(p) : 0;
  const compare = p.basePrice > 0 ? displayCompareAt(p) : null;
  const off = compare ? discountPercent(price, compare) : 0;
  const isNew = !!p.newUntil && new Date(p.newUntil).getTime() > Date.now();
  return (
    <Link
      href={color ? `/san-pham/${p.slug}?mau=${encodeURIComponent(color)}` : `/san-pham/${p.slug}`}
      className="group block overflow-hidden rounded-[6px] border-2 border-ink bg-brand transition hover:-translate-y-0.5 hover:shadow-hard"
    >
      <div className="flex h-[22px] items-center justify-between border-b-2 border-ink bg-white px-1.5 md:h-7" aria-hidden>
        <span className="flex gap-[3px]">
          <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-ink bg-white md:h-3 md:w-3" />
          <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-ink bg-[#FFD84D] md:h-3 md:w-3" />
          <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-ink bg-brand-dark md:h-3 md:w-3" />
        </span>
        <span className="text-[9px] font-extrabold tracking-tight md:text-[11px]">
          {sale ? "KHUYẾN MÃI • CÓ HẠN" : p.basePrice > 0 ? "IN TOÀN THÂN • HOT" : "CÁ NHÂN HOÁ • LOGO"}
        </span>
      </div>
      <div className="p-[7px] pb-2 md:p-2.5">
        <div className="relative">
          <div className="relative aspect-square overflow-hidden rounded-[6px] border-[1.5px] border-ink bg-white">
            <Img
              src={p.images[0]}
              alt={p.name}
              priority={priority}
              sizes="(min-width:1280px) 280px, (min-width:768px) 30vw, 46vw"
              className="object-contain transition duration-300 group-hover:scale-105"
            />
          </div>
          {(isNew || sale) && (
            <span className="absolute left-1 top-1 flex gap-1">
              {isNew && <span className="rounded bg-[#16a34a] px-1.5 py-0.5 text-[10px] font-black text-white md:text-[11px]">MỚI</span>}
              {sale && <span className="rounded bg-[#e11d48] px-1.5 py-0.5 text-[10px] font-black text-white md:text-[11px]">SALE</span>}
            </span>
          )}
          {off > 0 && (
            <span className="absolute -bottom-[2px] -left-[9px] rounded-r-[4px] bg-ink py-0.5 pl-2.5 pr-2 text-[12px] font-extrabold text-brand-badge md:-left-[12px] md:text-sm">
              -{off}%
            </span>
          )}
        </div>
        <h3 className="mt-1.5 line-clamp-2 min-h-[2.6em] text-[11.5px] font-bold leading-[1.3] text-ink md:text-[13px]">{p.name}</h3>
        <p className="mt-1 flex items-baseline gap-1.5">
          {p.basePrice > 0 ? (
            <span className="text-[16px] font-black text-ink md:text-[19px]">{formatVND(price)}</span>
          ) : p.priceFrom ? (
            <span className="whitespace-nowrap text-ink">
              <span className="text-[11px] font-bold md:text-xs">Từ </span>
              <span className="text-[16px] font-black md:text-[19px]">{formatVND(p.priceFrom)}</span>
            </span>
          ) : (
            <span className="text-[13px] font-extrabold text-navy md:text-[15px]">Liên hệ báo giá →</span>
          )}
          {compare && compare > price && <span className="text-[10px] font-semibold text-ink/70 line-through md:text-xs">{formatVND(compare)}</span>}
        </p>
        {p.productionDays && <p className="mt-0.5 text-[10px] font-semibold text-ink/70 md:text-[11px]">⏱ Sản xuất {p.productionDays}</p>}
      </div>
    </Link>
  );
}

export function ProductGrid({ items, dense = false, color }: { items: ProductCardData[]; dense?: boolean; color?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-4 ${dense ? "xl:grid-cols-4" : "lg:grid-cols-4"}`}>
      {items.map((p, i) => (
        <li key={p.id}>
          <ProductCard p={p} priority={i < 2} color={color} />
        </li>
      ))}
    </ul>
  );
}
