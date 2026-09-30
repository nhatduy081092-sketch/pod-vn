import Link from "next/link";

/** Tiêu đề section: chữ lớn, nhẹ, không in hoa; tuỳ chọn nhãn nhỏ phía trên + link "Xem tất cả" bên phải */
export function SectionTitle({ children, id, eyebrow, href, hrefLabel = "Xem tất cả", align = "left" }: { children: React.ReactNode; id?: string; eyebrow?: string; href?: string; hrefLabel?: string; align?: "left" | "center" }) {
  return (
    <div id={id} className={`container-site flex scroll-mt-20 items-end gap-4 ${align === "center" ? "flex-col items-center text-center" : "justify-between"}`}>
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="h-section">{children}</h2>
      </div>
      {href && (
        <Link href={href} className="shrink-0 whitespace-nowrap pb-1 text-sm font-semibold text-ink underline decoration-line decoration-2 underline-offset-[6px] transition hover:decoration-brand">
          {hrefLabel} →
        </Link>
      )}
    </div>
  );
}
