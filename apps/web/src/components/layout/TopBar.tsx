import type { LandingSettings } from "@pod/shared";

/** Thanh thông tin mảnh màu navy – dấu ấn OEM Group */
export function TopBar({ brand }: { brand: LandingSettings["brand"] }) {
  return (
    <div className="bg-navy-dark text-[11px] text-white/85 md:text-xs">
      <div className="container-site flex h-8 items-center justify-between gap-3">
        <p className="truncate">
          <b className="text-oem">{brand.name}</b>
          <span className="hidden sm:inline"> · Merchandise &amp; quà tặng doanh nghiệp</span> · In áo theo yêu cầu từ 1 chiếc
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <a href={`tel:${brand.hotline}`} className="font-bold hover:text-oem">
            ☎ {brand.hotline.replace(/(\d{3})(\d{4})(\d{3,4})/, "$1 $2 $3")}
          </a>
          <a href="/#doanh-nghiep" className="hidden font-semibold text-oem hover:underline md:inline">
            Báo giá doanh nghiệp →
          </a>
        </div>
      </div>
    </div>
  );
}
