import Link from "next/link";
import { assetUrl } from "@/lib/config";

export type CatalogItem = { id: string; name: string; slug: string; count: number; image: string };

/** Lưới toàn bộ danh mục – mọi sản phẩm đều cá nhân hoá được */
export function CatalogSection({ items }: { items: CatalogItem[] }) {
  if (!items.length) return null;
  const total = items.reduce((s, x) => s + x.count, 0);
  return (
    <section id="danh-muc" className="scroll-mt-16 bg-surface py-12 md:py-16">
      <div className="container-site">
        <div className="text-center">
          <span className="eyebrow">
            {total.toLocaleString("vi-VN")}+ SẢN PHẨM
          </span>
          <h2 className="h-section mt-1.5">Mọi sản phẩm đều cá nhân hoá được</h2>
          <p className="mx-auto mt-1 max-w-2xl text-sm text-ink/70 md:text-base">
            In, thêu, khắc tên – logo – thông điệp riêng lên áo, balo, bình giữ nhiệt, sổ, vali, quà tặng… Làm từ số lượng nhỏ đến đơn doanh nghiệp.
          </p>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/danh-muc/${c.slug}`} className="group block overflow-hidden rounded-xl bg-white transition hover:shadow-soft">
                <div className="relative aspect-square overflow-hidden bg-white">
                  {c.image && <img src={assetUrl(c.image)} alt="" loading="lazy" className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-105" />}
                  <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-extrabold text-white">{c.count}</span>
                </div>
                <p className="flex min-h-[3.2em] items-center justify-center bg-navy px-2 py-1.5 text-center text-[12.5px] font-bold leading-tight text-white md:text-sm">{c.name}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
