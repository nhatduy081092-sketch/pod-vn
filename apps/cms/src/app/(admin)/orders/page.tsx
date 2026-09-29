import Link from "next/link";
import { formatDateTimeVN, formatVND, ORDER_STATUS_LABEL, ORDER_STATUSES, PAYMENT_STATUS_LABEL } from "@pod/shared";
import { adminFetch } from "@/lib/api";
import type { AdminOrder, Paged } from "@/lib/types";
import { PageHeader, StatusBadge } from "@/components/ui";

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
      <form className="card mb-3 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Mã đơn, SĐT, tên khách..." className="input max-w-xs" />
        <select name="status" defaultValue={sp.status ?? ""} className="input max-w-[200px]">
          <option value="">Tất cả trạng thái</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={sp.type ?? ""} className="input max-w-[180px]">
          <option value="">Đơn + báo giá</option>
          <option value="order">Đơn khách lẻ</option>
          <option value="seller">Đơn dropship (seller)</option>
          <option value="quote">Chỉ yêu cầu báo giá</option>
        </select>
        <button className="btn-primary">Lọc</button>
      </form>
      <div className="card overflow-x-auto p-0 md:p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Địa chỉ</th>
              <th>SL</th>
              <th>Tổng</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th>Ngày đặt</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((o) => (
              <tr key={o.id} className="hover:bg-neutral-50">
                <td>
                  <Link href={`/orders/${o.id}`} className="font-semibold text-brand-dark">
                    {o.code}
                  </Link>
                  {o.isQuote && <span className="ml-1 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">BÁO GIÁ</span>}
                  {o.seller && <span className="ml-1 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">DROPSHIP</span>}
                  {o.seller && <span className="block text-[11px] text-violet-700">Seller: {o.seller.name}</span>}
                </td>
                <td>
                  {o.customerName}
                  {o.company && <span className="block text-xs text-neutral-500">{o.company}</span>}
                  <br />
                  <a href={`tel:${o.phone}`} className="text-xs text-neutral-500">
                    {o.phone}
                  </a>
                </td>
                <td className="max-w-[200px] truncate text-xs text-neutral-600">{o.isQuote ? "—" : `${o.ward}, ${o.province}`}</td>
                <td>{o._count?.items}</td>
                <td className="font-semibold">{o.isQuote ? <span className="text-sky-700">Chờ báo giá</span> : formatVND(o.total)}</td>
                <td className="text-xs">{o.isQuote ? "—" : `${o.paymentMethod === "COD" ? "COD" : "CK"} · ${PAYMENT_STATUS_LABEL[o.paymentStatus]}`}</td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td className="whitespace-nowrap text-xs text-neutral-500">{formatDateTimeVN(o.createdAt)}</td>
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
              <Link key={n} href={link({ page: String(n) })} className={`btn-ghost px-3 ${data.page === n ? "bg-brand-light" : ""}`}>
                {n}
              </Link>
            ))}
        </div>
      )}
    </>
  );
}
