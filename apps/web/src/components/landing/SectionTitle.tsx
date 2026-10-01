import Link from "next/link";

/** Tiêu đề section: chữ display lớn, căn trái; tuỳ chọn mô tả ngắn + nút "Xem tất cả" kiểu sticker */
export function SectionTitle({
  children,
  id,
  eyebrow,
  sub,
  href,
  hrefLabel = "Xem tất cả",
  align = "left",
}: {
  children: React.ReactNode;
  id?: string;
  /** giữ cho tương thích – không còn hiển thị nhãn nhỏ phía trên */
  eyebrow?: string;
  sub?: string;
  href?: string;
  hrefLabel?: string;
  align?: "left" | "center";
}) {
  void eyebrow;
  return (
    <div id={id} className={`container-site flex scroll-mt-20 flex-wrap items-end gap-x-6 gap-y-3 ${align === "center" ? "flex-col items-center text-center" : "justify-between"}`}>
      <div className="max-w-3xl">
        <h2 className="h-section">{children}</h2>
        {sub && <p className="mt-2 text-[15px] text-ink/70 md:text-base">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="btn-outline shrink-0 px-4 py-2">
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}
