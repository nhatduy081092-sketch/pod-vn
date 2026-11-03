"use client";
import Link from "next/link";
import { useState } from "react";

export type NumberFontItem = { font: string; label: string; note: string; href: string; bold: boolean };

/** Gõ số + tên của đội -> xem cùng lúc trên 7 font số (font nạp sẵn bằng DesignFonts ở trang); bấm là mở mẫu áo đội đúng font */
export function NumberFontTry({ items }: { items: NumberFontItem[] }) {
  const [num, setNum] = useState("10");
  const [name, setName] = useState("Tên bạn");
  const [dark, setDark] = useState(false);
  const shown = num || "10";

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 md:p-5">
        <label className="block w-24">
          <span className="label">Số áo</span>
          <input className="input text-lg font-semibold tabular-nums" value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, "").slice(0, 2))} inputMode="numeric" aria-label="Số áo" />
        </label>
        <label className="block min-w-[9rem] flex-1 sm:max-w-xs">
          <span className="label">Tên in trên áo</span>
          <input className="input text-lg font-semibold" value={name} onChange={(e) => setName(e.target.value.slice(0, 14))} aria-label="Tên in trên áo" />
        </label>
        <div className="flex gap-2" role="group" aria-label="Màu áo">
          {[false, true].map((d) => (
            <button
              key={String(d)}
              type="button"
              aria-pressed={dark === d}
              onClick={() => setDark(d)}
              className={`h-12 rounded-lg border px-4 text-[15px] font-semibold transition ${dark === d ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}
            >
              {d ? "Áo tối" : "Áo sáng"}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {items.map((f) => (
          <li key={f.font}>
            <Link href={f.href} prefetch={false} className="group block">
              <div className={`flex aspect-[4/5] flex-col items-center justify-center rounded-lg px-3 transition-colors ${dark ? "bg-[#1f2937] text-white" : "bg-white text-ink"}`}>
                <span
                  className="text-[clamp(72px,11vw,128px)] leading-none tabular-nums"
                  style={{ fontFamily: `"${f.font}", sans-serif`, fontWeight: f.bold ? 700 : 400 }}
                >
                  {shown}
                </span>
                <span
                  className="mt-3 max-w-full truncate text-[clamp(15px,1.6vw,20px)] uppercase tracking-[0.06em]"
                  style={{ fontFamily: `"${f.font === "Anton" ? "Oswald" : f.font}", sans-serif`, fontWeight: f.font === "Lobster" ? 400 : 700 }}
                >
                  {name || "Tên bạn"}
                </span>
              </div>
              <p className="mt-3 text-[17px] font-semibold transition-colors group-hover:text-brand-dark">{f.label}</p>
              <p className="mt-0.5 text-[15px] leading-snug text-ink/75">{f.note}</p>
              <p className="mt-1.5 text-[15px] font-semibold text-brand-dark underline underline-offset-4">Dùng font này</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[15px] text-ink/75">Số và tên ở đây chỉ để xem thử. Khi đặt cho cả đội, mỗi người ghi số, tên, size riêng qua link gom đơn.</p>
    </div>
  );
}
