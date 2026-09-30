import type { ProductCardData } from "@/lib/types";
import { ProductGrid } from "../shop/ProductCard";
import { SectionTitle } from "./SectionTitle";

/** Bán chạy: lưới 4 cột như trang danh mục (ảnh lớn, rê chuột đổi ảnh) */
export function BestSellers({ title, items }: { title: string; items: ProductCardData[] }) {
  if (!items.length) return null;
  return (
    <section className="py-10 md:py-16">
      <SectionTitle eyebrow="Được đặt nhiều nhất tuần này" href="/san-pham?bo-suu-tap=ban-chay">
        {title}
      </SectionTitle>
      <div className="container-site mt-6 md:mt-8">
        <ProductGrid items={items} even />
      </div>
    </section>
  );
}
