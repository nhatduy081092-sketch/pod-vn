"use client";
import { useState } from "react";
import { areaGuides, DESIGN_FONTS } from "@pod/shared";
import type { PrintArea } from "@/lib/types";
import { renderMonth, type CalendarStyle } from "./calendar";
import { SWATCHES } from "./ui";

type Box = { x: number; y: number; w: number; h: number };
type Props = {
  areas: PrintArea[];
  area: PrintArea;
  /** tải ảnh lịch lên + thêm lớp vào mặt in */
  onInsert: (areaKey: string, blob: Blob, box: Box, px: { w: number; h: number }) => Promise<void>;
  onBusy: (msg: string) => void;
  onError: (msg: string) => void;
};

/** Mặt in của lịch 12 tháng: mã m01…m12 (hoặc tên "Tháng 1"…) */
function monthAreas(areas: PrintArea[]): Map<number, PrintArea> {
  const m = new Map<number, PrintArea>();
  for (const a of areas) {
    const k = /^m(\d{1,2})$/.exec(a.key)?.[1] ?? /^tháng\s*(\d{1,2})$/i.exec(a.name.trim())?.[1];
    const n = k ? Number(k) : 0;
    if (n >= 1 && n <= 12) m.set(n, a);
  }
  return m;
}

/** Vùng đặt lịch trong mặt in (mm): nửa dưới hoặc cả mặt, trong vùng an toàn */
function regionOf(a: PrintArea, place: "bottom" | "full"): Box {
  const s = areaGuides(a).safe;
  const top = place === "bottom" ? Math.max(s.top, a.heightMm * 0.5) : s.top;
  return { x: (s.left + s.right) / 2, y: (top + s.bottom) / 2, w: s.right - s.left, h: s.bottom - top };
}

export function CalendarPanel({ areas, area, onInsert, onBusy, onError }: Props) {
  const now = new Date();
  const months = monthAreas(areas);
  const isCalendar = months.size >= 12;
  const [year, setYear] = useState(now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear());
  const [month, setMonth] = useState<number | "all">(isCalendar ? "all" : now.getMonth() + 1);
  const [place, setPlace] = useState<"bottom" | "full">(isCalendar ? "bottom" : "full");
  const [style, setStyle] = useState<Omit<CalendarStyle, "year" | "month">>({ font: "Be Vietnam Pro", color: "#1d1d1f", accent: "#e11d48", lunar: true, grid: true, paper: null });

  async function add() {
    onError("");
    const jobs: { a: PrintArea; m: number }[] = month === "all" ? [...months.entries()].sort((x, y) => x[0] - y[0]).map(([m, a]) => ({ a, m })) : [{ a: area, m: month }];
    try {
      for (const [i, j] of jobs.entries()) {
        onBusy(`Đang tạo lịch tháng ${j.m}/${year}${jobs.length > 1 ? ` (${i + 1}/${jobs.length})` : ""}…`);
        const box = regionOf(j.a, place);
        const dpi = Math.min(300, j.a.dpi);
        let w = (box.w / 25.4) * dpi;
        let h = (box.h / 25.4) * dpi;
        const f = Math.min(1, Math.sqrt(12_000_000 / (w * h)));
        w *= f;
        h *= f;
        const blob = await renderMonth({ ...style, year, month: j.m }, w, h);
        await onInsert(j.a.key, blob, box, { w: Math.round(w), h: Math.round(h) });
      }
    } catch (e) {
      onError((e as Error).message);
    } finally {
      onBusy("");
    }
  }

  return (
    <section className="space-y-3">
      <p className="text-xs text-ink/70">Lịch tháng tiếng Việt, tuần bắt đầu Thứ 2, kèm ngày âm lịch và ngày lễ. Tạo thành 1 lớp ảnh nét theo khổ in.</p>
      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
        <label>
          Năm
          <input type="number" min={2000} max={2100} value={year} onChange={(e) => setYear(Math.min(2100, Math.max(2000, Number(e.target.value) || year)))} className="mt-0.5 w-full rounded-md border-2 border-ink/15 px-2 py-1.5 text-sm" />
        </label>
        <label>
          Tháng
          <select value={month} onChange={(e) => setMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="mt-0.5 w-full rounded-md border-2 border-ink/15 px-2 py-1.5 text-sm">
            {isCalendar && <option value="all">Cả năm (12 mặt)</option>}
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Tháng {i + 1}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-1 text-[11px] font-bold" role="radiogroup" aria-label="Vị trí">
        {(
          [
            ["bottom", "Nửa dưới (ảnh ở trên)"],
            ["full", "Cả mặt"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={place === v} onClick={() => setPlace(v)} className={`rounded-full border-2 px-2.5 py-0.5 ${place === v ? "border-ink bg-brand" : "border-ink/15"}`}>
            {l}
          </button>
        ))}
      </div>
      <select value={style.font} onChange={(e) => setStyle({ ...style, font: e.target.value })} className="w-full rounded-md border-2 border-ink/15 px-2 py-1.5 text-sm" style={{ fontFamily: `"${style.font}"` }} aria-label="Font lịch">
        {DESIGN_FONTS.map((f) => (
          <option key={f.family} value={f.family} style={{ fontFamily: `"${f.family}"` }}>
            {f.label}
          </option>
        ))}
      </select>
      <div>
        <p className="text-[11px] font-semibold text-ink/60">Màu chữ</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {SWATCHES.slice(0, 8).map((c) => (
            <button key={c} type="button" onClick={() => setStyle({ ...style, color: c })} className={`h-6 w-6 rounded-full border-2 ${style.color === c ? "border-ink ring-2 ring-brand" : "border-ink/20"}`} style={{ background: c }} aria-label={`Màu ${c}`} />
          ))}
          <input type="color" value={style.color} onChange={(e) => setStyle({ ...style, color: e.target.value })} className="h-6 w-8 rounded border border-ink/20" aria-label="Màu chữ khác" />
        </div>
        <p className="mt-2 text-[11px] font-semibold text-ink/60">Màu Chủ nhật & ngày lễ</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {["#e11d48", "#f97316", "#1c4d99", "#16a34a", "#1d1d1f"].map((c) => (
            <button key={c} type="button" onClick={() => setStyle({ ...style, accent: c })} className={`h-6 w-6 rounded-full border-2 ${style.accent === c ? "border-ink ring-2 ring-brand" : "border-ink/20"}`} style={{ background: c }} aria-label={`Màu nhấn ${c}`} />
          ))}
        </div>
      </div>
      <div className="space-y-1 text-xs font-semibold">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={style.lunar} onChange={(e) => setStyle({ ...style, lunar: e.target.checked })} /> Hiện ngày âm lịch
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={style.grid} onChange={(e) => setStyle({ ...style, grid: e.target.checked })} /> Kẻ dòng
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!style.paper} onChange={(e) => setStyle({ ...style, paper: e.target.checked ? "#ffffff" : null })} /> Nền trắng (bỏ chọn = trong suốt)
        </label>
      </div>
      <button type="button" onClick={() => void add()} className="btn w-full border-ink bg-brand py-2.5 text-sm">
        {month === "all" ? "Thêm lịch cho cả 12 tháng" : `Thêm lịch tháng ${month}/${year}`}
      </button>
    </section>
  );
}
