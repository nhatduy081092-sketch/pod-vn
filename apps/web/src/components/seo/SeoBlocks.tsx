import Link from "next/link";

/*
 * Khối dùng chung cho trang SEO mẫu áo + trang nhóm khách (redesign 31/10/2026):
 * tiêu đề khối cỡ lớn, dòng liên kết nền nhạt, hỏi đáp – không viền, không bóng, chữ ≥ 15px.
 */

export const h2Big = "font-display text-[clamp(30px,3.6vw,52px)] font-bold leading-[1.05] tracking-[-0.03em] [text-wrap:balance]";
export const rowLink = "group flex items-center justify-between gap-4 rounded-lg bg-surface px-5 py-4 transition-colors hover:bg-ink hover:text-white";

/** Tách tiêu đề dài "Phần chính – phần phụ" -> h1 ngắn (≤ 2 dòng) + câu đỡ; không có dấu gạch thì giữ nguyên */
export function splitTitle(t: string): [string, string] {
  const i = t.indexOf(" – ");
  if (i < 0) return [t, ""];
  const rest = t.slice(i + 3);
  return [t.slice(0, i), rest.charAt(0).toLocaleUpperCase("vi") + rest.slice(1)];
}

export function Arrow() {
  return (
    <span aria-hidden className="shrink-0 text-lg transition-transform duration-200 group-hover:translate-x-1">
      →
    </span>
  );
}

export function Breadcrumb({ name }: { name: string }) {
  return (
    <nav className="mb-5 text-[15px] text-ink/70" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-ink">
        Trang chủ
      </Link>{" "}
      / <span className="text-ink">{name}</span>
    </nav>
  );
}

/** Hỏi đáp: tiêu đề cột trái, câu hỏi mở/đóng cột phải */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  if (!items.length) return null;
  return (
    <section className="container-site grid gap-8 py-[clamp(72px,12vh,150px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16" aria-labelledby="hoi-dap">
      <h2 id="hoi-dap" className={h2Big}>
        Câu hỏi thường gặp
      </h2>
      <div className="space-y-2">
        {items.map((f) => (
          <details key={f.q} className="group rounded-lg bg-surface px-5 py-4 open:bg-sky/60">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-lg font-semibold leading-snug">
              {f.q}
              <span aria-hidden className="mt-0.5 text-2xl leading-none transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 max-w-[40rem] text-base leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
