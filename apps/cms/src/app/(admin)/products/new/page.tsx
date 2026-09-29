import { adminFetch } from "@/lib/api";
import type { AdminCategory } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { ProductForm } from "@/components/ProductForm";

export const metadata = { title: "Thêm sản phẩm" };

export default async function NewProduct() {
  const cats = await adminFetch<AdminCategory[]>("/categories");
  return (
    <>
      <PageHeader title="Thêm sản phẩm" />
      <ProductForm categories={cats} />
    </>
  );
}
