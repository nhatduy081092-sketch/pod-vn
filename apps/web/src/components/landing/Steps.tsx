import type { LandingSettings } from "@pod/shared";
import { SectionTitle } from "./SectionTitle";

/** Quy trình đặt in: dãy bước đánh số (cuộn ngang trên mobile) */
export function Steps({ steps }: { steps: LandingSettings["steps"] }) {
  if (!steps.length) return null;
  return (
    <section className="bg-surface py-12 md:py-16" aria-label="Quy trình đặt in">
      <SectionTitle eyebrow="Đơn giản, minh bạch">Đặt in trong {steps.length} bước</SectionTitle>
      <ol className="no-scrollbar container-site mt-7 flex snap-x scroll-px-4 gap-3 overflow-x-auto pb-1 md:grid md:overflow-visible md:gap-5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => (
          <li key={i} className="w-[72%] shrink-0 snap-start rounded-2xl bg-white p-5 sm:w-[44%] md:w-auto">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-semibold text-white">{i + 1}</span>
            <p className="mt-4 text-[15px] font-medium leading-snug">{s.title}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
