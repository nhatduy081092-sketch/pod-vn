"use client";
import { useRef, useState } from "react";
import { aiBlankPhotoAction, setBlankPhotoAction, uploadImageAction } from "@/lib/actions";
import { assetUrl, WEB_URL } from "@/lib/config";

export type BlankItem = { key: string; label: string; photo: string; prompt: string };

/** Ảnh tải lên -> cắt vuông giữa khung, 1200px (đồng bộ khung với mockup Studio, bỏ EXIF/GPS).
 *  Ảnh nền trong suốt (PNG/WebP) giữ nguyên trong suốt -> Studio đổi được màu áo theo lựa chọn của khách. */
async function normalize(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const S = 1200;
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, S, S);
    const corner = ctx.getImageData(0, 0, 4, 4).data;
    const alpha = file.type !== "image/jpeg" && corner[3]! < 250;
    if (!alpha) {
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#f4f2ef";
      ctx.fillRect(0, 0, S, S);
    }
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, alpha ? "image/png" : "image/jpeg", 0.9));
    if (!blob) throw new Error("Không xử lý được ảnh");
    return new File([blob], file.name.replace(/\.\w+$/, "") + (alpha ? ".png" : ".jpg"), { type: alpha ? "image/png" : "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** ảnh dựng sẵn nằm ở web (/blanks/…), ảnh tải lên ở /uploads */
const photoSrc = (p: string) => (p.startsWith("/blanks/") ? `${WEB_URL}${p}` : assetUrl(p));

export function BlankPhotos({ items: initial, aiEnabled }: { items: BlankItem[]; aiEnabled: boolean }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState("");
  const done = items.filter((i) => i.photo).length;
  const groups = [...new Set(items.map((i) => i.label.split(" · ")[0]))];

  const update = (key: string, photo: string) => setItems((xs) => xs.map((x) => (x.key === key ? { ...x, photo } : x)));
  const wrap = async (key: string, label: string, fn: () => Promise<string | null>) => {
    setBusy((b) => ({ ...b, [key]: label }));
    setMsg((m) => ({ ...m, [key]: "" }));
    try {
      const err = await fn();
      if (err) setMsg((m) => ({ ...m, [key]: err }));
    } finally {
      setBusy((b) => ({ ...b, [key]: "" }));
    }
  };

  async function upload(key: string, file?: File) {
    if (!file) return;
    await wrap(key, "Đang tải…", async () => {
      const fd = new FormData();
      fd.append("file", await normalize(file));
      const up = await uploadImageAction(fd);
      if (!up.ok) return up.error;
      const r = await setBlankPhotoAction(key, up.url);
      if (!r.ok) return r.error;
      update(key, up.url);
      return null;
    });
  }
  async function ai(key: string) {
    await wrap(key, "AI đang tạo… (~20s)", async () => {
      const r = await aiBlankPhotoAction(key);
      if (!r.ok) return r.error;
      update(key, r.url);
      return null;
    });
  }
  async function remove(key: string) {
    if (!confirm("Xoá ảnh thật của phôi này? Website quay lại dùng hình vẽ.")) return;
    await wrap(key, "Đang xoá…", async () => {
      const r = await setBlankPhotoAction(key, null);
      if (!r.ok) return r.error;
      update(key, "");
      return null;
    });
  }
  async function copy(item: BlankItem) {
    await navigator.clipboard.writeText(item.prompt).catch(() => undefined);
    setCopied(item.key);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <section className="card mb-6 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Phôi trơn – ảnh thật cho Studio & Mẫu có sẵn</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${done === items.length ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
          Đã có ảnh thật: {done}/{items.length}
        </span>
      </div>
      <p className="mt-1 text-sm text-neutral-600">
        Ảnh ở đây thay hình vẽ áo trong trình thiết kế (YALA Studio), ảnh xem trước mọi mẫu có sẵn và ảnh sản phẩm YALA Everyday. Ưu tiên làm <b>Áo thun Trắng</b> và <b>Áo thun Đen</b> trước.
      </p>
      <details className="mt-3 rounded-lg border bg-neutral-50 p-3 text-sm">
        <summary className="cursor-pointer font-medium">3 cách có ảnh thật</summary>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-neutral-700">
          <li>
            <b>Tự chụp áo trơn thật</b> (tốt nhất): áo phẳng mặt trước, nền sáng trơn, áo nằm giữa khung và chiếm ~80% chiều cao giống ảnh mẫu. Bấm <i>Tải ảnh lên</i> – hệ thống tự cắt vuông.
          </li>
          <li>
            <b>Tạo bằng ChatGPT (gói Plus)</b>: bấm <i>Ảnh mẫu</i> để tải hình vẽ, bấm <i>Chép lệnh AI</i> → mở chatgpt.com, đính kèm ảnh mẫu + dán lệnh, thêm câu “Keep the exact same framing and size as the attached image” → tải ảnh kết quả về → <i>Tải ảnh lên</i>. Ảnh dọc thì bảo ChatGPT “make it square 1:1”.
          </li>
          <li>
            <b>Tự động bằng API</b>: nút <i>Tạo bằng AI</i> (~0,02–0,04 USD/ảnh) – cần OPENAI_API_KEY (hoặc GEMINI_API_KEY) trên máy chủ. {aiEnabled ? "Key đã cấu hình." : "Chưa có key trên máy chủ."}
          </li>
        </ol>
        <p className="mt-2 text-neutral-500">Giữ áo đúng vị trí & kích thước như ảnh mẫu để vùng in trong Studio khớp với áo.</p>
      </details>

      {groups.map((g) => (
        <div key={g} className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-neutral-700">{g}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {items
              .filter((i) => i.label.startsWith(g + " · "))
              .map((i) => (
                <BlankCard key={i.key} item={i} busy={busy[i.key] ?? ""} msg={msg[i.key] ?? ""} copied={copied === i.key} aiEnabled={aiEnabled} onUpload={(f) => void upload(i.key, f)} onAi={() => void ai(i.key)} onRemove={() => void remove(i.key)} onCopy={() => void copy(i)} />
              ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function BlankCard({ item, busy, msg, copied, aiEnabled, onUpload, onAi, onRemove, onCopy }: { item: BlankItem; busy: string; msg: string; copied: boolean; aiEnabled: boolean; onUpload: (f?: File) => void; onAi: () => void; onRemove: () => void; onCopy: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const src = `/blank-src/${item.key}.jpg`;
  return (
    <div className={`overflow-hidden rounded-lg border ${item.photo ? "border-green-300" : ""}`}>
      <div className="relative aspect-square bg-[#f4f2ef]">
        <img src={item.photo ? photoSrc(item.photo) : src} alt={item.label} className="h-full w-full object-cover" loading="lazy" />
        <span className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium ${item.photo ? "bg-green-600 text-white" : "bg-white/90 text-neutral-600"}`}>{item.photo ? "Ảnh thật" : "Hình vẽ"}</span>
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-medium">{busy}</div>}
      </div>
      <div className="space-y-1.5 p-2">
        <p className="text-xs font-medium">{item.label.split(" · ")[1]}</p>
        <button type="button" className="btn-primary w-full !py-1 text-xs" disabled={!!busy} onClick={() => ref.current?.click()}>
          {item.photo ? "Thay ảnh" : "Tải ảnh lên"}
        </button>
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px]">
          <a href={src} download={`${item.key}.jpg`} className="text-blue-600 hover:underline">
            Ảnh mẫu
          </a>
          <button type="button" className="text-blue-600 hover:underline" onClick={onCopy}>
            {copied ? "Đã chép ✓" : "Chép lệnh AI"}
          </button>
          {aiEnabled && (
            <button type="button" className="text-blue-600 hover:underline" disabled={!!busy} onClick={onAi}>
              Tạo bằng AI
            </button>
          )}
          {item.photo && (
            <button type="button" className="text-red-600 hover:underline" disabled={!!busy} onClick={onRemove}>
              Xoá
            </button>
          )}
        </div>
        {msg && <p className="text-[11px] text-red-600">{msg}</p>}
      </div>
    </div>
  );
}
