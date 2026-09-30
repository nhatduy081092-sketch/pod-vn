import { formatVND, type LandingSettings } from "@pod/shared";
import type { ProductDetail } from "@/lib/types";
import { QuoteForm } from "./QuoteForm";
import { QuoteGallery } from "./QuoteGallery";

/** Sản phẩm B2B (giá = 0): không đặt online, chuyển sang nhận báo giá */
export function QuoteProduct({ product, brand, hasSizeGuide = false }: { product: ProductDetail; brand: LandingSettings["brand"]; hasSizeGuide?: boolean }) {
  const zalo = `https://zalo.me/${brand.zalo.replace(/\D/g, "")}`;
  const subject = encodeURIComponent(`Báo giá: ${product.name}`);
  const body = encodeURIComponent(`Chào ${brand.name},\nTôi cần báo giá "${product.name}".\n- Số lượng dự kiến:\n- Logo/nội dung in:\n- Thời gian cần hàng:\n- Tên công ty / người liên hệ / SĐT:\n`);
  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-10">
      <div className="md:sticky md:top-20 md:self-start">
        <QuoteGallery productId={product.id} images={product.images} name={product.name} />
      </div>
      <div>
        <span className="inline-block rounded-full bg-navy px-3 py-1 text-[11px] font-extrabold tracking-wider text-white">{brand.name.toUpperCase()} · DOANH NGHIỆP</span>
        <h1 className="mt-2 text-xl font-black leading-snug md:text-3xl">{product.name}</h1>
        {product.priceFrom ? (
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-bold text-ink/70">Giá tham khảo từ</span>
            <span className="text-2xl font-black text-accent md:text-3xl">{formatVND(product.priceFrom)}</span>
            {product.minQty > 1 && <span className="text-sm font-semibold text-ink/60">· tối thiểu {product.minQty} cái</span>}
          </p>
        ) : (
          <p className="mt-2 text-2xl font-black text-accent">Liên hệ báo giá</p>
        )}
        <p className="text-sm font-semibold text-navy">✦ Cá nhân hoá được: in / thêu / khắc logo, tên, thông điệp riêng</p>
        <p className="mt-1 text-sm text-ink/70">Giá phụ thuộc số lượng, chất liệu và kỹ thuật in/thêu. Báo giá trong giờ làm việc.</p>

        <ul className="mt-4 space-y-1.5 rounded-lg bg-navy-light p-4 text-sm">
          <li>
            <b>Chất liệu:</b> {product.material || "Theo yêu cầu"}
          </li>
          <li>
            <b>Gia công logo:</b> {product.printMethod}
          </li>
          {product.sizes.length > 0 && (
            <li>
              <b>Size:</b> {product.sizes.join(", ")}
              {hasSizeGuide && (
                <a href="#bang-size" className="ml-2 font-bold text-navy underline underline-offset-2">
                  Xem bảng size
                </a>
              )}
            </li>
          )}
          <li>✓ Tư vấn & thiết kế theo nhận diện thương hiệu · ✓ Giao toàn quốc · ✓ Xuất hoá đơn VAT</li>
        </ul>

        <div className="mt-5">
          <QuoteForm productId={product.id} productName={product.name} slug={product.slug} sizes={product.sizes} areas={product.printAreas} variants={product.variants} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
          <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn border-navy bg-zalo px-2 text-white">
            Zalo
          </a>
          <a href={`mailto:${brand.email}?subject=${subject}&body=${body}`} className="btn border-navy bg-white px-2 text-navy hover:bg-navy-light">
            Email
          </a>
          <a href={`tel:${brand.hotline}`} className="btn border-navy bg-white px-2 text-navy hover:bg-navy-light">
            Gọi
          </a>
        </div>
      </div>
    </div>
  );
}
