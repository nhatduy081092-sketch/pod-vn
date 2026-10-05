"use client";
import { useMemo, useState } from "react";
import { DESIGN_COLLECTIONS, DESIGN_GROUPS, seasonalCollectionOrder, type ReadyDesign } from "@pod/shared";

/** Dịp đang tới lên đầu (20/10 vào đầu tháng 10, Noel cuối tháng 11…) */
const ORDERED = (() => {
  const order = seasonalCollectionOrder([...DESIGN_GROUPS.flatMap((g) => g.slugs), ...DESIGN_COLLECTIONS.map((c) => c.slug)]);
  return [...DESIGN_COLLECTIONS].sort((a, b) => (order.indexOf(a.slug) + 1 || 99) - (order.indexOf(b.slug) + 1 || 99));
})();

/**
 * Gợi ý câu chữ tiếng Việt theo chủ đề (lấy từ bộ mẫu có sẵn của YALA).
 * Đang chọn 1 khối chữ -> thay nội dung; chưa chọn -> thêm nguyên mẫu chữ đã phối font/màu.
 */
export function PhraseIdeas({ hasTextSelected, onReplace, onAddDesign }: { hasTextSelected: boolean; onReplace: (text: string) => void; onAddDesign: (d: ReadyDesign) => void }) {
  const [col, setCol] = useState(ORDERED[0]?.slug ?? "");
  const current = useMemo(() => ORDERED.find((c) => c.slug === col), [col]);
  return (
    <div className="rounded-xl border-2 border-ink/10 p-3">
      <p className="text-xs font-bold">Gợi ý câu chữ</p>
      <p className="mt-0.5 text-[11px] text-ink/60">{hasTextSelected ? "Bấm câu để thay chữ đang chọn." : "Bấm câu để thêm mẫu chữ đã phối sẵn font & màu."}</p>
      <div className="no-scrollbar -mx-3 mt-2 flex gap-1.5 overflow-x-auto px-3 pb-1" role="tablist" aria-label="Chủ đề">
        {ORDERED.map((c) => (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={c.slug === col}
            onClick={() => setCol(c.slug)}
            className={`shrink-0 whitespace-nowrap rounded-full border-2 px-2.5 py-1 text-[11px] font-bold transition ${c.slug === col ? "border-ink bg-ink text-white" : "border-ink/15 bg-white hover:border-ink"}`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-1.5">
        {current?.designs.map((d) => {
          const text = d.template.layers.filter((l) => l.type === "text").map((l) => (l as { text: string }).text).join(" ") || d.title;
          return (
            <li key={d.slug}>
              <button
                type="button"
                onClick={() => (hasTextSelected ? onReplace(text.replace(/\s+/g, " ").trim()) : onAddDesign(d))}
                className="h-full w-full rounded-lg border-2 border-ink/10 bg-surface px-2 py-2 text-left text-[12px] font-semibold leading-snug transition hover:-translate-y-px hover:border-ink"
                title={text}
              >
                {d.title}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
