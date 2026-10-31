import Link from "next/link";
import { assetUrl } from "@/lib/config";
import { SectionTitle } from "./SectionTitle";

export type CatalogItem = { id: string; name: string; slug: string; count: number; image: string };

/** Lưới toàn bộ danh mục (merchandise + phôi OEM, ảnh sản phẩm thật) – mọi sản phẩm đều cá nhân hoá được */
export function CatalogSection({ items }: { items: CatalogItem[] }) {
  if (!items.length) return null;
  const total = items.reduce((s, x) => s + x.count, 0);
  return (
    <section id="danh-muc" className="scroll-mt-16 py-[clamp(72px,12vh,150px)]" aria-label="Mọi sản phẩm đều cá nhân hoá được">
      <SectionTitle href="/san-pham" hrefLabel={`Cả ${total.toLocaleString("vi-VN")} sản phẩm`} sub="In, thêu, khắc tên – logo – thông điệp riêng lên áo, balo, bình giữ nhiệt, sổ, vali, quà tặng… từ số lượng nhỏ đến đơn doanh nghiệp.">
        Mọi sản phẩm đều cá nhân hoá được
      </SectionTitle>
      <ul className="container-site mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:mt-10 md:gap-x-6 md:gap-y-9 lg:grid-cols-5">
        {items.map((c, i) => (
          <li key={c.id} data-reveal="rise" style={{ ["--d" as string]: `${(i % 5) * 60}ms` }}>
            <Link href={`/danh-muc/${c.slug}`} className="group block">
              <div className="aspect-square overflow-hidden rounded-lg bg-surface">
                {c.image && <img src={assetUrl(c.image)} alt={c.name} loading="lazy" decoding="async" className="h-full w-full object-contain p-[8%] mix-blend-multiply transition duration-500 group-hover:scale-105" />}
              </div>
              <p className="mt-3 font-display text-base font-bold leading-tight transition-colors group-hover:text-brand-dark md:text-[17px]">{c.name}</p>
              <p className="mt-0.5 text-[15px] tabular-nums text-ink/70">{c.count.toLocaleString("vi-VN")} sản phẩm</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
