import Link from "next/link";
import { formatDateTimeVN, formatVND, PAYMENT_METHOD_LABEL, PRINT_MODE_LABEL } from "@pod/shared";
import { adminFetch } from "@/lib/api";
import { assetUrl } from "@/lib/config";
import type { AdminOrder } from "@/lib/types";
import { PageHeader, StatusBadge } from "@/components/ui";
import { OrderEditor } from "@/components/OrderEditor";
import { RosterTable } from "@/components/RosterTable";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await adminFetch<AdminOrder>(`/orders/${id}`);
  const zaloPhone = o.phone.replace(/^0/, "84");
  return (
    <>
      <PageHeader title={`${o.isQuote ? "Yêu cầu báo giá" : "Đơn"} ${o.code}`}>
        <Link href="/orders" className="btn-ghost">
          ← Danh sách
        </Link>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="card">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={o.status} />
              <span className="text-sm text-neutral-500">{formatDateTimeVN(o.createdAt)}</span>
              {o.seller && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-800">DROPSHIP</span>}
              {o.whiteLabel && <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-bold text-white">WHITE-LABEL</span>}
              {o.customer && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">Khách có tài khoản</span>}
            </div>
            {o.seller && (
              <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm">
                <p className="font-bold text-violet-900">
                  Seller: {o.seller.seller?.brandName || o.seller.seller?.companyName || o.seller.name} · {o.seller.phone}
                </p>
                <p className="text-violet-900">
                  {o.externalId ? `Mã đơn của seller: ${o.externalId} · ` : ""}
                  {o.batch ? `Thanh toán gộp ${o.batch.code} (${o.batch.status === "PAID" ? "đã trả" : o.batch.status === "UNPAID" ? "chờ trả" : "huỷ"})` : "Chưa vào lần thanh toán nào"}
                </p>
                {o.codAmount > 0 && <p className="mt-1 font-bold text-rose-700">Thu hộ khách cuối (COD): {formatVND(o.codAmount)} – đối soát trả lại seller</p>}
                {o.whiteLabel && (
                  <p className="mt-1 text-xs text-violet-900">
                    Đóng gói theo thương hiệu seller, KHÔNG kèm hoá đơn/giá gốc.
                    {o.seller.seller?.labelImage && (
                      <a href={assetUrl(o.seller.seller.labelImage)} target="_blank" rel="noreferrer" className="ml-1 font-bold underline">
                        Tem nhãn seller ↓
                      </a>
                    )}
                  </p>
                )}
              </div>
            )}
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="label">Khách hàng</p>
                <p className="font-semibold">{o.customerName}</p>
                <p>
                  <a href={`tel:${o.phone}`} className="text-brand-dark">
                    {o.phone}
                  </a>{" "}
                  ·{" "}
                  <a href={`https://zalo.me/${zaloPhone}`} target="_blank" rel="noreferrer" className="text-sky-600">
                    Zalo
                  </a>
                </p>
                {o.email && <p>{o.email}</p>}
                {o.company && <p className="font-semibold">{o.company}</p>}
              </div>
              {!o.isQuote && (
                <div>
                  <p className="label">Giao tới</p>
                  <p>
                    {o.addressLine}, {o.ward}, {o.province}
                  </p>
                </div>
              )}
              {o.isQuote && (
                <div className="rounded-lg bg-sky-50 p-3 text-sky-900">
                  <p className="font-bold">Khách yêu cầu báo giá / cá nhân hoá</p>
                  <p className="text-xs">Liên hệ khách, gửi báo giá + mockup; khi chốt, tạo đơn và cập nhật trạng thái.</p>
                </div>
              )}
              {o.note && (
                <div className="sm:col-span-2">
                  <p className="label">Ghi chú của khách</p>
                  <p className="rounded bg-amber-50 p-2">{o.note}</p>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <h2 className="mb-3 font-bold">Sản phẩm & file in</h2>
            <ul className="divide-y divide-neutral-100">
              {o.items?.map((it) => (
                <li key={it.id} className="flex flex-wrap gap-3 py-3">
                  <img src={assetUrl(it.productImg)} alt="" className="h-16 w-16 rounded border object-contain" />
                  <div className="min-w-[200px] flex-1 text-sm">
                    <p className="font-semibold">{it.productName}</p>
                    <p className="text-neutral-500">
                      Size {it.size}
                      {it.color ? ` · ${it.color}` : ""} · SL {it.quantity} · {formatVND(it.unitPrice)}/cái
                    </p>
                    {it.sku && <p className="font-mono text-xs text-neutral-500">SKU: {it.sku}</p>}
                    {!it.design && <p className="text-neutral-500">Kiểu in: {PRINT_MODE_LABEL[it.printMode]}</p>}
                    {it.design?.files?.length ? (
                      <ul className="mt-2 flex flex-wrap gap-3">
                        {it.design.files.map((f) => (
                          <li key={f.area} className="w-28 text-xs">
                            <a href={assetUrl(f.previewUrl)} target="_blank" rel="noreferrer" title="Xem ảnh mockup">
                              <img src={assetUrl(f.previewUrl)} alt={`Mockup ${f.name}`} className="aspect-square w-full rounded border object-contain" />
                            </a>
                            <p className="mt-1 font-semibold">{f.name}</p>
                            <p className="text-neutral-500">
                              {f.widthPx}×{f.heightPx}px · {f.dpi} DPI
                            </p>
                            <a href={assetUrl(f.printUrl)} target="_blank" rel="noreferrer" download className="font-bold text-brand-dark underline">
                              Tải file in (PNG) ↓
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {it.designNote && <p className="mt-1 rounded bg-neutral-50 p-1.5 text-xs">{it.designNote}</p>}
                    {it.roster?.length ? <RosterTable rows={it.roster} fileName={`${o.code}-danh-sach`} /> : null}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatVND(it.lineTotal)}</p>
                    {it.design ? null : it.designUrl ? (
                      <a href={assetUrl(it.designUrl)} target="_blank" rel="noreferrer" download className="mt-1 inline-block">
                        <img src={assetUrl(it.designUrl)} alt="File thiết kế" className="h-16 w-16 rounded border object-cover" />
                        <span className="block text-xs text-brand-dark">Tải file in ↓</span>
                      </a>
                    ) : (
                      <p className="mt-1 text-xs text-amber-700">Chưa có file – liên hệ Zalo</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Tạm tính</dt>
                <dd>{formatVND(o.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>
                  Phí ship ({o.shippingMethod === "EXPRESS" ? "giao nhanh" : "tiêu chuẩn"}
                  {o.weightGram ? ` · ${(o.weightGram / 1000).toLocaleString("vi-VN")} kg` : ""})
                </dt>
                <dd>{formatVND(o.shippingFee)}</dd>
              </div>
              <div className="flex justify-between text-base font-bold">
                <dt>Tổng</dt>
                <dd>{formatVND(o.total)}</dd>
              </div>
              <div className="flex justify-between text-neutral-500">
                <dt>Phương thức</dt>
                <dd>{PAYMENT_METHOD_LABEL[o.paymentMethod]}</dd>
              </div>
            </dl>
          </section>

          {o.utm && (
            <section className="card text-sm">
              <h2 className="mb-2 font-bold">Nguồn đơn (UTM)</h2>
              <dl className="grid grid-cols-2 gap-1">
                {Object.entries(o.utm).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-neutral-500">{k}</dt>
                    <dd className="truncate">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
        <OrderEditor order={o} />
      </div>
    </>
  );
}
