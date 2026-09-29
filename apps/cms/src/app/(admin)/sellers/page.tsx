import Link from "next/link";
import { SELLER_STATUS_LABEL, SELLER_STATUSES } from "@pod/shared";
import { adminFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import { SellerCard, type AdminSeller } from "@/components/AdminTables";

export const metadata = { title: "Seller" };

export default async function SellersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const items = await adminFetch<AdminSeller[]>(`/sellers${sp.status ? `?status=${sp.status}` : ""}`);
  return (
    <>
      <PageHeader title={`Seller dropship (${items.length})`}>
        <Link href="/batches" className="btn-ghost">
          Thanh toán gộp →
        </Link>
      </PageHeader>
      <p className="mb-3 text-sm text-neutral-600">
        Duyệt seller → seller có khu <b>/seller</b> (mẫu sản phẩm, tạo đơn, nhập CSV, API key, webhook). Chiết khấu % trừ trên giá bán lẻ (sau KM/giá sỉ).
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        <Link href="/sellers" className={`btn-ghost ${!sp.status ? "bg-brand-light" : ""}`}>
          Tất cả
        </Link>
        {SELLER_STATUSES.map((s) => (
          <Link key={s} href={`/sellers?status=${s}`} className={`btn-ghost ${sp.status === s ? "bg-brand-light" : ""}`}>
            {SELLER_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>
      <div className="space-y-3">
        {items.map((s) => (
          <SellerCard key={s.customerId} s={s} />
        ))}
        {!items.length && <p className="card text-sm text-neutral-500">Chưa có seller nào đăng ký.</p>}
      </div>
    </>
  );
}
