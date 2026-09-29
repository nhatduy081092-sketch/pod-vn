import Link from "next/link";
import { formatDateTimeVN, formatVND, ORDER_STATUS_LABEL, ORDER_STATUSES } from "@pod/shared";
import { adminFetch } from "@/lib/api";
import type { Stats } from "@/lib/types";
import { PageHeader, StatusBadge } from "@/components/ui";

export default async function Dashboard() {
  const s = await adminFetch<Stats>("/stats");
  const kpis = [
    { label: "24 giờ qua", ...s.last24h },
    { label: "7 ngày", ...s.last7d },
    { label: "30 ngày", ...s.last30d },
  ];
  return (
    <>
      <PageHeader title="Tổng quan" />
      {(s.newLeads > 0 || s.pendingSellers > 0 || s.unpaidBatches > 0) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {s.newLeads > 0 && (
            <Link href="/leads?status=NEW" className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">
              📞 {s.newLeads} khách mới để lại SĐT →
            </Link>
          )}
          {s.pendingSellers > 0 && (
            <Link href="/sellers?status=PENDING" className="rounded-lg bg-violet-100 px-3 py-2 text-sm font-semibold text-violet-900">
              🏪 {s.pendingSellers} seller chờ duyệt →
            </Link>
          )}
          {s.unpaidBatches > 0 && (
            <Link href="/batches?status=UNPAID" className="rounded-lg bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-900">
              💳 {s.unpaidBatches} thanh toán gộp chờ đối soát →
            </Link>
          )}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <p className="text-xs font-semibold uppercase text-neutral-500">Doanh thu {k.label}</p>
            <p className="mt-1 text-2xl font-black">{formatVND(k.revenue)}</p>
            <p className="text-sm text-neutral-500">{k.orders} đơn (không tính đơn huỷ)</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr]">
        <div className="card overflow-x-auto">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold">Đơn mới nhất</h2>
            <Link href="/orders" className="text-sm text-brand-dark">
              Xem tất cả →
            </Link>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách</th>
                <th>Tổng</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {s.recent.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/orders/${o.id}`} className="font-semibold text-brand-dark">
                      {o.code}
                    </Link>
                  </td>
                  <td>
                    {o.customerName}
                    <br />
                    <span className="text-xs text-neutral-500">{o.phone}</span>
                  </td>
                  <td className="font-semibold">{formatVND(o.total)}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="text-xs text-neutral-500">{formatDateTimeVN(o.createdAt)}</td>
                </tr>
              ))}
              {!s.recent.length && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500">
                    Chưa có đơn hàng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2 className="mb-2 font-bold">Đơn theo trạng thái</h2>
          <ul className="space-y-1.5 text-sm">
            {ORDER_STATUSES.map((st) => (
              <li key={st}>
                <Link href={`/orders?status=${st}`} className="flex justify-between rounded px-2 py-1 hover:bg-neutral-50">
                  <span>{ORDER_STATUS_LABEL[st]}</span>
                  <b>{s.statusCounts[st]}</b>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-neutral-500">{s.productCount} sản phẩm đang bán</p>
        </div>
      </div>
    </>
  );
}
