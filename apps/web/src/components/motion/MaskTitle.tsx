import type { ReactNode } from "react";

/** Tiêu đề trồi lên qua khe che khi cuộn tới (data-reveal="mask", CSS trong globals.css). Không JS vẫn hiện bình thường. */
export function MaskTitle({ as: Tag = "h2", className = "", delay = 0, id, children }: { as?: "h1" | "h2" | "h3"; className?: string; delay?: number; id?: string; children: ReactNode }) {
  return (
    <Tag id={id} data-reveal="mask" className={`mask-reveal ${className}`} style={delay ? { ["--d" as string]: `${delay}ms` } : undefined}>
      <span className="mask-line">{children}</span>
    </Tag>
  );
}
