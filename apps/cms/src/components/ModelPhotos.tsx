"use client";
import { useRef, useState, type PointerEvent } from "react";
import type { ModelPhoto } from "@pod/shared";
import { setModelPhotoAction, uploadImageAction } from "@/lib/actions";
import { assetUrl, WEB_URL } from "@/lib/config";

/** ảnh mặc định nằm ở web (/showcase/…), ảnh tải lên ở /uploads */
const photoUrl = (p: string) => (p.startsWith("/showcase/") ? `${WEB_URL}${p}` : assetUrl(p));

export type ModelItem = { key: string; label: string; garment: string; color: string; model: ModelPhoto | null; prompt: string };

/** Ảnh tải lên -> JPG cạnh dài 1600px (bỏ EXIF/GPS), giữ nguyên tỉ lệ */
async function normalize(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.9));
    if (!blob) throw new Error("Không xử lý được ảnh");
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

const DEFAULT_RECT = { x: 0.34, y: 0.3, w: 0.32, h: 0.3 };

/**
 * Người mẫu mặc áo trơn: tải ảnh + kéo khung vùng in trên ngực áo.
 * Studio hiện nút "Người mẫu" khi sản phẩm cùng dáng có ảnh (áo tối dùng ảnh áo đen, còn lại ảnh áo trắng).
 */
export function ModelPhotos({ items: initial }: { items: ModelItem[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const done = items.filter((i) => i.model).length;

  async function copy(i: ModelItem) {
    await navigator.clipboard.writeText(i.prompt).catch(() => undefined);
    setCopied(i.key);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <section className="card mb-6 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Người mẫu mặc áo trơn – “Xem trên người mẫu” trong Studio</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${done ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
          Đã có: {done}/{items.length}
        </span>
      </div>
      <p className="mt-1 text-sm text-neutral-600">
        Khách bấm <b>Người mẫu</b> trong Studio để xem thiết kế trên người thật. Cần 1 ảnh áo trắng + 1 ảnh áo đen cho mỗi dáng. Tạo bằng ChatGPT: bấm <i>Chép lệnh</i> → dán vào chatgpt.com → tải ảnh về →{" "}
        <i>Tải ảnh lên</i> → kéo khung xanh đúng vùng in trên ngực áo → <i>Lưu khung</i>. Chỉ dùng ảnh AI hoặc ảnh có quyền sử dụng (không dùng ảnh người thật chưa đồng ý).
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((i) => (
          <div key={i.key} className={`overflow-hidden rounded-lg border ${i.model ? "border-green-300" : ""}`}>
            <button type="button" className="relative block aspect-[4/5] w-full bg-[#f4f2ef]" onClick={() => setOpen(i.key)}>
              {i.model ? (
                <>
                  <img src={photoUrl(i.model.photo)} alt={i.label} className="h-full w-full object-cover" />
                  <span className="absolute border-2 border-dashed border-sky-500" style={{ left: `${i.model.x * 100}%`, top: `${i.model.y * 100}%`, width: `${i.model.w * 100}%`, height: `${i.model.h * 100}%` }} />
                </>
              ) : (
                <span className="flex h-full items-center justify-center p-3 text-center text-xs text-neutral-500">Chưa có ảnh – bấm để thêm</span>
              )}
            </button>
            <div className="space-y-1 p-2">
              <p className="text-xs font-medium">{i.label}</p>
              <div className="flex flex-wrap gap-x-2 text-[11px]">
                <button type="button" className="text-blue-600 hover:underline" onClick={() => setOpen(i.key)}>
                  {i.model ? "Sửa" : "Tải ảnh lên"}
                </button>
                <button type="button" className="text-blue-600 hover:underline" onClick={() => void copy(i)}>
                  {copied === i.key ? "Đã chép ✓" : "Chép lệnh"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <ModelEditor
          item={items.find((x) => x.key === open)!}
          onClose={() => setOpen(null)}
          onSaved={(model) => {
            setItems((xs) => xs.map((x) => (x.key === open ? { ...x, model } : x)));
            setOpen(null);
          }}
        />
      )}
    </section>
  );
}

function ModelEditor({ item, onClose, onSaved }: { item: ModelItem; onClose: () => void; onSaved: (m: ModelPhoto | null) => void }) {
  const [photo, setPhoto] = useState(item.model?.photo ?? "");
  const [rect, setRect] = useState(item.model ? { x: item.model.x, y: item.model.y, w: item.model.w, h: item.model.h } : DEFAULT_RECT);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: "move" | "draw"; sx: number; sy: number; r: typeof rect } | null>(null);

  const pt = (e: PointerEvent) => {
    const b = boxRef.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), y: Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)) };
  };
  function down(e: PointerEvent) {
    if (!photo) return;
    const p = pt(e);
    const inside = p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h;
    drag.current = { mode: inside ? "move" : "draw", sx: p.x, sy: p.y, r: rect };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const p = pt(e);
    if (d.mode === "move") {
      setRect({ ...d.r, x: Math.min(1 - d.r.w, Math.max(0, d.r.x + p.x - d.sx)), y: Math.min(1 - d.r.h, Math.max(0, d.r.y + p.y - d.sy)) });
    } else {
      const x = Math.min(d.sx, p.x);
      const y = Math.min(d.sy, p.y);
      setRect({ x, y, w: Math.max(0.03, Math.abs(p.x - d.sx)), h: Math.max(0.03, Math.abs(p.y - d.sy)) });
    }
  }

  async function upload(f?: File) {
    if (!f) return;
    setErr("");
    setBusy("Đang tải ảnh…");
    try {
      const fd = new FormData();
      fd.append("file", await normalize(f));
      const up = await uploadImageAction(fd);
      if (!up.ok) throw new Error(up.error);
      setPhoto(up.url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function save(remove = false) {
    setErr("");
    setBusy("Đang lưu…");
    const model = remove ? null : { photo, ...rect };
    const r = await setModelPhotoAction(item.key, model ? model : { photo: null, ...rect });
    setBusy("");
    if (!r.ok) return setErr(r.error);
    onSaved(model);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{item.label}</h3>
          <button type="button" onClick={onClose} className="text-xl leading-none text-neutral-500" aria-label="Đóng">
            ×
          </button>
        </div>
        <p className="mt-1 text-xs text-neutral-600">{photo ? "Kéo trong khung để di chuyển, kéo ngoài khung để vẽ lại vùng in (phần ngực áo phẳng, không bị tay che)." : "Tải ảnh người mẫu mặc áo trơn, nhìn thẳng."}</p>
        <div
          ref={boxRef}
          className="relative mx-auto mt-3 w-full touch-none select-none overflow-hidden rounded-lg bg-[#f4f2ef]"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={() => (drag.current = null)}
        >
          {photo ? (
            <>
              <img src={photoUrl(photo)} alt="" className="pointer-events-none block w-full" draggable={false} />
              <div className="absolute cursor-move border-2 border-sky-500 bg-sky-400/20" style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }}>
                <span className="absolute -top-5 left-0 rounded bg-sky-600 px-1 text-[10px] text-white">Vùng in</span>
              </div>
            </>
          ) : (
            <button type="button" className="flex aspect-[4/5] w-full items-center justify-center text-sm text-neutral-500" onClick={() => fileRef.current?.click()}>
              + Chọn ảnh
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer font-medium">Lệnh ChatGPT</summary>
          <p className="mt-1 rounded bg-neutral-50 p-2 font-mono text-[11px] leading-relaxed">{item.prompt}</p>
        </details>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost text-sm" disabled={!!busy} onClick={() => fileRef.current?.click()}>
            {photo ? "Đổi ảnh" : "Tải ảnh lên"}
          </button>
          {item.model && (
            <button type="button" className="btn-ghost text-sm text-red-600" disabled={!!busy} onClick={() => confirm("Xoá ảnh người mẫu này?") && void save(true)}>
              Xoá
            </button>
          )}
          <button type="button" className="btn-primary ml-auto text-sm" disabled={!!busy || !photo} onClick={() => void save()}>
            {busy || "Lưu khung"}
          </button>
        </div>
      </div>
    </div>
  );
}
