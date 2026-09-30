import Link from "next/link";
import { DESIGN_COLLECTIONS } from "@pod/shared";
import { DesignPreview } from "../designs/DesignPreview";
import { DesignFonts } from "../designs/DesignFonts";
import { SectionTitle } from "./SectionTitle";

/** Lưới ô vuông các bộ sưu tập "Mẫu có sẵn" – mobile hiện 12 ô, desktop đủ 24 */
export function CollectionGrid({ eyebrow, title }: { eyebrow: string; title: string }) {
  const covers = DESIGN_COLLECTIONS.map((c) => ({ c, d: c.designs[0]! }));
  return (
    <section className="py-10 md:py-16" aria-label={title}>
      <DesignFonts designs={covers.map((x) => x.d)} />
      <SectionTitle eyebrow={eyebrow} href="/bo-suu-tap" hrefLabel={`Xem ${DESIGN_COLLECTIONS.length} chủ đề`}>
        {title}
      </SectionTitle>
      <ul className="container-site mt-6 grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 md:mt-8 md:grid-cols-6 md:gap-x-4 md:gap-y-6 xl:grid-cols-8">
        {covers.map(({ c, d }, i) => (
          <li key={c.slug} className={i >= 12 ? "hidden md:block" : ""}>
            <Link href={`/bo-suu-tap/${c.slug}`} className="group block text-center">
              <div className="relative aspect-square overflow-hidden rounded-xl" style={{ backgroundColor: c.tint }}>
                <DesignPreview design={d} className="absolute inset-[6%] h-[88%] w-[88%] transition duration-300 group-hover:scale-[1.04]" title={c.name} />
              </div>
              <p className="mt-2 line-clamp-2 text-[12.5px] font-medium leading-tight md:text-sm">{c.name}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="container-site mt-5 md:hidden">
        <Link href="/bo-suu-tap" className="btn-outline w-full">
          Xem tất cả {DESIGN_COLLECTIONS.length} chủ đề
        </Link>
      </div>
    </section>
  );
}
