"use client";
import { useMemo, useRef, useState } from "react";
import { aiPhotoAction, setProductImagesAction } from "@/lib/actions";
import { assetUrl, WEB_URL } from "@/lib/config";

export type AiProduct = { id: string; name: string; slug: string; images: string[]; isActive: boolean; categoryName: string };
type Style = "studio" | "flatlay" | "model";
type Row = { status: "idle" | "running" | "done" | "error"; shots: { url: string; style: Style }[]; error?: string; applied?: string };

const STYLES: { v: Style; label: string; hint: string }[] = [
  { v: "studio", label: "Ảnh sản phẩm nền sáng", hint: "Áo dựng form (ghost mannequin), nền xám nhạt – hợp ô sản phẩm" },
  { v: "flatlay", label: "Trải phẳng (flat-lay)", hint: "Chụp từ trên xuống, nếp vải tự nhiên" },
  { v: "model", label: "Người mẫu mặc", hint: "Ảnh lifestyle – soát kỹ tay, mặt, hoạ tiết" },
];
/** Giá tham khảo 1 ảnh 1K (USD) theo model – ai.google.dev/gemini-api/docs/pricing (9/2026) */
const priceOf = (model: string) => (/mini/.test(model) ? 0.03 : /gpt-image/.test(model) ? 0.11 : /pro/.test(model) ? 0.134 : /lite/.test(model) ? 0.034 : 0.067);
const is2D = (u?: string) => !!u && (/\.svg($|\?)/i.test(u) || u.startsWith("/mock/"));

/** Ảnh sản phẩm (SVG 2D / ảnh) -> PNG 1024px nền trắng để gửi AI */
async function rasterize(src: string): Promise<Blob> {
  const img = new Image();
  img.decoding = "async";
  img.src = assetUrl(src);
  await img.decode().catch(() => {
    throw new Error("Không tải được ảnh nguồn");
  });
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, S, S);
  const w = img.naturalWidth || S;
  const h = img.naturalHeight || S;
  const k = Math.min(S / w, S / h) * 0.92;
  ctx.drawImage(img, (S - w * k) / 2, (S - h * k) / 2, w * k, h * k);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  if (!blob) throw new Error("Không chuyển được ảnh nguồn");
  return blob;
}

export function AiPhotoStudio({ products: initial, enabled, model }: { products: AiProduct[]; enabled: boolean; model: string }) {
  const [products, setProducts] = useState(initial);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [style, setStyle] = useState<Style>("studio");
  const [only2D, setOnly2D] = useState(true);
  const [keep2D, setKeep2D] = useState(true);
  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null);
  const stop = useRef(false);

  const list = useMemo(() => products.filter((p) => !only2D || is2D(p.images[0])), [products, only2D]);
  const count2D = products.filter((p) => is2D(p.images[0])).length;
  const PRICE_1K = priceOf(model || "lite");
  const pending = list.filter((p) => rows[p.id]?.shots.length && !rows[p.id]?.applied);
  const patch = (id: string, r: Partial<Row>) => setRows((s) => ({ ...s, [id]: { ...(s[id] ?? { status: "idle", shots: [] }), ...r } }));

  /** Ảnh nguồn gửi AI: ưu tiên ảnh 2D gốc (đúng hoạ tiết), không có thì ảnh đầu */
  const sourceOf = (p: AiProduct) => p.images.find(is2D) ?? p.images[0];

  async function generate(p: AiProduct, st: Style = style) {
    const src = sourceOf(p);
    if (!src) return patch(p.id, { status: "error", error: "Sản phẩm chưa có ảnh nguồn" });
    patch(p.id, { status: "running", error: undefined });
    try {
      const fd = new FormData();
      fd.append("file", await rasterize(src), "source.png");
      fd.append("productId", p.id);
      fd.append("style", st);
      const r = await aiPhotoAction(fd);
      if (!r.ok) throw new Error(r.error);
      setRows((s) => ({ ...s, [p.id]: { ...(s[p.id] ?? { shots: [] }), status: "done", shots: [{ url: r.url, style: st }, ...(s[p.id]?.shots ?? [])] } }));
    } catch (e) {
      patch(p.id, { status: "error", error: (e as Error).message });
    }
  }

  async function runAll() {
    const todo = list.filter((p) => !rows[p.id]?.shots.length && !rows[p.id]?.applied);
    if (!todo.length) return;
    if (!confirm(`Tạo ảnh thật cho ${todo.length} sản phẩm (~${(todo.length * PRICE_1K).toFixed(2)} USD tính vào tài khoản Google AI của bạn)?`)) return;
    stop.current = false;
    setBatch({ done: 0, total: todo.length });
    let i = 0;
    // 2 luồng song song – nhanh gấp đôi mà ít bị Google giới hạn tần suất
    const worker = async () => {
      while (!stop.current && i < todo.length) {
        const p = todo[i++]!;
        await generate(p);
        setBatch((b) => (b ? { ...b, done: b.done + 1 } : b));
      }
    };
    await Promise.all([worker(), worker()]);
    setBatch(null);
  }

  async function apply(p: AiProduct, url: string) {
    const rest = p.images.filter((u) => u !== url && (keep2D || !is2D(u)));
    const images = [url, ...rest].slice(0, 12);
    const r = await setProductImagesAction(p.id, images);
    if (!r.ok) return patch(p.id, { error: r.error });
    setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, images } : x)));
    patch(p.id, { applied: url, error: undefined });
  }

  async function applyAll() {
    if (!confirm(`Dùng ảnh AI mới nhất cho ${pending.length} sản phẩm?`)) return;
    for (const p of pending) await apply(p, rows[p.id]!.shots[0]!.url);
  }

  if (!enabled) {
    return (
      <div className="card max-w-2xl space-y-3 text-sm">
        <p className="font-bold">Chưa bật tạo ảnh AI</p>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            Tạo API key tại <b>platform.openai.com/api-keys</b> và nạp tối thiểu 5 USD tại Settings → Billing (tắt Auto recharge).
          </li>
          <li>
            Trên VPS thêm vào <code>/opt/yala/.env.production</code>: <code>OPENAI_API_KEY=&quot;sk-…&quot;</code>
          </li>
          <li>
            Chạy lại: <code>cd /opt/yala && bash deploy/deploy.sh --force</code> rồi mở lại trang này.
          </li>
        </ol>
        <p className="text-neutral-500">
          {count2D}/{products.length} sản phẩm đang dùng ảnh vẽ 2D. Chi phí ước tính ~{(count2D * PRICE_1K).toFixed(2)} USD cho 1 lượt tạo tất cả (Nano Banana 2 Lite, ảnh 1K).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <section className="card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {STYLES.map((s) => (
            <button key={s.v} type="button" onClick={() => setStyle(s.v)} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${style === s.v ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`} title={s.hint}>
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-500">{STYLES.find((s) => s.v === style)?.hint}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={only2D} onChange={(e) => setOnly2D(e.target.checked)} /> Chỉ sản phẩm còn ảnh 2D ({count2D})
          </label>
          <label className="flex items-center gap-2" title="Ảnh 2D đúng 100% hoạ tiết – nên giữ để khách đối chiếu">
            <input type="checkbox" checked={keep2D} onChange={(e) => setKeep2D(e.target.checked)} /> Giữ ảnh 2D làm ảnh phụ
          </label>
          <span className="text-neutral-500">Model: {model}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {batch ? (
            <button type="button" className="btn-danger" onClick={() => (stop.current = true)}>
              Dừng ({batch.done}/{batch.total})
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={() => void runAll()} disabled={!list.length}>
              Tạo ảnh thật cho {list.filter((p) => !rows[p.id]?.shots.length && !rows[p.id]?.applied).length} sản phẩm
            </button>
          )}
          {pending.length > 0 && !batch && (
            <button type="button" className="btn-brand" onClick={() => void applyAll()}>
              Duyệt tất cả ({pending.length})
            </button>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          Mỗi ảnh ~{PRICE_1K} USD, 10–30 giây. Ảnh chỉ thay trên web khi bạn bấm <b>Dùng ảnh này</b>. Ảnh AI tự có nhãn “Ảnh minh hoạ” trên web – nhãn mất khi bạn thay bằng ảnh/mockup thật từ xưởng.
        </p>
      </section>

      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => {
          const r = rows[p.id];
          const src = sourceOf(p);
          return (
            <li key={p.id} className="card space-y-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold" title={p.name}>
                    {p.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {p.categoryName}
                    {!p.isActive && " · đang ẩn"}
                    {r?.applied && <span className="font-semibold text-green-700"> · ✓ đã thay ảnh</span>}
                  </p>
                </div>
                <a href={`${WEB_URL}/san-pham/${p.slug}`} target="_blank" rel="noreferrer" className="shrink-0 text-xs underline">
                  Xem web
                </a>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <figure>
                  <div className="aspect-square overflow-hidden rounded border bg-neutral-50">{src && <img src={assetUrl(src)} alt="" className="h-full w-full object-contain" />}</div>
                  <figcaption className="mt-0.5 text-center text-[11px] text-neutral-500">Ảnh nguồn (2D)</figcaption>
                </figure>
                <figure>
                  <div className="relative aspect-square overflow-hidden rounded border bg-neutral-50">
                    {r?.shots[0] ? (
                      <img src={assetUrl(r.shots[0].url)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center p-2 text-center text-xs text-neutral-400">{r?.status === "running" ? "Đang tạo… (10–30 giây)" : "Chưa tạo"}</span>
                    )}
                    {r?.status === "running" && r.shots[0] && <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[11px] text-white">Đang tạo ảnh mới…</span>}
                  </div>
                  <figcaption className="mt-0.5 text-center text-[11px] text-neutral-500">Ảnh AI {r?.shots.length ? `(${r.shots.length} bản)` : ""}</figcaption>
                </figure>
              </div>
              {r?.shots && r.shots.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto">
                  {r.shots.map((s, k) => (
                    <button
                      key={s.url}
                      type="button"
                      onClick={() => patch(p.id, { shots: [s, ...r.shots.filter((_, j) => j !== k)] })}
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded border ${k === 0 ? "ring-2 ring-neutral-900" : ""}`}
                      title="Chọn bản này"
                    >
                      <img src={assetUrl(s.url)} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {r?.error && <p className="text-xs text-red-600">{r.error}</p>}
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className="btn-ghost px-2.5 py-1 text-xs" disabled={r?.status === "running" || !!batch} onClick={() => void generate(p)}>
                  {r?.shots.length ? "Tạo lại" : "Tạo ảnh"}
                </button>
                {r?.shots[0] && r.applied !== r.shots[0].url && (
                  <button type="button" className="btn-primary px-2.5 py-1 text-xs" onClick={() => void apply(p, r.shots[0]!.url)}>
                    Dùng ảnh này
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {!list.length && <p className="text-sm text-neutral-500">Không còn sản phẩm nào dùng ảnh 2D.</p>}
    </div>
  );
}
