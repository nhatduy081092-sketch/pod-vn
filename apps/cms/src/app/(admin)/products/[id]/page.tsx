import { adminFetch } from "@/lib/api";
import type { AdminCategory, AdminProduct } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { ProductForm } from "@/components/ProductForm";
import { WEB_URL } from "@/lib/config";
import { VariantEditor } from "@/components/VariantEditor";
import { PrintAreaEditor } from "@/components/PrintAreaEditor";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, cats] = await Promise.all([adminFetch<AdminProduct>(`/products/${id}`), adminFetch<AdminCategory[]>("/categories")]);
  return (
    <>
      <PageHeader title="Sửa sản phẩm">
        <a href={`${WEB_URL}/thiet-ke/${product.slug}`} target="_blank" rel="noreferrer" className="btn-ghost">
          Thử công cụ thiết kế ↗
        </a>
        <a href={`${WEB_URL}/san-pham/${product.slug}`} target="_blank" rel="noreferrer" className="btn-ghost">
          Xem trên web ↗
        </a>
      </PageHeader>
      <ProductForm categories={cats} product={product} />
      <div className="mt-4 grid gap-4">
        <VariantEditor productId={product.id} productName={product.name} initial={product.variants ?? []} />
        <PrintAreaEditor productId={product.id} productImage={product.images[0] ?? ""} initial={product.printAreas ?? []} sizes={[...new Set((product.variants ?? []).map((v) => v.size).filter(Boolean))]} />
      </div>
    </>
  );
}
