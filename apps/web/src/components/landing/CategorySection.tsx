import type { ProductCardData } from "@/lib/types";
import { ProductGrid } from "../shop/ProductCard";
import { SectionTitle } from "./SectionTitle";

export function CategorySection({ name, slug, products, eyebrow }: { name: string; slug: string; products: ProductCardData[]; eyebrow?: string }) {
  if (!products.length) return null;
  return (
    <section className="pt-10 md:pt-16" aria-label={name}>
      <SectionTitle eyebrow={eyebrow} href={`/danh-muc/${slug}`}>
        {name}
      </SectionTitle>
      <div className="container-site mt-6 md:mt-8">
        <ProductGrid items={products} even />
      </div>
    </section>
  );
}
