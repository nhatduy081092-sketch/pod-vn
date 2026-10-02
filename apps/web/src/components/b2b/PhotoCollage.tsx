import { assetUrl } from "@/lib/config";
import { tiltOf } from "@/lib/pastel";

/** Ghép 4 ảnh sản phẩm thật (ngành hàng doanh nghiệp) thành khối minh hoạ kiểu sticker – thay hình vẽ MerchKit */
export function PhotoCollage({ images, className = "", row = false }: { images: { src: string; alt: string }[]; className?: string; /** 1 hàng 4 ảnh (khung ngang) */ row?: boolean }) {
  const list = images.filter((x) => x.src).slice(0, 4);
  return (
    <div className={`grid ${row ? "grid-cols-4 items-center gap-2.5 md:gap-3" : "grid-cols-2 gap-3 md:gap-4"} p-4 md:p-6 ${className}`}>
      {list.map((im, i) => (
        <span key={im.src} className="sticker tilt block aspect-square overflow-hidden bg-white" style={{ ["--r" as string]: `${tiltOf(i + 1)}deg` }}>
          <img src={assetUrl(im.src)} alt={im.alt} loading="lazy" decoding="async" className="h-full w-full object-contain p-[6%]" />
        </span>
      ))}
    </div>
  );
}
