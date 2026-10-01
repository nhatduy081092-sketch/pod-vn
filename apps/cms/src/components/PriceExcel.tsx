"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importPricesAction, type PriceImportReport } from "@/lib/actions";

/** Tải lên file Excel bảng giá: xem trước thay đổi -> áp dụng */
export function PriceExcelUpload() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<PriceImportReport | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const send = (apply: boolean) =>
    start(async () => {
      if (!file) return;
      setError("");
      const fd = new FormData();
      fd.set("file", file);
      fd.set("apply", apply ? "1" : "0");
      const r = await importPricesAction(fd);
      if (!r.ok) {
        setReport(null);
        return setError(r.error);
      }
      setReport(r.report);
      if (apply) router.refresh();
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={input}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="text-sm file:mr-3 file:rounded-lg file:border file:border-neutral-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setReport(null);
            setError("");
          }}
        />
        <button type="button" className="btn-primary" disabled={!file || pending} onClick={() => send(false)}>
          {pending && !report ? "Đang đọc file…" : "Xem trước thay đổi"}
        </button>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {report && (
        <div className="space-y-3">
          <div className={`rounded-lg px-3 py-2 text-sm ${report.dryRun ? "bg-neutral-50" : "bg-green-50 text-green-800"}`}>
            {report.dryRun ? "Xem trước" : "✓ Đã cập nhật"}: <b>{report.changed}</b> dòng thay đổi · {report.unchanged} dòng giữ nguyên · {report.errors.length} dòng lỗi (đọc {report.rows} dòng)
          </div>

          {report.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 p-3 text-sm">
              <p className="font-semibold text-red-700">Dòng lỗi – sẽ KHÔNG được cập nhật, sửa trong file rồi tải lên lại:</p>
              <ul className="mt-1 max-h-48 list-disc space-y-0.5 overflow-auto pl-5 text-red-700">
                {report.errors.map((e, i) => (
                  <li key={i}>
                    {e.sheet} – dòng {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.changes.length > 0 && (
            <div className="max-h-[420px] overflow-auto rounded-lg border">
              <table className="table">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th>Sản phẩm / phân loại</th>
                    <th>Thay đổi</th>
                  </tr>
                </thead>
                <tbody>
                  {report.changes.map((c) => (
                    <tr key={c.kind + c.id} className="align-top">
                      <td className="max-w-[320px] px-3 py-2 text-sm">{c.name}</td>
                      <td className="px-3 py-2 text-sm">
                        {c.fields.map((f) => (
                          <div key={f.field}>
                            <span className="text-neutral-500">{f.field}:</span> <s className="text-neutral-400">{f.before}</s> → <b>{f.after}</b>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report.changed > report.changes.length && <p className="p-2 text-xs text-neutral-500">… và {report.changed - report.changes.length} dòng khác</p>}
            </div>
          )}

          {report.dryRun && report.changed > 0 && (
            <button type="button" className="btn-brand" disabled={pending} onClick={() => send(true)}>
              {pending ? "Đang cập nhật…" : `Áp dụng ${report.changed} thay đổi lên website`}
            </button>
          )}
          {!report.dryRun && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setFile(null);
                setReport(null);
                if (input.current) input.current.value = "";
              }}
            >
              Tải file khác
            </button>
          )}
        </div>
      )}
    </div>
  );
}
