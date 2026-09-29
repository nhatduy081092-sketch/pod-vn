import Link from "next/link";
import { adminFetch } from "@/lib/api";
import type { AdminCategory, AdminProduct, Paged } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { PriceTable } from "@/components/PriceTable";
import { Pager, ProductFilters, type ProductFilterParams } from "@/components/ProductFilters";

export const metadata = { title: "Bảng giá nhanh" };

export default async function PricesPage({ searchParams }: { searchParams: Promise<ProductFilterParams> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
  const apiQs = new URLSearchParams(qs);
  apiQs.set("pageSize", "50");
  const [data, cats] = await Promise.all([
    adminFetch<Paged<AdminProduct>>(`/products?${apiQs.toString()}`),
    adminFetch<AdminCategory[]>("/categories"),
  ]);
  const pages = Math.ceil(data.total / data.pageSize);
  return (
    <>
      <PageHeader title={`Bảng giá nhanh (${data.total})`}>
        <Link href={`/products?${qs.toString()}`} className="btn-ghost h-fit">
          ← Danh sách sản phẩm
        </Link>
      </PageHeader>
      <div className="mb-3 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <p>
          <b>Giá bán &gt; 0</b> → khách đặt online. <b>Giá bán trống/0</b> → sản phẩm báo giá; điền <b>Giá &quot;Từ&quot;</b> để hiện &quot;Từ …₫&quot; trên
          website. Gõ <code>45k</code> = 45.000₫. Sửa nhiều dòng rồi bấm <b>Lưu thay đổi</b>.
        </p>
      </div>
      <ProductFilters sp={sp} cats={cats} action="/products/prices" />
      {data.items.length ? (
        <PriceTable key={qs.toString()} items={data.items} />
      ) : (
        <p className="card text-sm text-neutral-500">Không có sản phẩm phù hợp bộ lọc.</p>
      )}
      <Pager basePath="/products/prices" qs={qs} page={data.page} pages={pages} />
    </>
  );
}
