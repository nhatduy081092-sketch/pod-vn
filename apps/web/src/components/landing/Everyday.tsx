import type { LandingSettings } from "@pod/shared";
import type { ProductCardData } from "@/lib/types";
import { ProductGrid } from "../shop/ProductCard";
import { SectionTitle } from "./SectionTitle";

/** Dòng basic trơn – mua kèm để tăng giá trị đơn */
export function Everyday({ data, items }: { data: LandingSettings["everyday"]; items: ProductCardData[] }) {
  if (!data.enabled || !items.length) return null;
  return (
    <section className="py-12 md:py-16" aria-label={data.title}>
      <SectionTitle eyebrow={data.eyebrow} href={`/danh-muc/${data.categorySlug}`}>
        {data.title}
      </SectionTitle>
      {data.subtitle && (
        <div className="container-site">
          <p className="mt-2 max-w-2xl text-[15px] text-muted">{data.subtitle}</p>
        </div>
      )}
      <div className="container-site mt-6 md:mt-8">
        <ProductGrid items={items} even />
      </div>
    </section>
  );
}
