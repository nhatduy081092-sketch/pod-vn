import Link from "next/link";
import { assetUrl } from "@/lib/config";
import { SectionTitle } from "./SectionTitle";

export type CatalogItem = { id: string; name: string; slug: string; count: number; image: string };

/** Lưới toàn bộ danh mục (merchandise + phôi OEM, ảnh sản phẩm thật) – mọi sản phẩm đều cá nhân hoá được */
export function CatalogSection({ items }: { items: CatalogItem[] }) {
  if (!items.length) return null;
  const total = items.reduce((s, x) => s + x.count, 0);
  return (
    <section id="danh-muc" className="scroll-mt-16 py-[clamp(48px,7vh,96px)]" aria-label="Mọi sản phẩm đều cá nhân hoá được">
      <SectionTitle href="/san-pham" hrefLabel={`Cả ${total.toLocaleString("vi-VN")} sản phẩm`} sub="In, thêu, khắc tên – logo – thông điệp riêng lên áo, balo, bình giữ nhiệt, sổ, vali, quà tặng… từ số lượng nhỏ đến đơn doanh nghiệp.">
        Mọi sản phẩm đều cá nhân hoá được
      </SectionTitle>
      {/* điện thoại: ảnh nhỏ cạnh tên, 2 cột (đủ 10 danh mục mà không phải cuộn dài); từ sm: ô ảnh vuông như cũ */}
      <ul className="container-site mt-6 grid grid-cols-2 gap-x-3 gap-y-3 sm:mt-8 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-5 md:gap-x-6 md:gap-y-7 lg:grid-cols-5">
        {items.map((c, i) => (
          <li key={c.id} data-reveal="rise" style={{ ["--d" as string]: `${(i % 5) * 60}ms` }}>
            <Link href={`/danh-muc/${c.slug}`} className="group flex items-center gap-3 sm:block">
              <div className="aspect-square w-14 shrink-0 overflow-hidden rounded-lg bg-surface sm:w-auto">
                {c.image ? (
                  <img src={assetUrl(c.image)} alt={c.name} loading="lazy" decoding="async" className="h-full w-full object-contain p-[8%] mix-blend-multiply transition duration-500 group-hover:scale-105" />
                ) : (
                  // chưa có ảnh chụp thật: hiện tên dòng hàng thay vì ảnh minh hoạ (điện thoại: chữ cái đầu, tên đã ở bên cạnh)
                  <>
                    <span aria-hidden className="flex h-full items-center justify-center font-display text-2xl font-bold text-ink/60 sm:hidden">{c.name.charAt(0)}</span>
                    <span className="hidden h-full items-end p-[10%] font-display text-[clamp(24px,2.6vw,36px)] font-bold leading-[1.05] tracking-[-0.02em] text-ink/85 sm:flex">{c.name}</span>
                  </>
                )}
              </div>
              <span className="block min-w-0 sm:mt-3">
                <span className="block font-display text-[15px] font-bold leading-tight transition-colors group-hover:text-brand-dark sm:text-base md:text-[17px]">{c.name}</span>
                <span className="mt-0.5 block whitespace-nowrap text-[13px] tabular-nums text-ink/70 sm:text-[15px]">{c.count.toLocaleString("vi-VN")} sản phẩm</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
