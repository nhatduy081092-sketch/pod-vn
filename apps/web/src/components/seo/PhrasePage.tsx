import Link from "next/link";
import { GARMENT_PRODUCT, type PhraseGroup } from "@pod/shared";
import { SITE_URL } from "@/lib/config";
import { TOOL_LINKS } from "./ToolLinks";

/** Mở Studio (áo thun) với câu chữ có sẵn, quay về đúng trang danh sách */
export const phraseHref = (text: string, back: string) => `/thiet-ke/${GARMENT_PRODUCT.tshirt.slug}?chu=${encodeURIComponent(text)}&back=${encodeURIComponent(back)}`;

/** Công thức 2: kho câu chữ miễn phí – mỗi câu bấm "Dùng câu này" là thành áo trong YALA Studio */
export function PhrasePage({
  path,
  title,
  intro,
  groups,
  hub,
  faq,
}: {
  path: string;
  title: string;
  intro: string;
  groups: PhraseGroup[];
  /** trang mẫu áo liên quan (Công thức 1) */
  hub: { href: string; label: string };
  faq: { q: string; a: string }[];
}) {
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: title, item: `${SITE_URL}${path}` },
      ],
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-line bg-cream">
        <div className="container-site py-8 md:py-12">
          <nav className="text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink">
              Trang chủ
            </Link>{" "}
            / <span className="text-ink">{title}</span>
          </nav>
          <h1 className="mt-3 max-w-4xl font-display text-[clamp(28px,3.8vw,46px)] font-bold leading-[1.15] tracking-[-0.02em] [text-wrap:balance]">
            {total} {title.charAt(0).toLowerCase() + title.slice(1)}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/80 md:text-lg">{intro}</p>
          <nav className="mt-5 flex flex-wrap gap-2" aria-label="Nhóm câu chữ">
            {groups.map((g, i) => (
              <a key={g.title} href={`#nhom-${i + 1}`} className="chip-sticker bg-white hover:border-ink">
                {g.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="container-site py-10 md:py-14">
        {groups.map((g, i) => (
          <section key={g.title} id={`nhom-${i + 1}`} className="scroll-mt-28 pb-10">
            <h2 className="text-2xl font-bold">{g.title}</h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((t) => (
                <li key={t} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3">
                  <span className="text-[16px] font-semibold">{t}</span>
                  <Link href={phraseHref(t, path)} prefetch={false} className="shrink-0 text-sm font-semibold text-brand-dark underline underline-offset-4 hover:text-ink">
                    Dùng câu này
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="rounded-2xl bg-ink p-6 text-white md:p-8">
          <h2 className="text-xl font-bold md:text-2xl">Đã chọn được câu? Làm áo cho cả nhóm</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-white/75">
            Bấm “Dùng câu này” để mở YALA Studio với câu chữ trên áo – sửa font, màu, thêm logo, thêm ô tên từng người. Xong bấm Hoàn tất → Tạo link gom đơn nhóm để mọi người tự ghi size.
          </p>
          <Link href={hub.href} className="btn-primary mt-5 px-6">
            {hub.label}
          </Link>
        </div>
      </div>

      <section className="border-t border-line py-10 md:py-14">
        <div className="container-site max-w-3xl">
          <h2 className="h-section">Câu hỏi thường gặp</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {faq.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[16px] font-semibold">
                  {f.q}
                  <span className="mt-0.5 text-xl leading-none text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/80">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream py-10">
        <div className="container-site">
          <h2 className="text-xl font-bold">Công cụ miễn phí khác</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {TOOL_LINKS.filter((l) => l.href !== path).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block h-full rounded-xl border border-line bg-white p-4 transition hover:border-ink">
                  <p className="font-semibold">{l.title}</p>
                  <p className="mt-1 text-sm text-muted">{l.desc}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
