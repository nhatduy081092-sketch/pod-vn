import { formatVND, type LandingSettings } from "@pod/shared";
import type { ProductDetail } from "@/lib/types";
import { QuoteForm } from "./QuoteForm";
import { QuoteGallery } from "./QuoteGallery";
import { AddToQuote } from "../b2b/AddToQuote";

/** Sản phẩm B2B (giá = 0): không đặt online, chuyển sang nhận báo giá */
export function QuoteProduct({
  product,
  brand,
  hasSizeGuide = false,
  threshold,
}: {
  product: ProductDetail;
  brand: LandingSettings["brand"];
  hasSizeGuide?: boolean;
  /** Số lượng gợi ý khi thêm vào danh sách báo giá */
  threshold?: number;
}) {
  const zalo = `https://zalo.me/${brand.zalo.replace(/\D/g, "")}`;
  const subject = encodeURIComponent(`Báo giá: ${product.name}`);
  const body = encodeURIComponent(`Chào ${brand.name},\nTôi cần báo giá "${product.name}".\n- Số lượng dự kiến:\n- Logo/nội dung in:\n- Thời gian cần hàng:\n- Tên công ty / người liên hệ / SĐT:\n`);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
      <div className="md:max-w-[520px] lg:sticky lg:top-28 lg:max-w-none lg:self-start">
        <QuoteGallery productId={product.id} images={product.images} name={product.name} />
      </div>
      <div>
        <h1 className="font-display text-[clamp(32px,3.4vw,52px)] font-bold leading-[1.05] tracking-[-0.03em] [text-wrap:balance]">{product.name}</h1>
        {product.priceFrom ? (
          <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
            <span className="text-base text-ink/80">Giá tham khảo từ</span>
            <span className="text-[clamp(28px,2.6vw,36px)] font-bold tabular-nums">{formatVND(product.priceFrom)}</span>
            {product.minQty > 1 && <span className="text-base text-ink/80">· tối thiểu {product.minQty} cái</span>}
          </p>
        ) : (
          <p className="mt-5 text-[clamp(28px,2.6vw,36px)] font-bold">Liên hệ báo giá</p>
        )}
        <p className="mt-3 text-base leading-relaxed">
          Hàng doanh nghiệp: in / thêu / khắc logo, tên, thông điệp riêng. Giá phụ thuộc số lượng, chất liệu và kỹ thuật in/thêu; báo giá trong giờ làm việc.
        </p>

        <ul className="mt-6 space-y-2 rounded-lg bg-surface p-5 text-base">
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
                <a href="#bang-size" className="ml-2 font-semibold underline underline-offset-4 hover:text-brand-dark">
                  Xem bảng size
                </a>
              )}
            </li>
          )}
          <li>Tư vấn & thiết kế theo nhận diện thương hiệu · Giao toàn quốc · Xuất hoá đơn VAT</li>
        </ul>

        <div className="mt-6 rounded-lg bg-surface p-5">
          <p className="text-base font-bold">Cần báo giá nhiều sản phẩm cùng lúc?</p>
          <p className="mt-1 text-[15px] text-ink/80">Thêm sản phẩm này vào danh sách, chọn thêm món khác rồi gửi 1 yêu cầu.</p>
          <AddToQuote
            variant="outline"
            className="mt-2.5"
            quantity={Math.max(product.minQty, threshold ?? 1)}
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              image: product.images[0] ?? "",
              priceLabel: product.priceFrom ? `Từ ${formatVND(product.priceFrom)}` : "Liên hệ báo giá",
            }}
          />
        </div>
        <div className="mt-5">
          <QuoteForm productId={product.id} productName={product.name} slug={product.slug} sizes={product.sizes} areas={product.printAreas} variants={product.variants} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn bg-zalo px-2 text-white">
            Zalo
          </a>
          <a href={`mailto:${brand.email}?subject=${subject}&body=${body}`} className="btn-outline px-2">
            Email
          </a>
          <a href={`tel:${brand.hotline}`} className="btn-outline px-2">
            Gọi
          </a>
        </div>
      </div>
    </div>
  );
}
