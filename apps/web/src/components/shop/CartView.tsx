"use client";
import Link from "next/link";
import { formatVND, sizeSummary } from "@pod/shared";
import { useCart } from "@/lib/cart";
import { assetUrl } from "@/lib/config";
import { IconClose } from "../ui/icons";
import { CartUpsell } from "./CartUpsell";
import { useQuoteList } from "@/lib/quote-list";
import { useRouter } from "next/navigation";

/** threshold: từ số lượng này gợi ý chuyển sang yêu cầu báo giá (đơn nhỏ mua online, đơn lớn báo giá) */
export function CartView({ threshold = 0, freeThreshold = 0 }: { threshold?: number; freeThreshold?: number }) {
  const cart = useCart();
  const quotes = useQuoteList();
  const router = useRouter();
  // chỉ chuyển được dòng chưa gắn thiết kế / danh sách đồng phục (báo giá theo sản phẩm, file gửi sau)
  const bigLines = threshold > 1 ? cart.items.filter((i) => i.quantity >= threshold && !i.roster?.length && !i.design && !i.designUrl) : [];
  if (!cart.ready) return <p className="py-10 text-center text-ink/60">Đang tải giỏ hàng...</p>;
  if (!cart.items.length)
    return (
      <div className="py-16 text-center">
        <p className="text-ink/70">Giỏ hàng đang trống.</p>
        <Link href="/san-pham" className="btn-primary mt-4">
          Chọn sản phẩm
        </Link>
      </div>
    );

  return (
    <>
    {bigLines.length > 0 && (
      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-brand/30 bg-brand-light p-4 text-sm md:flex-row md:items-center">
        <div className="flex-1">
          <p className="font-semibold">Đơn số lượng lớn ({threshold}+ sản phẩm) – nhận báo giá tốt hơn</p>
          <p className="mt-0.5 text-ink/70">
            {bigLines.map((i) => `${i.name} × ${i.quantity}`).join(", ")}: gửi yêu cầu báo giá để được giá theo số lượng, tư vấn in logo và mockup miễn phí.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary shrink-0"
          onClick={() => {
            for (const i of bigLines) {
              quotes.add({ productId: i.productId, slug: i.slug, name: i.name, image: i.image, quantity: i.quantity, priceLabel: `Giá lẻ ${formatVND(cart.unitPrice(i))}`, note: [i.color, i.size].filter((x) => x && x !== "—").join(" / ") });
              cart.remove(i.key);
            }
            router.push("/doanh-nghiep/bao-gia");
          }}
        >
          Chuyển sang yêu cầu báo giá
        </button>
      </div>
    )}
    <div className="mt-5 grid gap-6 md:grid-cols-[1fr_340px]">
      <ul className="divide-y divide-ink/10 rounded-lg border border-line bg-white">
        {cart.items.map((i) => {
          const unit = cart.unitPrice(i);
          return (
            <li key={i.key} className="flex gap-3 p-3">
              <Link href={`/san-pham/${i.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-ink/20 bg-white">
                <img src={assetUrl(i.image)} alt={i.name} className="h-full w-full object-contain" />
                {!i.design && i.designPreview && (
                  <img src={i.designPreview} alt="Thiết kế" className="absolute bottom-0.5 right-0.5 h-8 w-8 rounded border border-white object-cover shadow" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <Link href={`/san-pham/${i.slug}`} className="line-clamp-2 text-sm font-bold">
                    {i.name}
                  </Link>
                  <button type="button" onClick={() => cart.remove(i.key)} className="h-6 w-6 shrink-0 text-ink/50 hover:text-ink" aria-label="Xoá">
                    <IconClose className="h-5 w-5" />
                  </button>
                </div>
                {i.roster?.length ? (
                  <p className="mt-0.5 text-xs font-semibold text-ink/70">
                    Đồng phục {i.roster.length} áo: {sizeSummary(i.roster).map((s) => `${s.size}×${s.qty}`).join(", ")}
                  </p>
                ) : null}
                <p className="mt-0.5 text-xs text-ink/60">
                  {[i.color && i.color !== "Theo thiết kế" ? i.color : "", i.roster?.length ? "" : `Size ${i.size}`].filter(Boolean).join(" · ")}
                  {i.sku ? ` · ${i.sku}` : ""}
                </p>
                {i.design ? (
                  <div className="mt-1 flex items-center gap-1.5">
                    {i.design.files.map((f) => (
                      <img key={f.area} src={assetUrl(f.previewUrl)} alt={`Thiết kế ${f.name}`} title={f.name} className="h-9 w-9 rounded border border-ink/15 object-contain" />
                    ))}
                    <span className="text-[11px] font-semibold text-green-700">✓ {i.design.files.length} mặt in</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-ink/60">{i.designUrl ? "Đã có file thiết kế" : "Chưa có thiết kế (gửi qua Zalo)"}</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  {i.roster?.length ? (
                    <span className="text-sm font-bold">SL: {i.quantity}</span>
                  ) : (
                  <div className="flex items-center overflow-hidden rounded border border-line text-sm">
                    <button type="button" className="h-7 w-7 font-bold" onClick={() => cart.updateQty(i.key, i.quantity - 1)} aria-label="Giảm">
                      −
                    </button>
                    <span className="w-9 text-center font-bold">{i.quantity}</span>
                    <button type="button" className="h-7 w-7 font-bold" onClick={() => cart.updateQty(i.key, i.quantity + 1)} aria-label="Tăng">
                      +
                    </button>
                  </div>
                  )}
                  <div className="text-right">
                    <p className="font-black">{formatVND(cart.lineTotal(i))}</p>
                    <p className="text-[11px] text-ink/60">{formatVND(unit)}/cái</p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <aside className="h-fit rounded-lg border border-line bg-cream p-4 md:sticky md:top-20">
        <div className="flex justify-between text-sm">
          <span>Tạm tính ({cart.count} sản phẩm)</span>
          <b>{formatVND(cart.subtotal)}</b>
        </div>
        <p className="mt-1 text-xs text-ink/60">Phí vận chuyển tính ở bước thanh toán.</p>
        <Link href="/thanh-toan" className="btn-primary mt-4 w-full">
          Tiến hành đặt hàng
        </Link>
        <Link href="/san-pham" className="mt-2 block text-center text-sm font-semibold underline">
          Tiếp tục mua sắm
        </Link>
      </aside>
    </div>
    <CartUpsell productIds={[...new Set(cart.items.map((i) => i.productId))]} subtotal={cart.subtotal} freeThreshold={freeThreshold} />
    </>
  );
}
