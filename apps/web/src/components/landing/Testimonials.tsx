import { formatDateVN, formatVND } from "@pod/shared";
import type { Testimonial } from "@/lib/types";
import { assetUrl } from "@/lib/config";
import { pastel, tiltOf } from "@/lib/pastel";
import { SectionTitle } from "./SectionTitle";
import { IconStar } from "../ui/icons";

/** Đánh giá khách: thẻ sticker pastel nghiêng nhẹ, cuộn ngang */
export function Testimonials({ title, items }: { title: string; items: Testimonial[] }) {
  if (!items.length) return null;
  return (
    <section className="py-12 md:py-20" data-reveal>
      <SectionTitle>{title}</SectionTitle>
      <div className="no-scrollbar mt-6 overflow-x-auto">
        <ul className="mx-auto flex w-max snap-x gap-5 px-4 pb-6 pt-3 md:px-6">
          {items.map((t, i) => (
            <li key={t.id} className="w-[78vw] max-w-[320px] snap-start">
              <article className={`sticker tilt flex h-full flex-col p-5 ${pastel(i + 2)}`} style={{ ["--r" as string]: `${tiltOf(i) / 2}deg` }}>
                <div className="flex text-ink" aria-label={`${t.rating}/5 sao`}>
                  {Array.from({ length: 5 }).map((_, k) => (
                    <IconStar key={k} className={`h-4 w-4 ${k < t.rating ? "" : "opacity-25"}`} />
                  ))}
                </div>
                <p className="mt-3 flex-1 font-display text-[17px] font-semibold leading-snug">“{t.content}”</p>
                <footer className="mt-4 flex items-center gap-2.5 border-t-2 border-ink/15 pt-3">
                  {t.imageUrl && <img src={assetUrl(t.imageUrl)} alt="" className="h-10 w-10 rounded-lg border-2 border-ink object-cover" />}
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="line-clamp-1 text-xs text-ink/65">
                      {t.productName ? `${t.productName}${t.productPrice != null ? ` · ${formatVND(t.productPrice)}` : ""}` : formatDateVN(t.createdAt)}
                    </p>
                  </div>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
