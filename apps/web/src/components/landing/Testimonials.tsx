import { formatDateVN, formatVND } from "@pod/shared";
import type { Testimonial } from "@/lib/types";
import { assetUrl } from "@/lib/config";
import { SectionTitle } from "./SectionTitle";
import { IconStar } from "../ui/icons";

export function Testimonials({ title, items }: { title: string; items: Testimonial[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-cream py-10 md:py-14">
      <SectionTitle>{title}</SectionTitle>
      <div className="no-scrollbar mt-6 overflow-x-auto">
        <ul className="mx-auto flex w-max snap-x gap-4 px-4 pb-3 md:px-6">
          {items.map((t) => (
            <li key={t.id} className="w-[78vw] max-w-[320px] snap-start">
              <article className="flex h-full flex-col rounded-lg border-2 border-ink bg-white p-4 shadow-stack">
                <header className="flex items-center justify-between">
                  <p className="font-extrabold">{t.name}</p>
                  <time className="text-xs text-ink/60">{formatDateVN(t.createdAt)}</time>
                </header>
                <div className="mt-1 flex text-brand" aria-label={`${t.rating}/5 sao`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <IconStar key={i} className={`h-4 w-4 ${i < t.rating ? "" : "opacity-25"}`} />
                  ))}
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/85">{t.content}</p>
                {t.productName && (
                  <footer className="mt-3 flex items-center gap-2 border-t border-dashed border-ink/20 pt-3">
                    {t.imageUrl && <img src={assetUrl(t.imageUrl)} alt="" className="h-10 w-10 rounded object-cover" />}
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-xs font-semibold">{t.productName}</p>
                      {t.productPrice != null && <p className="text-sm font-black text-brand-dark">{formatVND(t.productPrice)}</p>}
                    </div>
                  </footer>
                )}
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
