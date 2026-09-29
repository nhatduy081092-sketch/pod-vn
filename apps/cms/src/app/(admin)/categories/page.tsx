import { adminFetch } from "@/lib/api";
import type { AdminCategory } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { CategoryManager } from "@/components/CategoryManager";

export const metadata = { title: "Danh mục" };

export default async function CategoriesPage() {
  const cats = await adminFetch<AdminCategory[]>("/categories");
  return (
    <>
      <PageHeader title="Danh mục sản phẩm" />
      <p className="mb-4 text-sm text-neutral-500">Mỗi danh mục bật “Hiện trang chủ” sẽ là một section sản phẩm trên landing (theo thứ tự).</p>
      <CategoryManager initial={cats} />
    </>
  );
}
