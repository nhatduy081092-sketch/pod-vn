"use client";
import { useEffect, useRef, useState } from "react";
import { designFields, personalizeArea, type DesignField, type RosterRow } from "@pod/shared";
import type { AttachedDesign, PrintArea } from "@/lib/types";
import { drawMockup, type ImageCache, type MockupAssets } from "../editor/render";
import { loadAreaAssets, loadLayerImages } from "../editor/export";
import { ensureFonts, GOOGLE_FONTS_HREF } from "../editor/fonts";

const PAGE = 12;

/**
 * Đồng phục in tên/số: xem trước từng áo theo danh sách (dùng đúng bộ vẽ của công cụ thiết kế).
 * Chỉ vẽ mặt có ô tên/số.
 */
export function TeamPreview({ areas, design, rows, garmentColor }: { areas: PrintArea[]; design: AttachedDesign; rows: RosterRow[]; garmentColor?: string | null }) {
  const fieldAreas = areas.filter((a) => designFields(design.json, a.key).length > 0);
  const [ready, setReady] = useState<{ images: ImageCache; assets: Record<string, MockupAssets> } | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [css, setCss] = useState(false);
  const refs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const fields = designFields(design.json);

  useEffect(() => {
    if (!css) return;
    let alive = true;
    (async () => {
      const images: ImageCache = new Map();
      const assets: Record<string, MockupAssets> = {};
      for (const a of fieldAreas) {
        const ad = design.json.areas[a.key]!;
        await ensureFonts(ad.layers.map((l) => (l.type === "text" && l.field ? { ...l, text: "ÂÊÔƠƯĐ 0123456789" } : l)));
        await loadLayerImages(ad, images).catch(() => undefined);
        assets[a.key] = await loadAreaAssets(a);
      }
      if (alive) setReady({ images, assets });
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design.updatedAt, css]);

  const shown = rows.slice(0, limit);

  useEffect(() => {
    if (!ready) return;
    const px = 240;
    shown.forEach((r, i) => {
      for (const a of fieldAreas) {
        const c = refs.current[`${i}-${a.key}`];
        if (!c) continue;
        c.width = px;
        c.height = px;
        const ad = personalizeArea(design.json.areas[a.key]!, r);
        drawMockup(c.getContext("2d")!, px, px, a, ad, ready.assets[a.key]!, ready.images, { background: "#ffffff", padding: 6, garmentColor, shading: 0.45 });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, rows, limit, garmentColor]);

  if (!fieldAreas.length || !rows.length) return null;
  const missing = (f: DesignField) => rows.filter((r) => !r[f]).length;
  const warns = fields.map((f) => [f, missing(f)] as const).filter(([, n]) => n > 0);

  return (
    <section className="mt-4 rounded-lg border-2 border-ink/10 p-3">
      <link rel="stylesheet" href={GOOGLE_FONTS_HREF} onLoad={() => setCss(true)} onError={() => setCss(true)} />
      <h3 className="text-sm font-extrabold">Xem trước từng áo ({rows.length})</h3>
      {warns.map(([f, n]) => (
        <p key={f} className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">
          {n} người chưa có {f === "name" ? "tên in" : "số áo"} – áo đó sẽ để trống ô {f === "name" ? "tên" : "số"}.
        </p>
      ))}
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {shown.map((r, i) => (
          <li key={i} className="overflow-hidden rounded border border-ink/10 bg-white">
            <div className={`grid ${fieldAreas.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {fieldAreas.map((a) => (
                <canvas key={a.key} ref={(el) => void (refs.current[`${i}-${a.key}`] = el)} className="aspect-square w-full" aria-label={`${r.name || "—"} ${r.number} – ${a.name}`} />
              ))}
            </div>
            <p className="truncate border-t border-ink/10 px-1.5 py-1 text-[11px]">
              <b>{i + 1}.</b> {r.name || "—"} {r.number && `· ${r.number}`} · {r.size}
            </p>
          </li>
        ))}
      </ul>
      {!ready && <p className="mt-2 text-xs text-ink/60">Đang dựng ảnh…</p>}
      {rows.length > limit && (
        <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="btn-outline mt-2 w-full py-1.5 text-sm">
          Xem thêm {Math.min(PAGE, rows.length - limit)} áo
        </button>
      )}
    </section>
  );
}
