"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatVND } from "@pod/shared";
import { assetUrl, shortPriceLabel } from "@/lib/config";
import type { ProductCardData } from "@/lib/types";
import { IconSearch } from "../ui/icons";

type Suggest = { total: number; products: ProductCardData[]; categories: { slug: string; name: string; count: number }[] };

/** Ô tìm kiếm có gợi ý tức thì – gõ không dấu vẫn ra ("binh giu nhiet") */
export function SearchBox({ autoFocus = false, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [data, setData] = useState<Suggest | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setData(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: Suggest | null) => {
          setData(d);
          setActive(-1);
        })
        .catch(() => {});
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    onDone?.();
    router.push(href);
  };
  const submit = () => {
    const term = q.trim();
    if (!term) return;
    if (active >= 0 && data?.products[active]) return go(`/san-pham/${data.products[active].slug}`);
    go(`/san-pham?q=${encodeURIComponent(term)}`);
  };

  const showPanel = open && q.trim().length >= 2 && data;

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex h-10 items-center rounded-full border-2 border-navy/20 bg-white pl-3 focus-within:border-navy"
      >
        <IconSearch className="h-5 w-5 shrink-0 text-navy/60" />
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            const n = data?.products.length ?? 0;
            if (e.key === "ArrowDown" && n) {
              e.preventDefault();
              setActive((a) => (a + 1) % n);
            } else if (e.key === "ArrowUp" && n) {
              e.preventDefault();
              setActive((a) => (a <= 0 ? n - 1 : a - 1));
            } else if (e.key === "Escape") setOpen(false);
          }}
          type="search"
          enterKeyHint="search"
          placeholder="Tìm áo polo, bình giữ nhiệt, balo..."
          aria-label="Tìm sản phẩm"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={!!showPanel}
          role="combobox"
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-[15px] outline-none placeholder:text-ink/40"
        />
        <button type="submit" className="mr-1 h-8 shrink-0 rounded-full bg-navy px-3 text-sm font-bold text-white">
          Tìm
        </button>
      </form>

      {showPanel && (
        <div
          id={listId}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-ink/10 bg-white p-2 shadow-2xl"
        >
          {data.total === 0 ? (
            <p className="px-3 py-4 text-sm text-ink/60">
              Không tìm thấy “{q}”. Thử từ khoá khác hoặc{" "}
              <Link href="/#danh-muc" onClick={() => setOpen(false)} className="font-bold text-navy underline">
                xem danh mục
              </Link>
              .
            </p>
          ) : (
            <>
              {data.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-2 pb-2 pt-1">
                  {data.categories.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => go(`/danh-muc/${c.slug}?q=${encodeURIComponent(q.trim())}`)}
                      className="rounded-full bg-navy-light px-3 py-1 text-xs font-semibold text-navy hover:bg-navy hover:text-white"
                    >
                      {c.name} · {c.count}
                    </button>
                  ))}
                </div>
              )}
              <ul>
                {data.products.map((p, i) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(`/san-pham/${p.slug}`)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left ${active === i ? "bg-cream" : ""}`}
                    >
                      <img src={assetUrl(p.images[0])} alt="" className="h-11 w-11 shrink-0 rounded-md border border-ink/10 bg-white object-contain" />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-sm font-semibold">{p.name}</span>
                        <span className="text-xs text-ink/60">{p.category.name}</span>
                      </span>
                      <span className="shrink-0 text-xs font-bold text-accent">{shortPriceLabel(p, formatVND)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => go(`/san-pham?q=${encodeURIComponent(q.trim())}`)}
                className="mt-1 w-full rounded-lg bg-navy py-2 text-sm font-bold text-white"
              >
                Xem tất cả {data.total} kết quả
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
