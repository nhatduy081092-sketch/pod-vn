import { effectiveBasePrice, GARMENT_PRODUCT, type GarmentKey } from "@pod/shared";
import { getProducts } from "./api";
import type { BasicPrice } from "@/components/designs/ReadyDesignCard";

/** Giá phôi YALA Everyday theo dáng áo (lỗi/thiếu -> thẻ mẫu ẩn giá, vẫn bấm được) */
export async function basicPrices(): Promise<Partial<Record<GarmentKey, BasicPrice>>> {
  try {
    const r = await getProducts({ category: "yala-everyday", pageSize: "24", "thiet-ke": "1" });
    const out: Partial<Record<GarmentKey, BasicPrice>> = {};
    for (const [g, meta] of Object.entries(GARMENT_PRODUCT) as [GarmentKey, { slug: string }][]) {
      const p = r.items.find((x) => x.slug === meta.slug);
      if (p) out[g] = { basePrice: effectiveBasePrice(p), compareAtPrice: p.compareAtPrice };
    }
    return out;
  } catch {
    return {};
  }
}
