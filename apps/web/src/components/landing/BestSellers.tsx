import type { ProductCardData } from "@/lib/types";
import { ProductGrid } from "../shop/ProductCard";
import { SectionTitle } from "./SectionTitle";

/** Bán chạy: xếp theo đơn thật 30 ngày + lượt xem (API /home) */
export function BestSellers({ title, items }: { title: string; items: ProductCardData[] }) {
  if (!items.length) return null;
  return (
    <section className="py-12 md:py-20" data-reveal>
      <SectionTitle href="/san-pham?sort=ban-chay" sub="Xếp theo số đơn và lượt xem 30 ngày gần nhất.">
        {title}
      </SectionTitle>
      <div className="container-site mt-7 md:mt-9">
        <ProductGrid items={items} even mobileMax={4} />
      </div>
    </section>
  );
}
