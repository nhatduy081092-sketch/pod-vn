"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyTemplate,
  ASSET_SHAPE_LABEL,
  ASSET_SHAPES,
  assetShape,
  BASIC_COLORS,
  DESIGN_COLLECTIONS,
  DESIGN_GROUPS,
  readyDesignInColor,
  removeVietnameseTones,
  seasonalCollectionOrder,
  TEXT_PRESETS,
  type AssetShape,
  type DesignAssetView,
  type DesignLayer,
  type DesignTemplateData,
} from "@pod/shared";
import { assetUrl } from "@/lib/config";
import { createCanvas, drawArea, measureText, type ImageCache } from "./render";
import { ensureFonts } from "./fonts";

type Tab = "templates" | "clipart";

/* ---------- Bộ hình dựng sẵn (giấy phép MIT) – tải từ CDN, không cần nhập vào CMS ---------- */
type Pack = { id: string; title: string; repo: string; commit: string; items: [string, string, string, string][] };
const PACKS = [
  { id: "fluent-emoji", label: "Emoji màu" },
  { id: "tabler-icons", label: "Biểu tượng nét" },
] as const;
type PackId = (typeof PACKS)[number]["id"];
const packCache = new Map<string, Promise<DesignAssetView[]>>();
const encPath = (p: string) => p.split("/").map(encodeURIComponent).join("/");
function loadPack(id: PackId): Promise<DesignAssetView[]> {
  let p = packCache.get(id);
  if (!p) {
    p = fetch(`/packs/${id}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Pack>) : null))
      .then((pk) =>
        (pk?.items ?? []).map(([path, name, category, tags], i) => ({
          id: `${id}:${i}`,
          kind: "CLIPART" as DesignAssetView["kind"],
          name,
          category,
          tags,
          imageUrl: `https://cdn.jsdelivr.net/gh/${pk!.repo}@${pk!.commit}/${encPath(path)}`,
          natW: 512,
          natH: 512,
          data: null,
        })),
      )
      .catch(() => []);
    packCache.set(id, p);
  }
  return p;
}

/** Mẫu chữ có sẵn (trang Mẫu có sẵn) dùng ngay trong Studio – dịp đang tới lên đầu, tự đổi màu chữ theo màu áo */
function readyTemplates(garmentDark: boolean) {
  const order = seasonalCollectionOrder([...DESIGN_GROUPS.flatMap((g) => g.slugs), ...DESIGN_COLLECTIONS.map((c) => c.slug)]);
  const cols = [...DESIGN_COLLECTIONS].sort((a, b) => (order.indexOf(a.slug) + 1 || 99) - (order.indexOf(b.slug) + 1 || 99));
  return cols.flatMap((c) =>
    c.designs.map((d) => {
      const fit = BASIC_COLORS[d.color].dark === garmentDark ? d : readyDesignInColor(d, garmentDark ? "den" : "trang");
      return { id: `rd:${d.slug}`, name: d.title, category: c.name, data: fit.template, image: "" };
    }),
  );
}

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

/**
 * Điểm khớp tìm kiếm theo TỪ (không theo chuỗi con): "hoa" khớp "hoa sữa" chứ không khớp "hoạt động".
 * Trùng cả dấu > trùng không dấu > đầu từ (từ khoá ≥4 ký tự). Khớp ở tên nặng gấp đôi khớp ở chủ đề/thẻ.
 * Mọi từ khoá phải khớp ở đâu đó.
 */
function matchScore(fields: [string, number][], toks: string[]): number {
  const prepared = fields.map(([text, weight]) => {
    const words = text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    return { weight, words, plain: words.map((w) => removeVietnameseTones(w)) };
  });
  let score = 0;
  for (const t of toks) {
    const tp = removeVietnameseTones(t);
    let best = 0;
    for (const f of prepared) {
      const s = f.words.includes(t) ? 5 : f.plain.includes(tp) ? 3 : tp.length >= 4 && f.plain.some((w) => w.startsWith(tp)) ? 1 : 0;
      best = Math.max(best, s * f.weight);
    }
    if (!best) return 0;
    score += best;
  }
  return score;
}

type Props = {
  onTemplate: (data: DesignTemplateData, name: string) => void;
  onClipart: (a: DesignAssetView) => void;
  /** áo màu tối -> mẫu chữ đổi sang chữ sáng */
  garmentDark?: boolean;
};

/** Thư viện: mẫu chữ dựng sẵn + mẫu thiết kế + hình minh hoạ (quản lý trong CMS) */
export function LibraryPanel({ onTemplate, onClipart, garmentDark = false }: Props) {
  const [tab, setTab] = useState<Tab>("templates");
  const [data, setData] = useState<{ templates: DesignAssetView[]; clipart: DesignAssetView[] } | null>(cache);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [shape, setShape] = useState<AssetShape | "">("");
  const [limit, setLimit] = useState(60);
  // nguồn hình minh hoạ: "" = thư viện YALA (CMS), hoặc 1 bộ dựng sẵn
  const [src, setSrc] = useState<"" | PackId>("");
  const [pack, setPack] = useState<DesignAssetView[] | null>(null);
  useEffect(() => setLimit(60), [tab, cat, shape, q, src]);
  useEffect(() => {
    if (!data) void loadAssets().then(setData);
  }, [data]);

  const templates = useMemo(() => {
    const builtIn = TEXT_PRESETS.map((p) => ({ id: p.id, name: p.name, category: p.category, data: p.data, image: "" }));
    const cms = (data?.templates ?? []).filter((t) => t.data).map((t) => ({ id: t.id, name: t.name, category: t.category || "Mẫu thiết kế", data: t.data!, image: t.imageUrl }));
    return [...cms, ...readyTemplates(garmentDark), ...builtIn];
  }, [data, garmentDark]);
  // thư viện YALA trống -> mở sẵn bộ Emoji màu
  const cmsClipart = data?.clipart ?? [];
  const activeSrc: "" | PackId = src || (data && !cmsClipart.length ? "fluent-emoji" : "");
  useEffect(() => {
    if (tab !== "clipart" || !activeSrc) return;
    setPack(null);
    let alive = true;
    void loadPack(activeSrc).then((l) => alive && setPack(l));
    return () => {
      alive = false;
    };
  }, [tab, activeSrc]);
  const clipart = activeSrc ? (pack ?? []) : cmsClipart;
  const list = tab === "templates" ? templates : clipart.map((c) => ({ ...c, image: c.imageUrl }));
  const cats = [...new Set(list.map((x) => x.category).filter(Boolean))];
  const shown = useMemo(() => {
    const base = list.filter((x) => (!cat || x.category === cat) && (!shape || ("natW" in x && x.natW > 0 && assetShape(x.natW, x.natH) === shape)));
    const toks = q.trim().toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    if (!toks.length) return base;
    return base
      .map((x, i) => ({ x, i, s: matchScore([[x.name, 2], [`${x.category} ${"tags" in x ? (x.tags ?? "") : ""}`, 1]], toks) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map((r) => r.x);
  }, [list, cat, shape, q]);

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
      {tab === "clipart" && (
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Nguồn hình">
          {[...(cmsClipart.length ? [{ id: "" as const, label: `Thư viện YALA (${cmsClipart.length})` }] : []), ...PACKS].map((p) => (
            <button
              key={p.id || "cms"}
              type="button"
              role="radio"
              aria-checked={activeSrc === p.id}
              onClick={() => {
                setSrc(p.id);
                setCat("");
              }}
              className={`rounded-full border-2 px-2.5 py-0.5 text-[11px] font-bold ${activeSrc === p.id ? "border-ink bg-sun" : "border-ink/15"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "clipart" ? "Tìm: tim, hoa, bánh, mèo, ngôi sao…" : "Tìm: 20/10, cặp đôi, sinh nhật, gym…"} className="w-full rounded-md border-2 border-ink/15 px-3 py-1.5 text-sm focus:border-ink focus:outline-none" aria-label="Tìm trong thư viện" />
      {cats.length > 10 ? (
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full rounded-md border-2 border-ink/15 bg-white px-2 py-1.5 text-sm font-semibold focus:border-ink focus:outline-none" aria-label="Chủ đề">
          <option value="">Tất cả chủ đề ({list.length})</option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      ) : cats.length > 1 && (
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          {["", ...cats].map((c) => (
            <button key={c || "all"} type="button" onClick={() => setCat(c)} className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cat === c ? "border-ink bg-ink text-white" : "border-ink/20"}`}>
              {c || "Tất cả"}
            </button>
          ))}
        </div>
      )}
      {tab === "clipart" && list.length > 12 && (
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Dáng ảnh">
          {(["", ...ASSET_SHAPES] as const).map((s) => (
            <button
              key={s || "all"}
              type="button"
              role="radio"
              aria-checked={shape === s}
              onClick={() => setShape(s)}
              className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold ${shape === s ? "border-ink bg-brand" : "border-ink/15"}`}
            >
              {s && <ShapeIcon s={s} />}
              {s ? ASSET_SHAPE_LABEL[s] : "Mọi dáng"}
            </button>
          ))}
        </div>
      )}
      {(!data && tab === "clipart") || (tab === "clipart" && activeSrc && !pack) ? (
        <p className="text-xs text-ink/60">Đang tải…</p>
      ) : !shown.length ? (
        <p className="text-xs text-ink/60">{tab === "clipart" && !list.length ? "Thư viện hình đang được cập nhật. Bạn có thể tải ảnh của mình ở mục Tải ảnh." : "Không có kết quả phù hợp."}</p>
      ) : (
        <ul className="grid max-h-[46vh] grid-cols-3 gap-1.5 overflow-y-auto pr-0.5 lg:max-h-[52vh]">
          {shown.slice(0, limit).map((x) => (
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
      {shown.length > limit && (
        <button type="button" onClick={() => setLimit((l) => l + 60)} className="btn-sm w-full text-xs font-bold">
          Xem thêm ({shown.length - limit})
        </button>
      )}
      <p className="text-[11px] text-ink/55">
        Bấm để thêm vào mặt đang chọn, sau đó sửa chữ, màu, vị trí tuỳ ý.
        {tab === "clipart" && activeSrc && " Bộ hình mã nguồn mở (MIT) – dùng in thương mại được."}
      </p>
    </section>
  );
}

/** Biểu tượng dáng ảnh */
function ShapeIcon({ s }: { s: AssetShape }) {
  const [w, h] = { square: [10, 10], landscape: [13, 9], portrait: [9, 13], wide: [15, 6], tall: [6, 15] }[s];
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
      <rect x={(16 - w) / 2} y={(16 - h) / 2} width={w} height={h} rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
