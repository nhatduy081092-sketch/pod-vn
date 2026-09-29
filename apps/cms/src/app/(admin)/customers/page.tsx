import { adminFetch } from "@/lib/api";
import type { Paged } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { Pager } from "@/components/ProductFilters";
import { CustomerRow, type AdminCustomer } from "@/components/AdminTables";

export const metadata = { title: "Khách hàng" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
  const data = await adminFetch<Paged<AdminCustomer>>(`/customers?${qs.toString()}`);
  return (
    <>
      <PageHeader title={`Khách hàng có tài khoản (${data.total})`} />
      <form className="card mb-3 flex gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Tìm SĐT, tên, email..." className="input max-w-xs" />
        <button className="btn-primary">Tìm</button>
      </form>
      <div className="card overflow-x-auto p-0 md:p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Khách</th>
              <th>SĐT</th>
              <th>Đơn</th>
              <th>Thiết kế</th>
              <th>Seller</th>
              <th>Ngày tạo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((c) => (
              <CustomerRow key={c.id} c={c} />
            ))}
          </tbody>
        </table>
      </div>
      <Pager basePath="/customers" qs={qs} page={data.page} pages={Math.ceil(data.total / data.pageSize)} />
    </>
  );
}
