import Image from "next/image";
import { optimizedImage } from "@/lib/config";

type Props = {
  src: string | null | undefined;
  alt: string;
  /** Kích thước hiển thị thực tế theo breakpoint – quyết định ảnh resize bao nhiêu px */
  sizes: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
};

/** Ảnh sản phẩm tối ưu: resize theo màn hình + WebP/AVIF + lazy (next/image), SVG giữ nguyên */
export function Img({ src, alt, sizes, className, priority, fill = true, width, height }: Props) {
  const o = optimizedImage(src);
  if (!o.src) return <div className={`${className ?? ""} bg-white`} aria-hidden />;
  return fill ? (
    <Image src={o.src} alt={alt} fill sizes={sizes} className={className} priority={priority} unoptimized={o.unoptimized} />
  ) : (
    <Image src={o.src} alt={alt} width={width ?? 600} height={height ?? 600} sizes={sizes} className={className} priority={priority} unoptimized={o.unoptimized} />
  );
}
