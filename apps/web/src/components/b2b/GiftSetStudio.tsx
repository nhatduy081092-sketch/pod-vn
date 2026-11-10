"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { emptyDesign, surfaceOfProduct, UPLOAD_MAX_BYTES, UPLOAD_MAX_SIDE_PX, type AreaDesign, type ImageLayer } from "@pod/shared";
import { apiFetch } from "@/lib/client-api";
import { assetUrl } from "@/lib/config";
import type { GiftCandidate } from "@/lib/gift-set";
import { useQuoteList } from "@/lib/quote-list";
import type { PrintArea, ProductDetail } from "@/lib/types";
import { loadAreaAssets, renderPreview, uploadBlob } from "@/components/editor/export";
import { canvasToBlob, createCanvas, hasTransparency, imgSize, loadImage, type ImageCache, type Img } from "@/components/editor/render";
import { saveDraft } from "@/components/editor/storage";
import { IconUpload } from "@/components/ui/icons";

type Group = { key: string; label: string; on: boolean; items: GiftCandidate[] };
type Logo = { name: string; natW: number; natH: number; alpha: boolean; /** blob: (chưa tải lên) hoặc /uploads/… */ src: string; file?: Blob };
type Pick = { on: boolean; idx: number };
type Placement = "chest-left" | "center";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const AGREE_KEY = "yala-upload-agree"; // dùng chung cam kết với Studio
const STORE = "yala-giftset-v1";
const RENDER_PX = 640;

/** Logo đặt trên mặt in đầu tiên: áo -> ngực trái (người mặc) hoặc giữa ngực; đồ khác -> vừa 80% vùng in */
function logoLayer(area: PrintArea, logo: Logo, garment: boolean, place: Placement): ImageLayer {
  const ratio = logo.natW / logo.natH;
  let w: number;
  let h: number;
  let x: number;
  let y: number;
  if (garment && place === "chest-left") {
    // logo ngực ~9cm, nằm bên phải ảnh (bên trái người mặc), sát mép trên vùng in
    w = Math.min(90, area.widthMm * 0.3);
    h = w / ratio;
    if (h > 90) [h, w] = [90, 90 * ratio];
    x = area.widthMm * 0.74;
    y = area.heightMm * 0.06 + h / 2;
  } else if (garment) {
    w = Math.min(200, area.widthMm * 0.6);
    h = w / ratio;
    if (h > area.heightMm * 0.4) [h, w] = [area.heightMm * 0.4, area.heightMm * 0.4 * ratio];
    x = area.widthMm / 2;
    y = area.heightMm * 0.08 + h / 2;
  } else {
    const s = Math.min((area.widthMm * 0.8) / logo.natW, (area.heightMm * 0.8) / logo.natH);
    w = logo.natW * s;
    h = logo.natH * s;
    x = area.widthMm / 2;
    y = area.heightMm / 2;
  }
  return { id: "logo", type: "image", src: logo.src, natW: logo.natW, natH: logo.natH, x, y, w, h, rotation: 0, opacity: 1 };
}

/** Xoá nền trắng/gần trắng nối với mép ảnh (logo JPG nền trắng) – chạy trên máy, không gửi ảnh đi đâu */
async function removeWhiteBg(img: Img): Promise<Blob> {
  const { w, h } = imgSize(img);
  const c = createCanvas(w, h) as HTMLCanvasElement;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, w, h);
  const px = d.data;
  const white = (i: number) => px[i * 4]! > 232 && px[i * 4 + 1]! > 232 && px[i * 4 + 2]! > 232;
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (seen[i] || !white(i)) continue;
    seen[i] = 1;
    px[i * 4 + 3] = 0;
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < w * (h - 1)) stack.push(i + w);
  }
  ctx.putImageData(d, 0, 0);
  try {
    return await canvasToBlob(c, "image/png");
  } finally {
    c.width = c.height = 0;
  }
}

/**
 * "Một logo – cả bộ quà": tải logo 1 lần, xem trên nhiều sản phẩm thật (ảnh dựng ngay trên máy khách,
 * logo chỉ tải lên khi khách gửi báo giá hoặc mở Studio), tải ảnh cả bộ để trình duyệt, thêm cả bộ vào danh sách báo giá.
 */
export function GiftSetStudio({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const quote = useQuoteList();
  const [logo, setLogo] = useState<Logo | null>(null);
  const [picks, setPicks] = useState<Record<string, Pick>>(() => Object.fromEntries(groups.map((g) => [g.key, { on: g.on, idx: 0 }])));
  const [place, setPlace] = useState<Placement>("chest-left");
  const [details, setDetails] = useState<Record<string, ProductDetail | "none">>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [askAgree, setAskAgree] = useState(false);
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const images = useRef<ImageCache>(new Map());
  const inflight = useRef(new Set<string>());
  const restored = useRef(false);

  /* ---------- khôi phục lựa chọn + logo đã tải lên lần trước ---------- */
  useEffect(() => {
    try {
      setAgreed(localStorage.getItem(AGREE_KEY) === "1");
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const s = JSON.parse(raw) as { picks?: Record<string, Pick>; place?: Placement; logo?: Logo; qty?: string };
        if (s.picks) setPicks((p) => ({ ...p, ...Object.fromEntries(Object.entries(s.picks!).filter(([k]) => k in p)) }));
        if (s.place) setPlace(s.place);
        if (s.qty) setQty(s.qty);
        if (s.logo?.src.startsWith("/uploads/")) {
          const l = s.logo;
          void loadImage(assetUrl(l.src)).then((img) => {
            images.current.set(l.src, img);
            setLogo((cur) => cur ?? l);
          }, () => undefined);
        }
      }
    } catch {
      /* ignore */
    }
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    try {
      const keep = logo?.src.startsWith("/uploads/") ? { name: logo.name, natW: logo.natW, natH: logo.natH, alpha: logo.alpha, src: logo.src } : undefined;
      localStorage.setItem(STORE, JSON.stringify({ picks, place, qty, logo: keep }));
    } catch {
      /* ignore */
    }
  }, [picks, place, qty, logo]);

  const active = useMemo(
    () =>
      groups
        .filter((g) => picks[g.key]?.on)
        .map((g) => {
          const idx = Math.min(picks[g.key]!.idx, g.items.length - 1);
          return { group: g, idx, item: g.items[idx]! };
        }),
    [groups, picks],
  );
  const off = groups.filter((g) => !picks[g.key]?.on);

  /* ---------- tải chi tiết (vùng in) các mẫu đang chọn, tối đa 3 yêu cầu cùng lúc ---------- */
  useEffect(() => {
    const need = active.map((a) => a.item.slug).filter((s) => !details[s] && !inflight.current.has(s));
    for (const slug of need.slice(0, Math.max(0, 3 - inflight.current.size))) {
      inflight.current.add(slug);
      apiFetch<ProductDetail>(`/products/${encodeURIComponent(slug)}`)
        .then((p) => setDetails((d) => ({ ...d, [slug]: p.printAreas.length ? p : "none" })))
        .catch(() => setDetails((d) => ({ ...d, [slug]: "none" })))
        .finally(() => inflight.current.delete(slug));
    }
  }, [active, details]);

  // mẫu không có vùng in -> tự chuyển sang mẫu kế tiếp trong nhóm
  useEffect(() => {
    for (const a of active) {
      if (details[a.item.slug] !== "none") continue;
      const next = a.group.items.findIndex((it, i) => i > a.idx && details[it.slug] !== "none");
      setPicks((p) => ({ ...p, [a.group.key]: next > 0 ? { ...p[a.group.key]!, idx: next } : { on: false, idx: 0 } }));
    }
  }, [active, details]);

  /* ---------- dựng ảnh xem trước ngay trên máy ---------- */
  const keyOf = (slug: string) => `${slug}|${logo?.src ?? ""}|${place}`;
  useEffect(() => {
    let stop = false;
    void (async () => {
      for (const a of active) {
        const p = details[a.item.slug];
        const k = keyOf(a.item.slug);
        if (!p || p === "none" || previews[k]) continue;
        const area = p.printAreas[0]!;
        const surface = surfaceOfProduct(p);
        const ad: AreaDesign = { bg: null, layers: logo ? [logoLayer(area, logo, surface.garment, place)] : [] };
        try {
          const blob = await renderPreview(area, ad, images.current, await loadAreaAssets(area), RENDER_PX, { curve: surface.curved ? 0.6 : 0 });
          if (stop) return;
          const url = URL.createObjectURL(blob);
          setPreviews((v) => ({ ...v, [k]: url }));
        } catch {
          /* ảnh sản phẩm không tải được: thẻ hiện ảnh gốc */
        }
      }
    })();
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, details, logo, place, previews]);

  /* ---------- logo ---------- */
  async function takeFile(f?: File) {
    setErr("");
    if (!f) return;
    if (!ACCEPT.includes(f.type)) return setErr("Logo nhận ảnh PNG, JPG hoặc WEBP. File AI/PDF: xuất sang PNG hoặc gửi qua Zalo khi báo giá");
    if (f.size > UPLOAD_MAX_BYTES) return setErr(`Ảnh tối đa ${Math.round(UPLOAD_MAX_BYTES / 1024 / 1024)}MB`);
    const local = URL.createObjectURL(f);
    try {
      const img = await loadImage(local);
      const { w, h } = imgSize(img);
      if (w > UPLOAD_MAX_SIDE_PX || h > UPLOAD_MAX_SIDE_PX) return setErr(`Ảnh quá lớn (${w}×${h}px)`);
      images.current.set(local, img);
      setLogo({ name: f.name, natW: w, natH: h, alpha: hasTransparency(img), src: local, file: f });
    } catch {
      setErr("Không đọc được ảnh này");
    }
  }

  async function dropWhite() {
    if (!logo) return;
    const img = images.current.get(logo.src);
    if (!img) return;
    setBusy("Đang xoá nền trắng…");
    try {
      const blob = await removeWhiteBg(img);
      const local = URL.createObjectURL(blob);
      images.current.set(local, await loadImage(local));
      setLogo({ ...logo, src: local, file: blob, alpha: true, name: logo.name.replace(/\.\w+$/, "") + "-trong-suot.png" });
    } finally {
      setBusy("");
    }
  }

  /** Logo lên kho ảnh (chỉ khi cần gửi đi): trả đường dẫn /uploads/… */
  async function ensureUploaded(): Promise<string | null> {
    if (!logo) return null;
    if (logo.src.startsWith("/uploads/")) return logo.src;
    if (!logo.file) return null;
    setBusy("Đang tải logo lên…");
    try {
      const src = await uploadBlob(logo.file, logo.name, "design");
      images.current.set(src, images.current.get(logo.src)!);
      setLogo({ ...logo, src, file: undefined });
      return src;
    } catch (e) {
      setErr((e as Error).message);
      return null;
    } finally {
      setBusy("");
    }
  }

  function pickFile() {
    if (!agreed) return setAskAgree(true);
    fileRef.current?.click();
  }

  /* ---------- hành động ---------- */
  const ready = active.filter((a) => details[a.item.slug] && details[a.item.slug] !== "none");

  async function openStudio(slug: string) {
    const p = details[slug];
    if (!p || p === "none" || !logo) return;
    const src = await ensureUploaded();
    if (!src) return;
    const area = p.printAreas[0]!;
    const design = emptyDesign(p.id, p.printAreas.map((a) => a.key));
    design.areas[area.key] = { bg: null, layers: [logoLayer(area, { ...logo, src }, surfaceOfProduct(p).garment, place)] };
    saveDraft(p.id, design);
    router.push(`/thiet-ke/${p.slug}?back=${encodeURIComponent("/doanh-nghiep/bo-qua")}`);
  }

  async function addAll() {
    setErr("");
    const n = Math.floor(Number(qty));
    if (!n || n < 1) return setErr("Nhập số lượng dự kiến mỗi món (ước lượng cũng được, sửa lại ở bước sau)");
    if (!ready.length) return setErr("Chưa có sản phẩm nào trong bộ");
    const src = logo ? await ensureUploaded() : null;
    if (logo && !src) return;
    const link = src ? new URL(assetUrl(src), window.location.origin).href : "";
    for (const a of ready) {
      const p = details[a.item.slug] as ProductDetail;
      const where = surfaceOfProduct(p).garment ? (place === "chest-left" ? "logo ngực trái" : "logo giữa ngực") : "";
      const note = [src ? `Logo: ${link}` : "", where].filter(Boolean).join(" · ").slice(0, 300);
      quote.add({ productId: a.item.id, slug: a.item.slug, name: a.item.name, image: a.item.image, priceLabel: a.item.priceLabel, quantity: n, note });
    }
    router.push("/doanh-nghiep/bao-gia");
  }

  /** Ảnh cả bộ (lưới) để gửi sếp / nhóm duyệt */
  async function downloadSheet() {
    const cells = ready.map((a) => ({ name: a.item.name, url: previews[keyOf(a.item.slug)] })).filter((c): c is { name: string; url: string } => !!c.url);
    if (!cells.length) return;
    setBusy("Đang ghép ảnh cả bộ…");
    try {
      const cols = cells.length <= 4 ? 2 : 3;
      const cell = 600;
      const gap = 24;
      const label = 56;
      const head = 110;
      const W = cols * cell + (cols + 1) * gap;
      const rows = Math.ceil(cells.length / cols);
      const H = head + rows * (cell + label + gap) + 70;
      const c = createCanvas(W, H) as HTMLCanvasElement;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#111111";
      ctx.font = "700 40px 'Be Vietnam Pro', system-ui, sans-serif";
      ctx.fillText("Bộ quà in logo", gap, 66);
      ctx.fillStyle = "#E4570B";
      ctx.fillRect(gap, 84, 64, 5);
      for (const [i, it] of cells.entries()) {
        const img = await loadImage(it.url);
        const x = gap + (i % cols) * (cell + gap);
        const y = head + Math.floor(i / cols) * (cell + label + gap);
        ctx.drawImage(img, x, y, cell, cell);
        ctx.fillStyle = "#111111";
        ctx.font = "500 22px 'Be Vietnam Pro', system-ui, sans-serif";
        let t = it.name;
        while (ctx.measureText(t).width > cell && t.length > 4) t = t.slice(0, -2);
        ctx.fillText(t === it.name ? t : `${t.trimEnd()}…`, x, y + cell + 34);
      }
      ctx.fillStyle = "#6b6b6b";
      ctx.font = "400 20px 'Be Vietnam Pro', system-ui, sans-serif";
      ctx.fillText("Ảnh xem trước – màu, kích thước và vị trí in xác nhận khi YALA gửi báo giá · yala.vn", gap, H - 28);
      const blob = await canvasToBlob(c, "image/jpeg", 0.9);
      c.width = c.height = 0;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "bo-qua-in-logo-yala.jpg";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } finally {
      setBusy("");
    }
  }

  const hasGarment = ready.some((a) => surfaceOfProduct(details[a.item.slug] as ProductDetail).garment);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start lg:gap-10">
      {/* ---------- bảng điều khiển: máy tính dính cột trái; điện thoại tách đôi (logo trên, gửi báo giá dưới bộ quà) ---------- */}
      <aside className="contents lg:sticky lg:top-28 lg:block lg:space-y-5">
        <section className="order-1 rounded-3xl bg-surface p-5">
          <h2 className="text-lg font-semibold">1. Logo của bạn</h2>
          <button
            type="button"
            onClick={pickFile}
            className="mt-3 flex w-full items-center gap-3 rounded-xl border border-dashed border-ink/30 bg-white p-3 text-left text-[15px] transition hover:border-ink"
          >
            {logo ? (
              <>
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-line bg-[repeating-conic-gradient(#f1efec_0_25%,#fff_0_50%)] bg-[length:12px_12px]">
                  <img src={logo.src.startsWith("/uploads/") ? assetUrl(logo.src) : logo.src} alt="" className="max-h-12 max-w-12 object-contain" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{logo.name}</span>
                  <span className="text-sm text-muted">Bấm để đổi logo khác</span>
                </span>
              </>
            ) : (
              <>
                <IconUpload className="h-6 w-6 shrink-0 text-ink/60" />
                <span>
                  Tải logo lên
                  <span className="block text-sm text-muted">PNG nền trong suốt đẹp nhất · JPG, WEBP</span>
                </span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept={ACCEPT.join(",")} className="hidden" onChange={(e) => void takeFile(e.target.files?.[0]).finally(() => fileRef.current && (fileRef.current.value = ""))} />
          {askAgree && !agreed && (
            <div className="mt-3 rounded-xl border border-ink/15 bg-white p-3 text-[13px] leading-relaxed">
              Tôi có quyền sử dụng logo tải lên; không vi phạm bản quyền, nhãn hiệu của người khác. Đơn vi phạm sẽ bị từ chối in.
              <button
                type="button"
                className="btn-primary mt-2 w-full py-2 text-[14px]"
                onClick={() => {
                  setAgreed(true);
                  setAskAgree(false);
                  try {
                    localStorage.setItem(AGREE_KEY, "1");
                  } catch {
                    /* ignore */
                  }
                  fileRef.current?.click();
                }}
              >
                Tôi đồng ý – chọn logo
              </button>
            </div>
          )}
          {logo && !logo.alpha && (
            <p className="mt-3 text-[13px] text-muted">
              Logo đang có nền.{" "}
              <button type="button" onClick={() => void dropWhite()} className="font-semibold text-ink underline underline-offset-4">
                Xoá nền trắng
              </button>{" "}
              để logo nằm trên sản phẩm như in thật.
            </p>
          )}
          {hasGarment && (
            <div className="mt-4">
              <p className="label">Vị trí logo trên áo</p>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-white p-1" role="radiogroup" aria-label="Vị trí logo trên áo">
                {(
                  [
                    ["chest-left", "Ngực trái"],
                    ["center", "Giữa ngực"],
                  ] as const
                ).map(([k, t]) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={place === k}
                    onClick={() => setPlace(k)}
                    className={`rounded-lg py-2 text-[14px] font-semibold transition ${place === k ? "bg-ink text-white" : "hover:bg-surface"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="order-3 rounded-3xl bg-surface p-5">
          <h2 className="text-lg font-semibold">2. Gửi cả bộ để báo giá</h2>
          <label className="mt-3 block">
            <span className="label">Số lượng dự kiến mỗi món</span>
            <input className="input" type="number" inputMode="numeric" min={1} placeholder="VD 100" value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
          <button type="button" className="btn-primary mt-3 w-full py-3" disabled={!!busy || !ready.length} onClick={() => void addAll()}>
            Thêm {ready.length} món vào báo giá
          </button>
          <button type="button" className="btn-outline mt-2 w-full" disabled={!!busy || !logo || !ready.length} onClick={() => void downloadSheet()}>
            Tải ảnh cả bộ để trình duyệt
          </button>
          <p className="mt-2 text-[13px] text-muted">Sửa số lượng từng món, thêm ghi chú ở bước sau. Mockup chính thức YALA gửi kèm báo giá, miễn phí.</p>
          {busy && <p className="mt-2 text-[13px] font-medium" role="status">{busy}</p>}
          {err && <p className="mt-2 text-[13px] text-sale">{err}</p>}
          {quote.ready && quote.count > 0 && (
            <Link href="/doanh-nghiep/bao-gia" className="mt-3 block text-[13px] font-semibold underline underline-offset-4">
              Danh sách báo giá đang có {quote.count} sản phẩm – xem
            </Link>
          )}
        </section>
      </aside>

      {/* ---------- cả bộ ---------- */}
      <section aria-label="Bộ quà" className="order-2">
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-5 md:gap-y-8">
          {active.map(({ group, idx, item }) => {
            const url = previews[keyOf(item.slug)];
            const total = group.items.length;
            const go = (d: number) => setPicks((p) => ({ ...p, [group.key]: { on: true, idx: (idx + d + total) % total } }));
            return (
              <li key={group.key} className="min-w-0">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-line">
                  {url ? (
                    <img src={url} alt={`${item.name}${logo ? " in logo" : ""}`} className="h-full w-full object-contain" />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-surface" />
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-semibold shadow-sm">{group.label}</span>
                  <button
                    type="button"
                    onClick={() => setPicks((p) => ({ ...p, [group.key]: { ...p[group.key]!, on: false } }))}
                    className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-[18px] leading-none shadow-sm hover:bg-ink hover:text-white"
                    aria-label={`Bỏ ${group.label} khỏi bộ`}
                  >
                    ×
                  </button>
                </div>
                <p className="mt-2 line-clamp-2 min-h-[2.6em] text-[14px] font-medium leading-snug">{item.name}</p>
                <p className="text-[13px] text-muted">{item.priceLabel}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {total > 1 && (
                    <div className="flex items-center rounded-lg bg-surface">
                      <button type="button" onClick={() => go(-1)} className="h-9 w-9 text-[18px] hover:text-brand-dark" aria-label={`Mẫu ${group.label} trước`}>
                        ‹
                      </button>
                      <span className="min-w-[2.6em] text-center text-[12px] tabular-nums text-muted">
                        {idx + 1}/{total}
                      </span>
                      <button type="button" onClick={() => go(1)} className="h-9 w-9 text-[18px] hover:text-brand-dark" aria-label={`Mẫu ${group.label} tiếp theo`}>
                        ›
                      </button>
                    </div>
                  )}
                  {logo && details[item.slug] && details[item.slug] !== "none" && (
                    <button type="button" onClick={() => void openStudio(item.slug)} disabled={!!busy} className="h-9 whitespace-nowrap text-[13px] font-semibold underline underline-offset-4 hover:text-brand-dark">
                      Chỉnh chi tiết
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {off.length > 0 && (
          <div className="mt-8">
            <p className="text-[15px] font-semibold">Thêm món vào bộ</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {off.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setPicks((p) => ({ ...p, [g.key]: { on: true, idx: p[g.key]?.idx ?? 0 } }))}
                  className="rounded-full border border-line bg-white px-3.5 py-2 text-[14px] font-medium transition hover:border-ink"
                >
                  + {g.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
