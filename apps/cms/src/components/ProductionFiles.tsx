"use client";
import { useMemo, useState } from "react";
import { areaForSize, DESIGN_LIMITS, designFields, designReport, orderDesignSchema, personalizeArea, printPixelSize, removeVietnameseTones, scaleAreaDesign, type DesignFile, type OrderDesign, type RosterRow } from "@pod/shared";
import { DESIGN_FONTS_HREF, ensureDesignFonts, layerImageSrcs, loadImage, renderAreaPng, type ImageCache } from "@pod/shared/render";
import { ZipWriter } from "@/lib/zip";

export type ProductionItem = { id: string; productName: string; color: string; size: string; quantity: number; sku: string | null; design: unknown; roster: RosterRow[] | null };

type Job = { file: string; item: ProductionItem; idx: number; f: DesignFile; person: RosterRow | null; copies: number; px: { w: number; h: number; dpi: number }; mm: { w: number; h: number } };

type DirHandle = { getFileHandle(name: string, o: { create: boolean }): Promise<{ createWritable(): Promise<{ write(d: Blob | string): Promise<void>; close(): Promise<void> }> }> };

const slug = (s: string) =>
  removeVietnameseTones(s)
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30) || "x";

/** Thông số vùng in lấy từ file khách đã xuất lúc đặt -> đúng với lúc khách thiết kế kể cả khi sản phẩm đổi sau này */
const areaOf = (f: DesignFile) => ({
  key: f.area,
  name: f.name,
  widthMm: f.widthMm ?? (f.widthPx / f.dpi) * 25.4,
  heightMm: f.heightMm ?? (f.heightPx / f.dpi) * 25.4,
  dpi: f.targetDpi ?? f.dpi,
  bleedMm: f.bleedMm ?? 0,
  safeMm: f.safeMm ?? 0,
  sizeSpecs: f.sizeSpecs ?? null,
});

/** Kích thước file in cho xưởng theo size: đủ DPI (máy tính), vùng in riêng theo size nếu có */
function productionSpec(f: DesignFile, size: string) {
  const base = areaOf(f);
  const target = areaForSize(base, size);
  const px = f.widthMm ? printPixelSize(target, DESIGN_LIMITS.maxProductionPixels) : { w: f.widthPx, h: f.heightPx, dpi: f.dpi };
  return { base, target, px };
}

/**
 * File in cho xưởng: dựng lại từ DỮ LIỆU THIẾT KẾ (không dùng file PNG khách gửi lên),
 * cùng bộ vẽ với công cụ thiết kế; đồng phục in tên/số -> mỗi người 1 file.
 */
export function ProductionFiles({ orderCode, items }: { orderCode: string; items: ProductionItem[] }) {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const parsed = useMemo(
    () =>
      items
        .map((it, i) => ({ it, idx: i + 1, d: orderDesignSchema.safeParse(it.design) }))
        .filter((x): x is { it: ProductionItem; idx: number; d: { success: true; data: OrderDesign } } => x.d.success),
    [items],
  );

  const jobs = useMemo(() => {
    const out: Job[] = [];
    for (const { it, idx, d } of parsed) {
      for (const f of d.data.files) {
        const personal = designFields(d.data.json, f.area).length > 0 && !!it.roster?.length;
        const base = `${orderCode}_${String(idx).padStart(2, "0")}_${slug(it.productName)}_${f.area}`;
        const spec = (size: string) => {
          const p = productionSpec(f, size);
          return { px: p.px, mm: { w: p.target.widthMm, h: p.target.heightMm } };
        };
        const sized = !!f.sizeSpecs && Object.keys(f.sizeSpecs).length > 0;
        if (personal)
          it.roster!.forEach((r, i) =>
            out.push({ file: `${base}_${String(i + 1).padStart(3, "0")}_${slug(r.name || "khong-ten")}_${r.number || "-"}_${slug(r.size)}.png`, item: it, idx, f, person: r, copies: 1, ...spec(r.size || it.size) }),
          );
        else out.push({ file: `${base}${sized ? `_${slug(it.size)}` : ""}_x${it.quantity}.png`, item: it, idx, f, person: null, copies: it.quantity, ...spec(it.size) });
      }
    }
    return out;
  }, [parsed, orderCode]);

  if (!parsed.length) return null;

  const reports = parsed.map(({ it, idx, d }) => ({ it, idx, issues: designReport(d.data.json, d.data.files.map(areaOf)) }));

  function manifest(): string {
    const head = ["file", "san_pham", "mat_in", "mau", "size", "ten", "so", "so_luong", "kich_thuoc_mm", "kich_thuoc_px", "dpi", "vien_tran_mm"];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = jobs.map((j) => [j.file, j.item.productName, j.f.name, j.item.color, j.person?.size ?? j.item.size, j.person?.name ?? "", j.person?.number ?? "", j.copies, `${Math.round(j.mm.w)}x${Math.round(j.mm.h)}`, `${j.px.w}x${j.px.h}`, j.px.dpi, j.f.bleedMm ?? 0].map(esc).join(","));
    return "﻿" + [head.join(","), ...rows].join("\n");
  }

  async function run(target: "folder" | "zip") {
    setMsg("");
    let dir: DirHandle | null = null;
    if (target === "folder") {
      try {
        dir = await (window as unknown as { showDirectoryPicker(o?: { mode: string }): Promise<DirHandle> }).showDirectoryPicker({ mode: "readwrite" });
      } catch {
        return; // huỷ chọn thư mục
      }
    }
    const zip = target === "zip" ? new ZipWriter() : null;
    const images: ImageCache = new Map();
    try {
      for (const [i, j] of jobs.entries()) {
        setBusy(`Đang dựng ${i + 1}/${jobs.length}: ${j.file}`);
        const d = parsed.find((x) => x.it.id === j.item.id)!.d.data;
        const spec = productionSpec(j.f, j.person?.size || j.item.size);
        const ad = scaleAreaDesign(personalizeArea(d.json.areas[j.f.area] ?? { bg: null, layers: [] }, j.person), spec.base, spec.target);
        await ensureDesignFonts(ad.layers);
        for (const src of layerImageSrcs(ad)) if (!images.has(src)) images.set(src, await loadImage(src));
        const blob = await renderAreaPng(ad, spec.target, { w: j.px.w, h: j.px.h }, images);
        if (dir) {
          const w = await (await dir.getFileHandle(j.file, { create: true })).createWritable();
          await w.write(blob);
          await w.close();
        } else await zip!.add(j.file, blob);
      }
      const csv = manifest();
      if (dir) {
        const w = await (await dir.getFileHandle(`${orderCode}_danh-sach-file.csv`, { create: true })).createWritable();
        await w.write(csv);
        await w.close();
        setMsg(`✓ Đã lưu ${jobs.length} file in + danh sách CSV vào thư mục đã chọn.`);
      } else {
        await zip!.add(`${orderCode}_danh-sach-file.csv`, new TextEncoder().encode(csv));
        const a = document.createElement("a");
        a.href = URL.createObjectURL(zip!.finish());
        a.download = `${orderCode}_file-in.zip`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
        setMsg(`✓ Đã tạo ZIP ${jobs.length} file in + danh sách CSV.`);
      }
    } catch (e) {
      setMsg(`Lỗi: ${(e as Error).message}`);
    } finally {
      setBusy("");
    }
  }

  const canFolder = typeof window !== "undefined" && "showDirectoryPicker" in window;
  const personal = jobs.filter((j) => j.person).length;

  return (
    <section className="card space-y-3">
      <link rel="stylesheet" href={DESIGN_FONTS_HREF} />
      <div>
        <h2 className="font-bold">File in cho xưởng</h2>
        <p className="text-sm text-neutral-600">
          Dựng lại từ dữ liệu thiết kế (không dùng file PNG khách gửi) · {jobs.length} file
          {personal > 0 && ` · ${personal} file in tên/số riêng từng người`}. Tên file có mã đơn, sản phẩm, mặt in, tên/số, size; kèm CSV đối chiếu.
        </p>
      </div>
      {reports.some((r) => r.issues.length) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-bold text-amber-900">Kiểm tra trước khi in</p>
          <ul className="mt-1 space-y-0.5 text-amber-900">
            {reports.flatMap((r) =>
              r.issues.map((x, k) => (
                <li key={`${r.idx}-${k}`}>
                  <span className={x.level === "error" ? "font-bold text-red-700" : ""}>{x.level === "error" ? "✗" : "!"}</span> SP {r.idx} · {x.areaName}: {x.message}
                </li>
              )),
            )}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {canFolder && (
          <button type="button" className="btn-primary" disabled={!!busy} onClick={() => void run("folder")}>
            Lưu vào thư mục (khuyên dùng)
          </button>
        )}
        <button type="button" className={canFolder ? "btn-ghost" : "btn-primary"} disabled={!!busy} onClick={() => void run("zip")}>
          Tải ZIP
        </button>
      </div>
      {busy && (
        <p className="flex items-center gap-2 text-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-800 border-t-transparent" /> {busy}
        </p>
      )}
      {msg && <p className="text-sm">{msg}</p>}
      <p className="text-xs text-neutral-500">Máy xưởng nên dùng Chrome/Edge trên máy tính. Đơn đông người (50+ áo) nên chọn &quot;Lưu vào thư mục&quot; để không tốn bộ nhớ.</p>
    </section>
  );
}
