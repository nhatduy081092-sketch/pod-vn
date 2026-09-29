import type { LandingSettings } from "@pod/shared";

/** Quy trình 5 bước – bố cục zig-zag trái/phải như mẫu */
export function Steps({ steps }: { steps: LandingSettings["steps"] }) {
  return (
    <section className="bg-white py-8 md:py-14" aria-labelledby="steps-title">
      <h2 id="steps-title" className="sr-only">
        Quy trình đặt in
      </h2>
      <ol className="container-site max-w-[860px]">
        {steps.map((s, i) => {
          const right = i % 2 === 1;
          return (
            <li key={i} className={`relative flex ${right ? "justify-end" : "justify-start"} ${i ? "-mt-3 md:-mt-4" : ""}`}>
              <div className="relative w-[clamp(150px,34vw,300px)] pt-3">
                <span className="absolute -left-2 top-0 z-10 rounded-[4px] bg-ink px-2 py-0.5 text-[clamp(10px,2.4vw,15px)] font-extrabold text-brand-badge">
                  Bước {i + 1}
                </span>
                <div
                  className="halftone relative flex min-h-[clamp(46px,9.5vw,80px)] items-center justify-center rounded-lg border-2 border-ink px-3 py-2 text-center shadow-stack"
                  style={{ backgroundColor: s.color }}
                >
                  <p className="text-[clamp(10px,2.5vw,16px)] font-extrabold leading-snug text-ink">{s.title}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
