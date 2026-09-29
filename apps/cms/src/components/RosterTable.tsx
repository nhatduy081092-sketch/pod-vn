"use client";
import { useState } from "react";
import { rosterToCsv, sizeSummary, type RosterRow } from "@pod/shared";

/** Danh sách đồng phục trong đơn: đếm size + tải CSV cho xưởng */
export function RosterTable({ rows, fileName }: { rows: RosterRow[]; fileName: string }) {
  const [open, setOpen] = useState(false);
  const download = () => {
    const url = URL.createObjectURL(new Blob([rosterToCsv(rows)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <b>👕 Đồng phục {rows.length} áo</b>
        {sizeSummary(rows).map((s) => (
          <span key={s.size} className="rounded bg-white px-1.5 py-0.5 font-semibold ring-1 ring-neutral-200">
            {s.size}: {s.qty}
          </span>
        ))}
        <button type="button" onClick={() => setOpen((v) => !v)} className="ml-auto text-brand-dark underline">
          {open ? "Ẩn" : "Xem"} danh sách
        </button>
        <button type="button" onClick={download} className="btn-brand px-2 py-1 text-xs">
          Tải CSV
        </button>
      </div>
      {open && (
        <div className="mt-2 max-h-72 overflow-y-auto">
          <table className="table text-xs">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên in</th>
                <th>Số</th>
                <th>Size</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="font-semibold">{r.name}</td>
                  <td>{r.number}</td>
                  <td>{r.size}</td>
                  <td>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
