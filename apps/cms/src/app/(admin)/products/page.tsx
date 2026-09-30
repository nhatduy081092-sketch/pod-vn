import Link from "next/link";
import { AUDIENCE_LABEL, formatVND } from "@pod/shared";
import { adminFetch } from "@/lib/api";
import { assetUrl } from "@/lib/config";
import type { AdminCategory, AdminProduct, Paged } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { ImportOemButton } from "@/components/ImportOemButton";
import { Pager, ProductFilters, type ProductFilterParams } from "@/components/ProductFilters";

export const metadata = { title: "Sản phẩm" };

type SP = Promise<ProductFilterParams>;

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
  const [data, cats] = await Promise.all([
    adminFetch<Paged<AdminProduct>>(`/products?${qs.toString()}`),
    adminFetch<AdminCategory[]>("/categories"),
  ]);
  const pages = Math.ceil(data.total / data.pageSize);
  return (
    <>
      <PageHeader title={`Sản phẩm (${data.total})`}>
        <ImportOemButton />
        <Link href={`/products/prices?${qs.toString()}`} className="btn-ghost h-fit">
          Bảng giá nhanh
        </Link>
        <Link href="/products/new-type" className="btn-ghost h-fit">
          + Theo loại (tranh, cờ, cốc, gối…)
        </Link>
        <Link href="/products/new" className="btn-brand h-fit">
          + Thêm sản phẩm
        </Link>
      </PageHeader>
      <ProductFilters sp={sp} cats={cats} action="/products" />
      <div className="card overflow-x-auto p-0 md:p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Đối tượng</th>
              <th>Giá</th>
              <th>Nhãn</th>
              <th>Hiển thị</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-50">
                <td>
                  <img src={assetUrl(p.images[0])} alt="" className="h-12 w-12 rounded border object-contain" />
                </td>
                <td>
                  <Link href={`/products/${p.id}`} className="font-semibold hover:text-brand-dark">
                    {p.name}
                  </Link>
                  <p className="text-xs text-neutral-400">/{p.slug}</p>
                </td>
                <td>{p.category?.name}</td>
                <td>{AUDIENCE_LABEL[p.audience]}</td>
                <td className="whitespace-nowrap font-semibold">
                  {p.basePrice > 0 ? (
                    formatVND(p.basePrice)
                  ) : p.priceFrom ? (
                    <span className="text-sky-700">Từ {formatVND(p.priceFrom)}</span>
                  ) : (
                    <span className="text-neutral-400">Báo giá</span>
                  )}
                </td>
                <td className="text-xs">
                  {p.isBestSeller && <span className="mr-1 rounded bg-brand-light px-1.5 py-0.5">Bán chạy</span>}
                  {p.isHotSale && <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700">Hot</span>}
                </td>
                <td>{p.isActive ? "✓" : <span className="text-neutral-400">Ẩn</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager basePath="/products" qs={qs} page={data.page} pages={pages} />
    </>
  );
}
