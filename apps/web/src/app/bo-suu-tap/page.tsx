import type { Metadata } from "next";
import Link from "next/link";
import { DESIGN_COLLECTIONS, DESIGN_GROUPS, READY_DESIGNS } from "@pod/shared";
import { DesignPreview } from "@/components/designs/DesignPreview";
import { DesignFonts } from "@/components/designs/DesignFonts";
import { pastel, tiltOf } from "@/lib/pastel";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Mẫu áo chữ có sẵn theo chủ đề – sửa chữ miễn phí",
  description: `${READY_DESIGNS.length} mẫu áo chữ tiếng Việt theo ${DESIGN_COLLECTIONS.length} chủ đề: gym, pickleball, cà phê, cặp đôi, gia đình, Tết… Chọn mẫu, sửa chữ, in từ 1 chiếc.`,
  alternates: { canonical: "/bo-suu-tap" },
};

/** Mẫu có sẵn: nhóm theo dịp / sở thích / đối tượng, mỗi bộ là 1 thẻ sticker với 2 mẫu tiêu biểu */
export default function CollectionsPage() {
  const covers = DESIGN_COLLECTIONS.flatMap((c) => c.designs.slice(0, 2));
  let n = 0;
  return (
    <>
      <DesignFonts designs={covers} />
      <section className="relative overflow-hidden border-b-2 border-ink bg-sky">
        <div className="container-site relative py-10 md:py-16">
          <nav className="text-sm text-ink/70" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink">Trang chủ</Link> / <span className="text-ink">Mẫu có sẵn</span>
          </nav>
          <h1 className="mt-3 max-w-3xl font-display text-[clamp(40px,6vw,76px)] font-extrabold leading-[0.95] tracking-[-0.03em] [font-stretch:86%]">
            {READY_DESIGNS.length} mẫu chữ có sẵn. Sửa chữ thoải mái.
          </h1>
          <p className="mt-4 max-w-xl text-[16px] text-ink/80 md:text-lg">Chọn chủ đề → bấm mẫu → đổi chữ, đổi màu áo trong YALA Studio → in từ 1 chiếc.</p>
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Nhóm chủ đề">
            {DESIGN_GROUPS.map((g, i) => (
              <a key={g.key} href={`#${g.key}`} className={`chip-sticker hover-wiggle ${pastel(i + 2)}`}>
                {g.name}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="container-site py-10 md:py-14">
        {DESIGN_GROUPS.map((g) => (
          <section key={g.key} id={g.key} className="scroll-mt-28 pb-14 last:pb-0" aria-label={g.name}>
            <h2 className="h-section">{g.name}</h2>
            <ul className={`mt-7 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:gap-x-6 ${g.slugs.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
              {g.slugs.map((slug) => {
                const c = DESIGN_COLLECTIONS.find((x) => x.slug === slug);
                if (!c) return null;
                const i = n++;
                const [a, b] = c.designs;
                return (
                  <li key={c.slug} data-reveal="pop" style={{ ["--d" as string]: `${(i % 4) * 60}ms` }}>
                    <Link href={`/bo-suu-tap/${c.slug}`} className="hover-wiggle tilt group block" style={{ ["--r" as string]: `${tiltOf(i) / 1.5}deg` }}>
                      <div className={`sticker relative aspect-square overflow-hidden ${pastel(i)}`}>
                        {a && <DesignPreview design={a} className="absolute left-[4%] top-[4%] h-[74%] w-[74%] transition duration-300 group-hover:scale-[1.04]" title={c.name} />}
                        {b && (
                          <span className="absolute bottom-[5%] right-[5%] block h-[44%] w-[44%] rotate-6 overflow-hidden rounded-xl border-2 border-ink bg-white shadow-sticker-sm transition group-hover:rotate-0">
                            <DesignPreview design={b} className="h-full w-full" />
                          </span>
                        )}
                        <span className="absolute left-2.5 top-2.5 rounded-full border-2 border-ink bg-white px-2 py-0.5 text-[11px] font-bold">{c.designs.length} mẫu</span>
                      </div>
                      <h3 className="mt-3 font-display text-[17px] font-bold leading-tight md:text-lg">{c.name}</h3>
                      <p className="mt-0.5 line-clamp-2 text-[13px] text-ink/65 md:text-sm">{c.blurb}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <aside className="sticker mt-4 bg-sun p-6 md:flex md:items-center md:justify-between md:p-10">
          <div>
            <h2 className="font-display text-[clamp(26px,3vw,38px)] font-extrabold leading-tight [font-stretch:88%]">Muốn câu chữ của riêng bạn?</h2>
            <p className="mt-1 text-[15px] text-ink/80">Mở YALA Studio, gõ câu bạn thích, chọn font – xem trước trên áo ngay.</p>
          </div>
          <Link href="/thiet-ke" className="btn-primary mt-5 px-7 py-3.5 text-base md:mt-0">
            Tự thiết kế
          </Link>
        </aside>
      </div>
    </>
  );
}
