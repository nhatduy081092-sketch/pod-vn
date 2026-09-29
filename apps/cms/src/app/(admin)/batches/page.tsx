import Link from "next/link";
import { adminFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import { BatchCard, type AdminBatch } from "@/components/AdminTables";

export const metadata = { title: "Thanh toán gộp" };

export default async function BatchesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const items = await adminFetch<AdminBatch[]>(`/batches${sp.status ? `?status=${sp.status}` : ""}`);
  return (
    <>
      <PageHeader title="Thanh toán gộp của seller" />
      <p className="mb-3 text-sm text-neutral-600">Seller chọn nhiều đơn → 1 mã thanh toán (TT…) → chuyển khoản VietQR. Kiểm tra sao kê có mã TT… rồi bấm &quot;Đã nhận tiền&quot;.</p>
      <div className="mb-3 flex gap-2">
        {[
          ["", "Tất cả"],
          ["UNPAID", "Chờ chuyển khoản"],
          ["PAID", "Đã nhận"],
          ["CANCELLED", "Đã huỷ"],
        ].map(([v, l]) => (
          <Link key={v} href={v ? `/batches?status=${v}` : "/batches"} className={`btn-ghost ${(sp.status ?? "") === v ? "bg-brand-light" : ""}`}>
            {l}
          </Link>
        ))}
      </div>
      <div className="space-y-3">
        {items.map((b) => (
          <BatchCard key={b.id} b={b} />
        ))}
        {!items.length && <p className="card text-sm text-neutral-500">Chưa có lần thanh toán nào.</p>}
      </div>
    </>
  );
}
