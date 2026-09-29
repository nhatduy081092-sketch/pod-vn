"use client";
import { useRef, useState } from "react";
import { uploadImageAction } from "@/lib/actions";
import { assetUrl } from "@/lib/config";

/** Ô chọn 1 ảnh: upload lên API hoặc dán URL */
export function ImageInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.append("file", file);
    const r = await uploadImageAction(fd);
    setBusy(false);
    if (r.ok) onChange(r.url);
    else setErr(r.error);
  }

  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className="flex items-center gap-2">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border bg-neutral-50">
          {value ? <img src={assetUrl(value)} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-neutral-400">trống</span>}
        </div>
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/... hoặc https://..." />
        <button type="button" className="btn-ghost shrink-0" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? "..." : "Tải ảnh"}
        </button>
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

/** Danh sách nhiều ảnh (ảnh đầu = ảnh đại diện) */
export function ImageListInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr("");
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", f);
      const r = await uploadImageAction(fd);
      if (r.ok) urls.push(r.url);
      else setErr(r.error);
    }
    setBusy(false);
    onChange([...value, ...urls]);
  }

  const move = (i: number, d: number) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {value.map((src, i) => (
          <li key={src + i} className="group relative h-24 w-24 overflow-hidden rounded-lg border bg-neutral-50">
            <img src={assetUrl(src)} alt="" className="h-full w-full object-contain" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-ink px-1 text-[10px] text-white">Chính</span>}
            {isSourceImage(src) && (
              <span className="absolute right-1 top-1 rounded bg-amber-500 px-1 text-[10px] font-bold text-white" title="Ảnh lấy trực tiếp từ oemgroup.vn">
                OEM
              </span>
            )}
            {/* Mobile luôn hiện nút (không có hover), desktop hiện khi rê chuột */}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 text-xs text-white transition md:opacity-0 md:group-hover:opacity-100">
              <button type="button" className="px-2 py-1" aria-label="Chuyển trái" onClick={() => move(i, -1)}>
                ←
              </button>
              <button type="button" className="px-2 py-1" onClick={() => onChange(value.filter((_, k) => k !== i))}>
                Xoá
              </button>
              <button type="button" className="px-2 py-1" aria-label="Chuyển phải" onClick={() => move(i, 1)}>
                →
              </button>
            </div>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={busy}
            className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed text-sm text-neutral-500 hover:border-neutral-400"
          >
            {busy ? "Đang tải..." : "+ Ảnh"}
          </button>
          <input ref={ref} type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void pick(e.target.files)} />
        </li>
      </ul>
      {value.some(isSourceImage) && (
        <p className="mt-2 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
          Ảnh gắn nhãn <b>OEM</b> đang lấy trực tiếp từ oemgroup.vn. Nên tải ảnh thật lên để web không phụ thuộc website khác (ảnh tự upload sẽ được giữ nguyên khi đồng bộ lại).
        </p>
      )}
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

function isSourceImage(u: string) {
  return /^https?:\/\/(www\.)?oemgroup\.vn\//i.test(u);
}
