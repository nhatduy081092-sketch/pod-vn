"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { applyTemplate, removeVietnameseTones, TEXT_PRESETS, type DesignAssetView, type DesignLayer, type DesignTemplateData } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import { createCanvas, drawArea, measureText, type ImageCache } from "./render";
import { ensureFonts } from "./fonts";

type Tab = "templates" | "clipart";

let cache: { templates: DesignAssetView[]; clipart: DesignAssetView[] } | null = null;
async function loadAssets() {
  if (cache) return cache;
  const get = (kind: string) =>
    fetch(`/api/design-assets?kind=${kind}`)
      .then((r) => (r.ok ? (r.json() as Promise<DesignAssetView[]>) : []))
      .catch(() => [] as DesignAssetView[]);
  const [templates, clipart] = await Promise.all([get("TEMPLATE"), get("CLIPART")]);
  cache = { templates, clipart };
  return cache;
}

/** Lớp của mẫu đã đo lại khung chữ theo font thật */
export function templateLayers(t: DesignTemplateData, area: { widthMm: number; heightMm: number }, newId: () => string): DesignLayer[] {
  return applyTemplate(t, area, newId).map((l) => (l.type === "text" ? { ...l, ...measureText(l) } : l));
}

/** Ảnh thu nhỏ của mẫu chữ (vẽ bằng chính bộ vẽ của editor) */
function PresetThumb({ data }: { data: DesignTemplateData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    const layers = templateLayers(data, { widthMm: data.srcW, heightMm: data.srcH }, () => "t");
    ensureFonts(layers).then(() => {
      if (!alive || !ref.current) return;
      const c = ref.current;
      const px = 160;
      c.width = px;
      c.height = px;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, px, px);
      // đo lại sau khi font tải xong
      const fixed = templateLayers(data, { widthMm: data.srcW, heightMm: data.srcH }, () => "t");
      drawArea(ctx, { bg: data.bg ?? null, layers: fixed }, data.srcW, data.srcH, px / data.srcW, new Map() as ImageCache);
    });
    return () => {
      alive = false;
    };
  }, [data]);
  return <canvas ref={ref} className="aspect-square w-full" aria-hidden />;
}

type Props = {
  onTemplate: (data: DesignTemplateData, name: string) => void;
  onClipart: (a: DesignAssetView) => void;
};

/** Thư viện: mẫu chữ dựng sẵn + mẫu thiết kế + hình minh hoạ (quản lý trong CMS) */
export function LibraryPanel({ onTemplate, onClipart }: Props) {
  const [tab, setTab] = useState<Tab>("templates");
  const [data, setData] = useState<{ templates: DesignAssetView[]; clipart: DesignAssetView[] } | null>(cache);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  useEffect(() => {
    if (!data) void loadAssets().then(setData);
  }, [data]);

  const norm = (s: string) => removeVietnameseTones(s).toLowerCase();
  const templates = useMemo(() => {
    const builtIn = TEXT_PRESETS.map((p) => ({ id: p.id, name: p.name, category: p.category, data: p.data, image: "" }));
    const cms = (data?.templates ?? []).filter((t) => t.data).map((t) => ({ id: t.id, name: t.name, category: t.category || "Mẫu thiết kế", data: t.data!, image: t.imageUrl }));
    return [...cms, ...builtIn];
  }, [data]);
  const list = tab === "templates" ? templates : (data?.clipart ?? []).map((c) => ({ ...c, image: c.imageUrl }));
  const cats = [...new Set(list.map((x) => x.category).filter(Boolean))];
  const k = norm(q.trim());
  const shown = list.filter((x) => (!cat || x.category === cat) && (!k || norm(`${x.name} ${x.category} ${"tags" in x ? (x.tags ?? "") : ""}`).includes(k)));

  return (
    <section className="space-y-2.5">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-cream p-1 text-xs font-bold" role="tablist">
        {(
          [
            ["templates", "Mẫu chữ & thiết kế"],
            ["clipart", "Hình minh hoạ"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t);
              setCat("");
            }}
            className={`rounded-md px-2 py-1.5 ${tab === t ? "bg-white shadow-sm" : "text-ink/60"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm: sinh nhật, đội bóng, hoa…" className="w-full rounded-md border-2 border-ink/15 px-3 py-1.5 text-sm focus:border-ink focus:outline-none" aria-label="Tìm trong thư viện" />
      {cats.length > 1 && (
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          {["", ...cats].map((c) => (
            <button key={c || "all"} type="button" onClick={() => setCat(c)} className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cat === c ? "border-ink bg-ink text-white" : "border-ink/20"}`}>
              {c || "Tất cả"}
            </button>
          ))}
        </div>
      )}
      {!data && tab === "clipart" ? (
        <p className="text-xs text-ink/60">Đang tải…</p>
      ) : !shown.length ? (
        <p className="text-xs text-ink/60">{tab === "clipart" && !list.length ? "Thư viện hình đang được cập nhật. Bạn có thể tải ảnh của mình ở mục Tải ảnh." : "Không có kết quả phù hợp."}</p>
      ) : (
        <ul className="grid max-h-[46vh] grid-cols-3 gap-1.5 overflow-y-auto pr-0.5 lg:max-h-[52vh]">
          {shown.map((x) => (
            <li key={x.id}>
              <button
                type="button"
                title={x.name}
                onClick={() => (tab === "templates" ? onTemplate((x as (typeof templates)[number]).data, x.name) : onClipart(x as DesignAssetView))}
                className="block w-full overflow-hidden rounded-md border border-ink/15 bg-[#f4f4f5] text-left hover:border-ink"
              >
                {x.image ? <img src={assetUrl(x.image)} alt="" loading="lazy" className="aspect-square w-full object-contain" /> : <PresetThumb data={(x as (typeof templates)[number]).data} />}
                <span className="block truncate bg-white px-1 py-0.5 text-[10px] font-semibold">{x.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-ink/55">Bấm để thêm vào mặt đang chọn, sau đó sửa chữ, màu, vị trí tuỳ ý.</p>
    </section>
  );
}
