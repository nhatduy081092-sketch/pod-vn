import { adminFetch } from "@/lib/api";
import type { AdminCategory } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { ProductTypeCreator } from "@/components/ProductTypeCreator";

export const metadata = { title: "Tạo sản phẩm theo loại" };

export default async function NewFromType() {
  const cats = await adminFetch<AdminCategory[]>("/categories");
  return (
    <>
      <PageHeader title="Tạo sản phẩm theo loại (tranh, cờ, cốc, gối…)" />
      <ProductTypeCreator categories={cats} />
    </>
  );
}
