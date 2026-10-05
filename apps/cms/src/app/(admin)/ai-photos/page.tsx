import { adminFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import { AiPhotoStudio, type AiProduct } from "@/components/AiPhotoStudio";
import { BlankPhotos, type BlankItem } from "@/components/BlankPhotos";
import { ModelPhotos, type ModelItem } from "@/components/ModelPhotos";

export const metadata = { title: "Ảnh thật AI" };

export default async function AiPhotosPage() {
  const config = await adminFetch<{ enabled: boolean; model: string; budget?: number; spent?: number; unit?: number }>("/ai-photo/config").catch(() => ({ enabled: false, model: "", budget: 0, spent: 0, unit: 0 }));
  const blanks = await adminFetch<{ items: BlankItem[]; aiEnabled: boolean }>("/blanks").catch(() => ({ items: [] as BlankItem[], aiEnabled: false }));
  const models = await adminFetch<{ items: ModelItem[] }>("/models").catch(() => ({ items: [] as ModelItem[] }));
  const items: AiProduct[] = [];
  for (let page = 1; page <= 10; page++) {
    const r = await adminFetch<{ items: (AiProduct & { category?: { name: string } })[]; total: number; pageSize: number }>(`/products?page=${page}&pageSize=100`);
    items.push(...r.items.map((p) => ({ id: p.id, name: p.name, slug: p.slug, images: p.images, isActive: p.isActive, categoryName: p.category?.name ?? "" })));
    if (page * r.pageSize >= r.total) break;
  }
  return (
    <>
      <PageHeader title="Ảnh thật – phôi trơn & sản phẩm" />
      {config.enabled && config.budget !== undefined && (
        <p className="mb-4 rounded-lg border bg-amber-50 px-4 py-2.5 text-sm">
          Hạn mức chi AI: <b>{config.budget} USD</b> · đã dùng ~<b>{(config.spent ?? 0).toFixed(2)} USD</b> · còn ~{Math.max(0, (config.budget ?? 0) - (config.spent ?? 0)).toFixed(2)} USD (~
          {config.unit ? Math.floor(Math.max(0, (config.budget ?? 0) - (config.spent ?? 0)) / config.unit) : 0} ảnh). Chạm hạn mức là tự dừng, không gọi AI nữa.
        </p>
      )}
      {blanks.items.length > 0 && <BlankPhotos items={blanks.items} aiEnabled={blanks.aiEnabled} />}
      {models.items.length > 0 && <ModelPhotos items={models.items} />}
      <AiPhotoStudio products={items} enabled={config.enabled} model={config.model} />
    </>
  );
}
