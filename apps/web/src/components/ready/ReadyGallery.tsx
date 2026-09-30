"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatVND, type DesignTemplateData } from "@pod/shared";
import type { ProductCardData } from "@/lib/types";
import { shortPriceLabel } from "@/lib/config";
import { Img } from "@/components/ui/Img";
import { IconArrow, IconClose, IconSparkle } from "@/components/ui/icons";
import { drawArea, type ImageCache } from "../editor/render";
import { ensureFonts, GOOGLE_FONTS_HREF } from "../editor/fonts";
import { templateLayers } from "../editor/LibraryPanel";

export type ReadyItem = { id: string; name: string; category: string; data: DesignTemplateData; image: string };

type Props = {
  items: ReadyItem[];
  products: ProductCardData[];
  /** Thứ tự tab chủ đề; chủ đề khác xếp sau */
  themes: readonly string[];
  initialTheme?: string;
  /** Trang chủ: giới hạn số mẫu, ẩn tab */
  limit?: number;
  compact?: boolean;
  /** Đường dẫn quay lại từ editor */
  back: string;
};

/** Thư viện mẫu in sẵn: chọn mẫu → chọn phôi → mở editor với mẫu gắn sẵn */
export function ReadyGallery({ items, products, themes, initialTheme, limit, compact, back }: Props) {
  const [fontsReady, setFontsReady] = useState(false);
  const cats = useMemo(() => {
    const present = new Set(items.map((i) => i.category));
    return [...themes.filter((t) => present.has(t)), ...[...present].filter((c) => !themes.includes(c))];
  }, [items, themes]);
  const [theme, setTheme] = useState(initialTheme && cats.includes(initialTheme) ? initialTheme : "");
  const [picked, setPicked] = useState<ReadyItem | null>(null);

  const shown = useMemo(() => {
    if (compact) {
      // trang chủ: xen kẽ chủ đề để thấy độ đa dạng
      const by = cats.map((c) => items.filter((i) => i.category === c));
      const out: ReadyItem[] = [];
      for (let r = 0; out.length < (limit ?? 8) && by.some((b) => b[r]); r++) for (const b of by) if (b[r] && out.length < (limit ?? 8)) out.push(b[r]!);
      return out;
    }
    const list = theme ? items.filter((i) => i.category === theme) : items;
    return limit ? list.slice(0, limit) : list;
  }, [items, cats, theme, limit, compact]);

  const selectTheme = (t: string) => {
    setTheme(t);
    try {
      const u = new URL(window.location.href);
      if (t) u.searchParams.set("chu-de", t);
      else u.searchParams.delete("chu-de");
      window.history.replaceState(null, "", u);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <link rel="stylesheet" href={GOOGLE_FONTS_HREF} onLoad={() => setFontsReady(true)} onError={() => setFontsReady(true)} />
      {!compact && cats.length > 1 && (
        <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Chủ đề">
          <ThemeChip active={!theme} onClick={() => selectTheme("")}>
            Tất cả <span className="text-ink/45">{items.length}</span>
          </ThemeChip>
          {cats.map((c) => (
            <ThemeChip key={c} active={theme === c} onClick={() => selectTheme(c)}>
              {c} <span className="text-ink/45">{items.filter((i) => i.category === c).length}</span>
            </ThemeChip>
          ))}
        </nav>
      )}

      <ul className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 ${compact ? "" : "mt-5"}`}>
        {shown.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => setPicked(it)}
              className="group flex h-full w-full flex-col overflow-hidden rounded-xl border-2 border-ink bg-white text-left transition hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label={`Chọn mẫu ${it.name}`}
            >
              <span className="relative block aspect-square bg-[#f6f6f7] p-3">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image} alt="" className="h-full w-full object-contain" loading="lazy" />
                ) : (
                  <PresetCanvas data={it.data} ready={fontsReady} />
                )}
                <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-extrabold text-brand-badge md:text-[11px]">{it.category}</span>
              </span>
              <span className="flex flex-1 flex-col p-2.5 md:p-3">
                <span className="line-clamp-1 text-[13px] font-bold md:text-sm">{it.name}</span>
                <span className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border-2 border-ink bg-brand-badge py-2 text-[13px] font-extrabold transition group-hover:bg-brand md:text-sm">
                  <IconSparkle className="h-3.5 w-3.5" aria-hidden /> Chọn áo để in
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {picked && <ProductSheet item={picked} products={products} back={back} fontsReady={fontsReady} onClose={() => setPicked(null)} />}
    </>
  );
}

function ThemeChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full border-2 px-3.5 py-1.5 text-[13px] font-bold transition ${active ? "border-ink bg-ink text-brand-badge" : "border-ink/15 bg-white hover:border-ink"}`}
    >
      {children}
    </button>
  );
}

/** Vẽ mẫu chữ bằng chính bộ vẽ của editor (đúng như khi in) */
function PresetCanvas({ data, ready }: { data: DesignTemplateData; ready: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const first = templateLayers(data, { widthMm: data.srcW, heightMm: data.srcH }, () => "t");
    void ensureFonts(first).then(() => {
      if (!alive || !ref.current) return;
      const c = ref.current;
      const px = 360;
      c.width = px;
      c.height = px;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, px, px);
      const fixed = templateLayers(data, { widthMm: data.srcW, heightMm: data.srcH }, () => "t");
      drawArea(ctx, { bg: data.bg ?? null, layers: fixed }, data.srcW, data.srcH, px / data.srcW, new Map() as ImageCache);
    });
    return () => {
      alive = false;
    };
  }, [data, ready]);
  return <canvas ref={ref} className="h-full w-full" aria-hidden />;
}

/** Bảng chọn phôi: 1 mẫu in được lên mọi sản phẩm tự thiết kế */
function ProductSheet({ item, products, back, fontsReady, onClose }: { item: ReadyItem; products: ProductCardData[]; back: string; fontsReady: boolean; onClose: () => void }) {
  const cats = useMemo(() => [...new Map(products.map((p) => [p.category.slug, p.category.name])).entries()], [products]);
  const [cat, setCat] = useState("");
  const list = cat ? products.filter((p) => p.category.slug === cat) : products;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const href = (slug: string) => `/thiet-ke/${slug}?mau-in=${encodeURIComponent(item.id)}&back=${encodeURIComponent(back)}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="ready-sheet-title">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-full flex-col rounded-t-2xl border-2 border-ink bg-white sm:max-w-[760px] sm:rounded-2xl">
        <div className="flex items-center gap-3 border-b-2 border-ink/10 p-3 md:p-4">
          <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 border-ink/15 bg-[#f6f6f7] p-1">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt="" className="h-full w-full object-contain" />
            ) : (
              <PresetCanvas data={item.data} ready={fontsReady} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p id="ready-sheet-title" className="truncate font-black">
              In mẫu “{item.name}” lên…
            </p>
            <p className="text-[13px] text-ink/65">Chọn sản phẩm – mở YALA Studio để đổi chữ, màu, vị trí hoặc đặt luôn.</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-cream" aria-label="Đóng">
            <IconClose className="h-6 w-6" />
          </button>
        </div>

        {cats.length > 1 && (
          <nav className="no-scrollbar flex gap-2 overflow-x-auto px-3 pt-3 md:px-4" aria-label="Loại sản phẩm">
            <ThemeChip active={!cat} onClick={() => setCat("")}>
              Tất cả
            </ThemeChip>
            {cats.map(([slug, name]) => (
              <ThemeChip key={slug} active={cat === slug} onClick={() => setCat(slug)}>
                {name}
              </ThemeChip>
            ))}
          </nav>
        )}

        <ul className="grid flex-1 grid-cols-2 gap-2.5 overflow-y-auto p-3 sm:grid-cols-3 md:gap-3 md:p-4">
          {list.map((p) => (
            <li key={p.id}>
              <Link href={href(p.slug)} className="group flex h-full flex-col overflow-hidden rounded-xl border-2 border-ink/15 bg-white transition hover:border-ink">
                <span className="relative block aspect-square bg-[#f6f6f7]">
                  <Img src={p.images[0]} alt={p.name} sizes="(min-width:640px) 220px, 45vw" className="object-contain p-2" />
                </span>
                <span className="flex flex-1 flex-col p-2">
                  <span className="line-clamp-2 text-[12.5px] font-bold leading-[1.3]">{p.name}</span>
                  <span className="mt-auto flex items-center justify-between pt-1">
                    <span className="text-[14px] font-black">{shortPriceLabel(p, formatVND)}</span>
                    <IconArrow className="h-4 w-4 text-accent transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {!list.length && <p className="p-6 text-center text-sm text-ink/60">Chưa có sản phẩm tự thiết kế được.</p>}
      </div>
    </div>
  );
}
