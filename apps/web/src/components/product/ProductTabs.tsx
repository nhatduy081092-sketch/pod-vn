"use client";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type ProductTab = { id: string; label: string; content: ReactNode };

/**
 * Tab thông tin sản phẩm (Mô tả / Bảng size / Vận chuyển / Hướng dẫn in).
 * - Mọi panel đều render sẵn trong HTML (panel ẩn dùng `hidden`) → Google vẫn đọc được nội dung.
 * - Link "#bang-size" ở bất kỳ đâu trên trang sẽ mở đúng tab và cuộn tới.
 */
export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const rootRef = useRef<HTMLElement>(null);
  const uid = useId();

  const open = useCallback(
    (id: string) => {
      if (!tabs.some((t) => t.id === id)) return false;
      setActive(id);
      requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return true;
    },
    [tabs],
  );

  useEffect(() => {
    const fromHash = () => open(decodeURIComponent(window.location.hash.slice(1)));
    // Bắt cả click lặp lại cùng 1 hash (không phát sinh hashchange)
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const id = a?.getAttribute("href")?.slice(1) ?? "";
      if (id && open(id)) {
        e.preventDefault();
        history.replaceState(null, "", `#${id}`);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", fromHash);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = tabs[(i + d + tabs.length) % tabs.length]!;
    setActive(next.id);
    document.getElementById(`${uid}-tab-${next.id}`)?.focus();
  }

  if (!tabs.length) return null;
  return (
    <section ref={rootRef} className="mt-10 scroll-mt-28 md:mt-14" aria-label="Thông tin sản phẩm">
      <div className="no-scrollbar -mx-4 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0" role="tablist" aria-label="Thông tin sản phẩm">
        <div className="flex w-max gap-1 md:gap-2">
          {tabs.map((t, i) => {
            const on = t.id === active;
            return (
              <button
                key={t.id}
                id={`${uid}-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`${uid}-panel-${t.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(t.id)}
                onKeyDown={(e) => onKey(e, i)}
                className={`-mb-[2px] whitespace-nowrap rounded-t-md border-2 px-3.5 py-2 text-[13px] font-extrabold transition md:px-5 md:text-[15px] ${
                  on ? "border-ink border-b-white bg-white text-ink" : "border-transparent text-ink/60 hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`${uid}-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${t.id}`}
          hidden={t.id !== active}
          className="max-w-3xl pt-5"
        >
          {t.content}
        </div>
      ))}
    </section>
  );
}
