import Link from "next/link";
import { DESIGN_COLLECTIONS } from "@pod/shared";
import { pastel, tiltOf } from "@/lib/pastel";
import { DesignPreview } from "../designs/DesignPreview";
import { DesignFonts } from "../designs/DesignFonts";
import { SectionTitle } from "./SectionTitle";

/** Bộ sưu tập "Mẫu có sẵn" dạng sticker pastel nghiêng – bật nảy khi cuộn tới, lắc khi rê chuột */
export function CollectionGrid({ title }: { eyebrow?: string; title: string }) {
  const covers = DESIGN_COLLECTIONS.map((c) => ({ c, d: c.designs[0]! }));
  return (
    <section className="py-12 md:py-20" aria-label={title}>
      <DesignFonts designs={covers.map((x) => x.d)} />
      <SectionTitle href="/bo-suu-tap" hrefLabel={`Cả ${DESIGN_COLLECTIONS.length} chủ đề`} sub="Mẫu chữ tiếng Việt do YALA thiết kế – sửa chữ, đổi màu áo, in từ 1 chiếc.">
        {title}
      </SectionTitle>
      <ul className="container-site mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:mt-10 md:grid-cols-4 md:gap-x-6 md:gap-y-9 xl:grid-cols-6">
        {covers.map(({ c, d }, i) => (
          <li key={c.slug} className={i >= 12 ? "hidden md:block" : i >= 6 ? "hidden sm:block" : ""} data-reveal="pop" style={{ ["--d" as string]: `${(i % 6) * 60}ms` }}>
            <Link href={`/bo-suu-tap/${c.slug}`} className="hover-wiggle tilt group block" style={{ ["--r" as string]: `${tiltOf(i)}deg` }}>
              <div className={`sticker relative aspect-square overflow-hidden ${pastel(i)}`}>
                <DesignPreview design={d} className="absolute inset-[5%] h-[90%] w-[90%] transition duration-300 group-hover:scale-[1.06]" title={c.name} />
              </div>
              <p className="mt-3 text-center font-display text-[15px] font-bold leading-tight md:text-base">{c.name}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="container-site mt-8 md:hidden">
        <Link href="/bo-suu-tap" className="btn-outline w-full">
          Xem cả {DESIGN_COLLECTIONS.length} chủ đề
        </Link>
      </div>
    </section>
  );
}
