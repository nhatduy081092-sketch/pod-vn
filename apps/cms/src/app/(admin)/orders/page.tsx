import Link from "next/link";
import { formatDateTimeVN, formatVND, ORDER_STATUS_LABEL, ORDER_STATUSES, PAYMENT_STATUS_LABEL } from "@pod/shared";
import { adminFetch } from "@/lib/api";
import type { AdminOrder, Paged } from "@/lib/types";
import { PageHeader, StatusBadge, Tag } from "@/components/ui";
import { OrderCards } from "@/components/OrderCards";

export const metadata = { title: "Đơn hàng" };

type SP = Promise<{ q?: string; status?: string; page?: string; type?: string; sellerId?: string }>;

export default async function OrdersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.q) qs.set("q", sp.q);
  if (sp.status) qs.set("status", sp.status);
  if (sp.page) qs.set("page", sp.page);
  if (sp.type) qs.set("type", sp.type);
  if (sp.sellerId) qs.set("sellerId", sp.sellerId);
  const data = await adminFetch<Paged<AdminOrder>>(`/orders?${qs.toString()}`);
  const pages = Math.ceil(data.total / data.pageSize);
  const link = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/orders?${q.toString()}`;
  };

  return (
    <>
      <PageHeader title={`Đơn hàng (${data.total})`} />
      <form className="card mb-3 grid gap-2 sm:flex sm:flex-wrap">
        <input name="q" defaultValue={sp.q} placeholder="Mã đơn, SĐT, tên khách..." className="input sm:max-w-xs" />
        <select name="status" defaultValue={sp.status ?? ""} className="input sm:max-w-[200px]">
          <option value="">Tất cả trạng thái</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={sp.type ?? ""} className="input sm:max-w-[200px]">
          <option value="">Đơn + báo giá</option>
          <option value="order">Đơn khách lẻ</option>
          <option value="seller">Đơn dropship (seller)</option>
          <option value="quote">Chỉ yêu cầu báo giá</option>
        </select>
        <button className="btn-primary">Lọc</button>
      </form>
      <div className="card p-0 md:hidden">
        <OrderCards items={data.items} empty="Không có đơn nào" />
      </div>
      <div className="card hidden overflow-x-auto p-0 md:block md:p-0">
        <table className="table">
          <thead>
            <tr>
              <th className="pl-5">Mã đơn</th>
              <th>Khách hàng</th>
              <th>Địa chỉ</th>
              <th className="text-right">SL</th>
              <th className="text-right">Tổng</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th className="pr-5 text-right">Ngày đặt</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((o) => (
              <tr key={o.id} className="hover:bg-neutral-50">
                <td className="pl-5">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Link href={`/orders/${o.id}`} className="font-semibold text-brand-dark hover:text-brand-deep">
                      {o.code}
                    </Link>
                    {o.isQuote && <Tag>Báo giá</Tag>}
                    {o.seller && <Tag>Dropship</Tag>}
                  </span>
                  {o.seller && <span className="block text-xs text-neutral-500">Seller: {o.seller.name}</span>}
                </td>
                <td>
                  <span className="block">{o.customerName}</span>
                  {o.company && <span className="block text-xs text-neutral-500">{o.company}</span>}
                  <a href={`tel:${o.phone}`} className="text-xs text-neutral-500">
                    {o.phone}
                  </a>
                </td>
                <td className="max-w-[200px] truncate text-xs text-neutral-600">{o.isQuote ? "—" : `${o.ward}, ${o.province}`}</td>
                <td className="text-right">{o._count?.items}</td>
                <td className="whitespace-nowrap text-right font-semibold">{o.isQuote ? <span className="font-medium text-neutral-500">Chờ báo giá</span> : formatVND(o.total)}</td>
                <td className="whitespace-nowrap text-xs">{o.isQuote ? "—" : `${o.paymentMethod === "COD" ? "COD" : "CK"} · ${PAYMENT_STATUS_LABEL[o.paymentStatus]}`}</td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td className="whitespace-nowrap pr-5 text-right text-xs text-neutral-500">{formatDateTimeVN(o.createdAt)}</td>
              </tr>
            ))}
            {!data.items.length && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-neutral-500">
                  Không có đơn nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === pages || Math.abs(n - data.page) <= 2)
            .map((n) => (
              <Link key={n} href={link({ page: String(n) })} aria-current={data.page === n ? "page" : undefined}
                className={`btn-ghost min-w-10 px-3 tabular-nums ${data.page === n ? "btn-on" : ""}`}>
                {n}
              </Link>
            ))}
        </div>
      )}
    </>
  );
}
