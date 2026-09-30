"use client";
import { useRef, useState } from "react";
import {
  rosterRowSchema,
  parseDelimited,
  rosterTemplateCsv,
  rowsToRoster,
  sizeSummary,
  type RosterIssue,
  type RosterRow,
} from "@pod/shared";
import { readXlsxFirstSheet } from "@/lib/xlsx";
import { IconUpload } from "../ui/icons";

type Props = {
  sizes: string[];
  productSlug: string;
  rows: RosterRow[];
  onChange: (rows: RosterRow[]) => void;
};

/**
 * Đồng phục nhóm: tải file Excel/CSV hoặc dán từ Excel/Google Sheets
 * -> xem trước, báo lỗi theo dòng, đếm size.
 */
export function TeamOrderPanel({ sizes, productSlug, rows, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [issues, setIssues] = useState<RosterIssue[]>([]);
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [one, setOne] = useState({ name: "", number: "", size: sizes[0] ?? "" });
  const [oneErr, setOneErr] = useState("");

  /** Thêm tay từng người (nhóm nhỏ, hoặc 1 áo in tên riêng) */
  function addOne(e: React.FormEvent) {
    e.preventDefault();
    const r = rosterRowSchema.safeParse({ ...one, size: one.size || sizes[0] || "FREE SIZE", note: "" });
    if (!r.success) return setOneErr(r.error.issues[0]?.message ?? "Kiểm tra lại");
    if (!r.data.name && !r.data.number) return setOneErr("Nhập tên hoặc số áo");
    setOneErr("");
    onChange([...rows, r.data]);
    setOne({ name: "", number: "", size: one.size });
  }

  function apply(table: string[][]) {
    const res = rowsToRoster(table, sizes);
    onChange(res.rows);
    setIssues(res.issues);
  }

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setFileName(file.name);
    try {
      if (/\.xlsx$/i.test(file.name)) apply(await readXlsxFirstSheet(file));
      else if (/\.(csv|txt|tsv)$/i.test(file.name)) apply(parseDelimited(await file.text()));
      else setIssues([{ line: 0, message: "Chỉ nhận file .xlsx hoặc .csv (file .xls cũ: mở bằng Excel rồi Lưu thành .xlsx)" }]);
    } catch (e) {
      setIssues([{ line: 0, message: (e as Error).message || "Không đọc được file" }]);
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([rosterTemplateCsv(sizes)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mau-danh-sach-dong-phuc-${productSlug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const summary = sizeSummary(rows, sizes);

  return (
    <section className="mt-5 space-y-3">
      <h2 className="label">2. Danh sách thành viên (tên in, số áo, size)</h2>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="btn-primary px-4 py-2 text-[13px]">
          <IconUpload className="h-4 w-4" /> {busy ? "Đang đọc..." : "Tải file Excel / CSV"}
        </button>
        <button type="button" onClick={() => setShowPaste((v) => !v)} className="btn-outline px-4 py-2 text-[13px]">
          Dán từ Excel
        </button>
        <button type="button" onClick={downloadTemplate} className="px-2 text-[13px] font-bold text-brand-dark underline">
          Tải file mẫu
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.csv,.tsv,.txt" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>
      <form onSubmit={addOne} className="grid grid-cols-[1fr_64px_84px_auto] gap-1.5">
        <input className="input h-9 px-2 text-sm" value={one.name} maxLength={30} onChange={(e) => setOne({ ...one, name: e.target.value })} placeholder="Tên in" aria-label="Tên in" />
        <input className="input h-9 px-2 text-sm" value={one.number} inputMode="numeric" maxLength={3} onChange={(e) => setOne({ ...one, number: e.target.value.replace(/\D/g, "") })} placeholder="Số" aria-label="Số áo" />
        <select className="input h-9 px-1 text-sm" value={one.size} onChange={(e) => setOne({ ...one, size: e.target.value })} aria-label="Size">
          {(sizes.length ? sizes : ["FREE SIZE"]).map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
        <button className="btn-outline h-9 px-3 text-[13px]">+ Thêm</button>
      </form>
      {oneErr && <p className="-mt-1 text-xs text-red-700">{oneErr}</p>}
      <p className="text-xs text-ink/60">
        Nhập tay từng người ở trên, hoặc tải file. Cột: <b>Tên in</b> · <b>Số áo</b> · <b>Size</b> ({sizes.join(", ")}) · Ghi chú. Dòng đầu là tiêu đề. Mỗi dòng = 1 áo.
        {fileName && <> Đã đọc: <b>{fileName}</b></>}
      </p>

      {showPaste && (
        <div>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={6}
            className="input font-mono text-[13px]"
            placeholder={"Bôi đen các cột trong Excel/Google Sheets → Ctrl+C → dán vào đây\nTên in\tSố áo\tSize\nNGUYỄN AN\t10\tM"}
          />
          <button type="button" className="btn-primary mt-2 px-4 py-2 text-[13px]" onClick={() => apply(parseDelimited(paste))}>
            Đọc danh sách
          </button>
        </div>
      )}

      {issues.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-bold">{issues.length} dòng chưa hợp lệ (đã bỏ qua):</p>
          <ul className="mt-1 max-h-32 list-disc overflow-y-auto pl-5 text-xs">
            {issues.slice(0, 50).map((i, k) => (
              <li key={k}>{i.line ? `Dòng ${i.line}: ` : ""}{i.message}</li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-line">
          <div className="flex flex-wrap items-center gap-2 bg-brand px-3 py-2 text-sm">
            <b>{rows.length} áo</b>
            {summary.map((s) => (
              <span key={s.size} className="rounded bg-white px-2 py-0.5 text-xs font-bold">
                {s.size}: {s.qty}
              </span>
            ))}
            <button type="button" className="ml-auto text-xs font-semibold underline" onClick={() => (onChange([]), setIssues([]), setFileName(""))}>
              Xoá danh sách
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-cream text-xs uppercase text-ink/60">
                <tr>
                  <th className="px-3 py-1.5">#</th>
                  <th className="px-3 py-1.5">Tên in</th>
                  <th className="px-3 py-1.5">Số</th>
                  <th className="px-3 py-1.5">Size</th>
                  <th className="px-3 py-1.5">Ghi chú</th>
                  <th className="px-1 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-ink/10">
                    <td className="px-3 py-1 text-ink/50">{i + 1}</td>
                    <td className="px-3 py-1 font-semibold">{r.name || <span className="text-ink/40">—</span>}</td>
                    <td className="px-3 py-1">{r.number}</td>
                    <td className="px-3 py-1 font-bold">{r.size}</td>
                    <td className="px-3 py-1 text-xs text-ink/60">{r.note}</td>
                    <td className="px-1 py-1 text-right">
                      <button type="button" onClick={() => onChange(rows.filter((_, k) => k !== i))} className="px-1.5 text-ink/40 hover:text-red-600" aria-label={`Xoá dòng ${i + 1}`}>
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
