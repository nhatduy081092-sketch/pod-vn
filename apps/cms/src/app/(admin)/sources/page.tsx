import Link from "next/link";
import { formatVND } from "@pod/shared";
import { adminFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import type { SourceReport } from "@/lib/types";

export const metadata = { title: "Nguồn khách" };

const PERIODS = [7, 30, 90, 365];

export default async function SourcesPage({ searchParams }: { searchParams: Promise<{ days?: string; touch?: string }> }) {
  const sp = await searchParams;
  const r = await adminFetch<SourceReport>(`/reports/sources?days=${sp.days ?? "30"}&touch=${sp.touch === "first" ? "first" : "last"}`);
  const href = (days: number, touch: string) => `/sources?days=${days}${touch === "first" ? "&touch=first" : ""}`;
  const sum = r.rows.reduce((s, x) => ({ orders: s.orders + x.orders, revenue: s.revenue + x.revenue, paidOrders: s.paidOrders + x.paidOrders, paidRevenue: s.paidRevenue + x.paidRevenue, quotes: s.quotes + x.quotes, cancelled: s.cancelled + x.cancelled }), {
    orders: 0,
    revenue: 0,
    paidOrders: 0,
    paidRevenue: 0,
    quotes: 0,
    cancelled: 0,
  });
  return (
    <>
      <PageHeader title="Nguồn khách" />
      <p className="mb-3 max-w-3xl text-sm text-neutral-600">
        Đơn đến từ đâu, tính từ dữ liệu lưu cùng đơn (không phụ thuộc Google Analytics hay trình chặn quảng cáo). Không gồm đơn seller và đơn thử. Doanh thu = đơn chưa huỷ; &quot;đã thu&quot; = đơn đã chuyển sang Đã thanh toán.
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {PERIODS.map((d) => (
          <Link key={d} href={href(d, r.touch)} className={`btn-ghost ${r.days === d ? "bg-brand-light" : ""}`}>
            {d === 365 ? "1 năm" : `${d} ngày`}
          </Link>
        ))}
        <span className="mx-1 w-px self-stretch bg-neutral-200" />
        <Link href={href(r.days, "last")} className={`btn-ghost ${r.touch === "last" ? "bg-brand-light" : ""}`}>
          Lần chạm gần nhất
        </Link>
        <Link href={href(r.days, "first")} className={`btn-ghost ${r.touch === "first" ? "bg-brand-light" : ""}`}>
          Lần chạm đầu
        </Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Nguồn</th>
              <th className="px-3 py-2 text-right">Đơn</th>
              <th className="px-3 py-2 text-right">Doanh thu</th>
              <th className="px-3 py-2 text-right">Đã thu</th>
              <th className="px-3 py-2 text-right">Báo giá</th>
              <th className="px-3 py-2 text-right">Huỷ</th>
            </tr>
          </thead>
          <tbody>
            {r.rows.map((x) => (
              <tr key={x.group} className="border-t border-neutral-100">
                <td className="px-3 py-2 font-medium">{x.label}</td>
                <td className="px-3 py-2 text-right tabular-nums">{x.orders}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatVND(x.revenue)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatVND(x.paidRevenue)} <span className="text-neutral-400">({x.paidOrders})</span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{x.quotes}</td>
                <td className="px-3 py-2 text-right tabular-nums text-neutral-500">{x.cancelled}</td>
              </tr>
            ))}
            {!r.rows.length && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-neutral-500">
                  Chưa có đơn trong khoảng này.
                </td>
              </tr>
            )}
          </tbody>
          {r.rows.length > 0 && (
            <tfoot className="border-t-2 border-neutral-200 font-bold">
              <tr>
                <td className="px-3 py-2">Tổng</td>
                <td className="px-3 py-2 text-right tabular-nums">{sum.orders}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatVND(sum.revenue)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatVND(sum.paidRevenue)} <span className="font-normal text-neutral-400">({sum.paidOrders})</span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{sum.quotes}</td>
                <td className="px-3 py-2 text-right tabular-nums">{sum.cancelled}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="mt-3 space-y-1 text-sm text-neutral-600">
        <p>
          <b>Đơn thử đã loại ra:</b> {r.tests.orders} đơn ({formatVND(r.tests.revenue)}), {r.tests.quotes} báo giá. Đơn thử = đặt ở chế độ yala.vn/?yala_test=1 hoặc dùng email/SĐT trong biến TEST_ORDER_CONTACTS của máy chủ.
        </p>
        {r.legacy > 0 && <p>{r.legacy} đơn đặt trước khi có cột nguồn: nhóm được tính tạm từ UTM còn lưu, đơn không có UTM vào &quot;Trực tiếp / không rõ&quot;.</p>}
      </div>
    </>
  );
}
