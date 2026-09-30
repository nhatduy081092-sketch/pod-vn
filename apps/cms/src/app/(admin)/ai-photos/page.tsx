import { adminFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import { AiPhotoStudio, type AiProduct } from "@/components/AiPhotoStudio";

export const metadata = { title: "Ảnh thật AI" };

export default async function AiPhotosPage() {
  const config = await adminFetch<{ enabled: boolean; model: string }>("/ai-photo/config").catch(() => ({ enabled: false, model: "" }));
  const items: AiProduct[] = [];
  for (let page = 1; page <= 10; page++) {
    const r = await adminFetch<{ items: (AiProduct & { category?: { name: string } })[]; total: number; pageSize: number }>(`/products?page=${page}&pageSize=100`);
    items.push(...r.items.map((p) => ({ id: p.id, name: p.name, slug: p.slug, images: p.images, isActive: p.isActive, categoryName: p.category?.name ?? "" })));
    if (page * r.pageSize >= r.total) break;
  }
  return (
    <>
      <PageHeader title="Ảnh thật AI – đổi ảnh sản phẩm 2D sang ảnh chụp" />
      <AiPhotoStudio products={items} enabled={config.enabled} model={config.model} />
    </>
  );
}
