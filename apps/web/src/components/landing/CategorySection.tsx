import Link from "next/link";
import type { ProductCardData } from "@/lib/types";
import { ProductGrid } from "../shop/ProductCard";
import { IconArrow } from "../ui/icons";

export function CategorySection({ name, slug, products }: { name: string; slug: string; products: ProductCardData[] }) {
  return (
    <section className="container-site pt-9 md:pt-14" aria-labelledby={`cat-${slug}`}>
      <h2 id={`cat-${slug}`} className="mb-4 text-center text-[clamp(24px,6.4vw,40px)] font-black tracking-tight md:mb-7">
        {name}
      </h2>
      <ProductGrid items={products} />
      <div className="mt-4 flex justify-center">
        <Link href={`/danh-muc/${slug}`} className="btn-outline py-2 text-[13px]">
          Xem tất cả {name.toLowerCase()} <IconArrow className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
