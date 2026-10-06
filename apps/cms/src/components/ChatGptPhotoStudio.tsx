"use client";
import { useMemo, useRef, useState } from "react";
import { productPhotoPrompt, removeVietnameseTones, type PhotoPromptStyle } from "@pod/shared";
import { setProductImagesAction, uploadImageAction } from "@/lib/actions";
import { assetUrl, WEB_URL } from "@/lib/config";

export type GptProduct = { id: string; name: string; slug: string; images: string[]; isActive: boolean; categoryName: string; categorySlug: string; material: string; source: boolean };

const isOurs = (u?: string) => !!u && u.startsWith("/uploads/");
const PAGE = 30;

/** Ảnh ChatGPT -> vuông 1400px, nền #f4f2ef, JPG (bỏ EXIF) */
async function normalize(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const S = 1400;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#f4f2ef";
    ctx.fillRect(0, 0, S, S);
    const k = Math.max(S / img.naturalWidth, S / img.naturalHeight);
    ctx.drawImage(img, (S - img.naturalWidth * k) / 2, (S - img.naturalHeight * k) / 2, img.naturalWidth * k, img.naturalHeight * k);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.9));
    if (!blob) throw new Error("Không xử lý được ảnh");
    return new File([blob], "chatgpt.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Tạo ảnh sản phẩm bằng ChatGPT (làm tay, không cần API key): mở ảnh nguồn → chép lệnh theo ngành hàng →
 * dán vào ChatGPT kèm ảnh nguồn → tải ảnh kết quả lên → tự đặt làm ảnh chính.
 */
export function ChatGptPhotoStudio({ products: initial }: { products: GptProduct[] }) {
  const [products, setProducts] = useState(initial);
  const [style, setStyle] = useState<PhotoPromptStyle>("studio");
  const [onlySource, setOnlySource] = useState(true);
  const [hideDone, setHideDone] = useState(true);
  const [keepOld, setKeepOld] = useState(false);
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [state, setState] = useState<Record<string, { busy?: string; err?: string; copied?: boolean; done?: boolean }>>({});
  const patch = (id: string, v: (typeof state)[string]) => setState((s) => ({ ...s, [id]: { ...s[id], ...v } }));

  const cats = useMemo(() => [...new Set(products.filter((p) => !onlySource || p.source).map((p) => p.categoryName))].filter(Boolean), [products, onlySource]);
  const list = useMemo(() => {
    const k = removeVietnameseTones(q.trim().toLowerCase());
    return products.filter(
      (p) =>
        (!onlySource || p.source) &&
        (!hideDone || !isOurs(p.images[0]) || state[p.id]?.done) &&
        (!cat || p.categoryName === cat) &&
        (!k || removeVietnameseTones(p.name.toLowerCase()).includes(k)),
    );
  }, [products, onlySource, hideDone, cat, q, state]);
  const doneCount = products.filter((p) => (!onlySource || p.source) && isOurs(p.images[0])).length;
  const total = products.filter((p) => !onlySource || p.source).length;

  async function copy(p: GptProduct) {
    await navigator.clipboard.writeText(productPhotoPrompt({ name: p.name, categorySlug: p.categorySlug, categoryName: p.categoryName, material: p.material }, style)).catch(() => undefined);
    patch(p.id, { copied: true });
    setTimeout(() => patch(p.id, { copied: false }), 1500);
  }

  async function upload(p: GptProduct, f?: File) {
    if (!f) return;
    patch(p.id, { busy: "Đang tải lên…", err: "" });
    try {
      const fd = new FormData();
      fd.append("file", await normalize(f));
      fd.append("ai", "1");
      const up = await uploadImageAction(fd);
      if (!up.ok) throw new Error(up.error);
      // ảnh mới làm ảnh chính; giữ ảnh YALA cũ, ảnh nguồn chỉ giữ khi chọn
      const rest = p.images.filter((u) => keepOld || isOurs(u));
      const images = [up.url, ...rest].slice(0, 12);
      const r = await setProductImagesAction(p.id, images);
      if (!r.ok) throw new Error(r.error);
      setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, images } : x)));
      patch(p.id, { busy: "", done: true });
    } catch (e) {
      patch(p.id, { busy: "", err: (e as Error).message });
    }
  }

  return (
    <section className="card mb-6 space-y-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Ảnh sản phẩm bằng ChatGPT (làm tay, không cần API key)</h2>
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-sm font-medium">
          Đã có ảnh YALA: {doneCount}/{total}
        </span>
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-700">
        <li>
          Bấm <b>Ảnh nguồn</b> → lưu ảnh về máy (chuột phải → Lưu hình ảnh).
        </li>
        <li>
          Bấm <b>Chép lệnh</b> → mở chatgpt.com (New chat) → đính kèm ảnh nguồn + dán lệnh → tải ảnh kết quả về.
        </li>
        <li>
          Bấm <b>Tải ảnh ChatGPT lên</b> → ảnh tự thành ảnh chính của sản phẩm (gắn nhãn “Ảnh minh hoạ” trên web cho tới khi có ảnh chụp thật).
        </li>
      </ol>
      <p className="text-xs text-neutral-500">Lệnh tự chọn góc chụp theo ngành hàng và yêu cầu sản phẩm trơn – xoá logo, chữ, watermark của ảnh nguồn – để khách hình dung in logo riêng. Soát lại ảnh trước khi dùng: hình dáng, màu, chi tiết phải đúng hàng thật.</p>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["studio", "Ảnh sản phẩm nền sáng"],
            ["lifestyle", "Ảnh dùng thực tế (người, bối cảnh)"],
          ] as const
        ).map(([v, label]) => (
          <button key={v} type="button" onClick={() => setStyle(v)} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${style === v ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <select className="input w-auto" value={cat} onChange={(e) => (setCat(e.target.value), setLimit(PAGE))}>
          <option value="">Mọi ngành hàng</option>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input className="input w-56" placeholder="Tìm tên sản phẩm…" value={q} onChange={(e) => (setQ(e.target.value), setLimit(PAGE))} />
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={onlySource} onChange={(e) => setOnlySource(e.target.checked)} /> Chỉ sản phẩm nguồn (nhà cung cấp)
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> Ẩn sản phẩm đã có ảnh YALA
        </label>
        <label className="flex items-center gap-1.5" title="Mặc định bỏ ảnh của nhà cung cấp (có thể có logo/watermark của họ)">
          <input type="checkbox" checked={keepOld} onChange={(e) => setKeepOld(e.target.checked)} /> Giữ ảnh nguồn làm ảnh phụ
        </label>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.slice(0, limit).map((p) => (
          <GptCard key={p.id} p={p} st={state[p.id] ?? {}} onCopy={() => void copy(p)} onUpload={(f) => void upload(p, f)} />
        ))}
      </ul>
      {!list.length && <p className="text-sm text-neutral-500">Không có sản phẩm phù hợp.</p>}
      {list.length > limit && (
        <button type="button" className="btn-ghost w-full" onClick={() => setLimit((l) => l + PAGE)}>
          Xem thêm ({list.length - limit})
        </button>
      )}
    </section>
  );
}

function GptCard({ p, st, onCopy, onUpload }: { p: GptProduct; st: { busy?: string; err?: string; copied?: boolean; done?: boolean }; onCopy: () => void; onUpload: (f?: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const src = p.images.find((u) => !isOurs(u)) ?? p.images[0];
  const full = src ? (/^https?:\/\//.test(src) ? src : `${WEB_URL}${assetUrl(src)}`) : "";
  return (
    <li className={`overflow-hidden rounded-lg border ${st.done ? "border-green-400" : ""}`}>
      <div className="relative aspect-square bg-neutral-50">
        {p.images[0] && <img src={assetUrl(p.images[0])} alt="" loading="lazy" className="h-full w-full object-contain" />}
        {isOurs(p.images[0]) && <span className="absolute left-1.5 top-1.5 rounded bg-green-600 px-1.5 py-0.5 text-[11px] font-medium text-white">Ảnh YALA</span>}
        {st.busy && <div className="absolute inset-0 grid place-items-center bg-white/70 text-xs font-medium">{st.busy}</div>}
      </div>
      <div className="space-y-1.5 p-2">
        <p className="line-clamp-2 text-xs font-semibold" title={p.name}>
          {p.name}
        </p>
        <p className="text-[11px] text-neutral-500">{p.categoryName}</p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <a href={full} target="_blank" rel="noreferrer" className={`btn-ghost justify-center px-1 py-1 ${full ? "" : "pointer-events-none opacity-40"}`}>
            Ảnh nguồn
          </a>
          <button type="button" className="btn-ghost px-1 py-1" onClick={onCopy}>
            {st.copied ? "Đã chép ✓" : "Chép lệnh"}
          </button>
        </div>
        <button type="button" className="btn-primary w-full py-1 text-xs" disabled={!!st.busy} onClick={() => ref.current?.click()}>
          {st.done ? "Thay ảnh ChatGPT khác" : "Tải ảnh ChatGPT lên"}
        </button>
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => (onUpload(e.target.files?.[0]), (e.target.value = ""))} />
        <div className="flex justify-between text-[11px]">
          <a href={`${WEB_URL}/san-pham/${p.slug}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
            Xem trên web
          </a>
          {st.done && <span className="font-medium text-green-700">✓ Đã dùng ảnh mới</span>}
        </div>
        {st.err && <p className="text-[11px] text-red-600">{st.err}</p>}
      </div>
    </li>
  );
}
