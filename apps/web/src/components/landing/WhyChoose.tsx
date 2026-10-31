import type { LandingSettings } from "@pod/shared";

/** Cam kết: tiêu đề + câu dẫn bên trái, 6 cam kết dạng chữ (không icon, không thẻ) bên phải */
export function WhyChoose({ data }: { data: LandingSettings["whyChoose"] }) {
  return (
    <section className="container-site grid gap-10 py-[clamp(72px,12vh,150px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16" aria-labelledby="vi-sao-chon">
      <div>
        <h2 id="vi-sao-chon" className="font-display text-[clamp(30px,3.6vw,52px)] font-bold leading-[1.06] tracking-[-0.03em] [text-wrap:balance]">
          {data.title}
        </h2>
        {data.text && <p className="mt-5 max-w-md text-base leading-relaxed text-ink/80 md:text-lg">{data.text}</p>}
      </div>
      <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
        {data.items.map((it, i) => (
          <li key={it.title} data-reveal="rise" style={{ ["--d" as string]: `${(i % 2) * 70}ms` }}>
            <h3 className="font-display text-xl font-bold leading-snug md:text-2xl">{it.title}</h3>
            <p className="mt-2 text-base leading-relaxed text-ink/80">{it.desc}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
