import { parseContent, type Inline } from "@pod/shared";

/** Render nội dung CMS dạng rút gọn -> JSX (không dùng HTML thô, không XSS) */
export function ContentRenderer({ content }: { content: string }) {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-ink/85">
      {parseContent(content).map((b, i) => {
        if (b.type === "h2")
          return (
            <h2 key={i} className="pt-2 text-lg font-extrabold text-ink md:text-xl">
              {b.text}
            </h2>
          );
        if (b.type === "ul")
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 marker:text-brand-dark">
              {b.items.map((it, j) => (
                <li key={j}>
                  <Inlines items={it} />
                </li>
              ))}
            </ul>
          );
        return (
          <p key={i}>
            <Inlines items={b.inlines} />
          </p>
        );
      })}
    </div>
  );
}

function Inlines({ items }: { items: Inline[] }) {
  return (
    <>
      {items.map((x, i) =>
        x.href ? (
          <a
            key={i}
            href={x.href}
            className="font-semibold text-navy underline underline-offset-2 hover:text-accent"
            {...(x.href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {x.text}
          </a>
        ) : x.bold ? (
          <strong key={i} className="font-bold text-ink">
            {x.text}
          </strong>
        ) : x.italic ? (
          <em key={i} className="text-ink/60">
            {x.text}
          </em>
        ) : (
          <span key={i}>{x.text}</span>
        ),
      )}
    </>
  );
}
