import type { LandingSettings } from "@pod/shared";

/**
 * Cam kết – dải chữ lớn kiểu tạp chí (theo bộ Code XR clothing-ecommerce, 11/2026):
 * chữ YALA cỡ lớn trượt lên qua khe, vạch kẻ chạy ngang, rồi hàng thông tin:
 * nhãn – tiêu đề + câu dẫn – danh sách cam kết đánh số. Phần giải thích để trong title khi rê chuột.
 * Cỡ chữ YALA theo bề rộng khung (container query) nên luôn vừa một dòng.
 */
export function WhyChoose({ data }: { data: LandingSettings["whyChoose"] }) {
  return (
    <section className="overflow-hidden bg-ink text-white" aria-labelledby="vi-sao-chon">
      <div className="container-site py-[clamp(48px,7vh,96px)]">
        <div className="[container-type:inline-size]">
          <div className="mask-reveal" data-reveal="mask" aria-hidden>
            <span className="mask-line select-none font-display text-[35cqw] font-black leading-[0.82] tracking-[-0.065em]">
              YALA<span className="text-brand">.</span>
            </span>
          </div>
        </div>
        <div data-reveal="rise" className="mt-6 md:mt-8">
          <span className="draw-rule bg-white/40" aria-hidden />
          <div className="mt-6 grid gap-8 md:mt-8 lg:grid-cols-12 lg:gap-8">
            <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/70 lg:col-span-2 lg:items-start">
              <i className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand lg:mt-[0.45em]" aria-hidden />
              Cam kết
            </p>
            <div className="lg:col-span-4">
              <h2 id="vi-sao-chon" className="font-display text-[clamp(28px,3vw,44px)] font-bold leading-[1.08] tracking-[-0.03em] [text-wrap:balance]">
                {data.title}
              </h2>
              {data.text && <p className="mt-5 max-w-md text-base leading-relaxed text-white/80 md:text-lg">{data.text}</p>}
            </div>
            <ol className="grid gap-x-8 sm:grid-cols-2 lg:col-span-6">
              {data.items.map((it, i) => (
                <li key={it.title} title={it.desc} className="flex gap-4 border-t border-white/20 py-5">
                  <span className="w-6 shrink-0 pt-1 text-[13px] font-bold tabular-nums text-brand">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-display text-lg font-bold leading-snug md:text-xl">{it.title}</h3>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
