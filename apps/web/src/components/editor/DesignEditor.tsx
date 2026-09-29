"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  areaExtraPrice,
  DESIGN_FONTS,
  DESIGN_LIMITS,
  dpiLevel,
  effectiveDpi,
  emptyDesign,
  formatVND,
  UPLOAD_MAX_BYTES,
  usedAreas,
  type AreaDesign,
  type DesignJson,
  type DesignLayer,
  type ImageLayer,
  type TextLayer,
} from "@pod/shared";
import type { PrintArea, ProductDetail } from "@/lib/types";
import { IconClose, IconCopy, IconImage, IconLayers, IconPalette, IconRedo, IconSave, IconText, IconTrash, IconUndo, IconUpload } from "../ui/icons";
import { Stage } from "./Stage";
import { imgSize, loadImage, measureText, type ImageCache, type MockupAssets } from "./render";
import { ensureFonts, GOOGLE_FONTS_HREF } from "./fonts";
import { exportDesign, loadAreaAssets, renderPreview, uploadBlob } from "./export";
import { attachDesign, clearDraft, loadDraft, saveDraft, stashSellerDesign } from "./storage";

type Props = {
  product: ProductDetail;
  mode: "customer" | "seller";
  initial?: DesignJson | null;
  savedId?: string | null;
  savedName?: string;
  templateId?: string | null;
  returnTo: string;
};

type Tool = "upload" | "text" | "bg" | "layers";
type Upload = { src: string; natW: number; natH: number; name: string };

const SWATCHES = ["#1d1d1f", "#ffffff", "#e11d48", "#f97316", "#facc15", "#16a34a", "#0ea5e9", "#1c4d99", "#7c3aed", "#ec4899", "#a16207", "#6b7280"];
const uid = () => `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Bổ sung mặt in còn thiếu (sản phẩm có thêm mặt sau khi lưu thiết kế) và bỏ mặt không còn */
function normalize(design: DesignJson | null | undefined, product: ProductDetail): DesignJson {
  const base = emptyDesign(product.id, product.printAreas.map((a) => a.key));
  if (!design || design.productId !== product.id) return base;
  for (const k of Object.keys(base.areas)) if (design.areas[k]) base.areas[k] = design.areas[k]!;
  return base;
}

export function DesignEditor({ product, mode, initial, savedId, savedName, templateId, returnTo }: Props) {
  const router = useRouter();
  const areas = product.printAreas;
  const [design, setDesign] = useState<DesignJson>(() => normalize(initial, product));
  const [past, setPast] = useState<DesignJson[]>([]);
  const [future, setFuture] = useState<DesignJson[]>([]);
  const dragSnap = useRef<DesignJson | null>(null);
  const [areaKey, setAreaKey] = useState(areas[0]?.key ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("upload");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lowDpi, setLowDpi] = useState<string[] | null>(null);
  const [saveDlg, setSaveDlg] = useState<{ name: string; needLogin?: boolean } | null>(null);
  const images = useRef<ImageCache>(new Map()).current;
  const [assets, setAssets] = useState<Record<string, MockupAssets>>({});
  const [version, setVersion] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const area = areas.find((a) => a.key === areaKey) ?? areas[0]!;
  const ad: AreaDesign = design.areas[area.key] ?? { bg: null, layers: [] };
  const selected = ad.layers.find((l) => l.id === selectedId) ?? null;

  /* ---------- khôi phục bản nháp ---------- */
  useEffect(() => {
    if (initial) return;
    const d = loadDraft(product.id);
    if (d && usedAreas(d.design).length) {
      apply(normalize(d.design, product), false);
      setNotice("Đã mở lại bản nháp gần nhất của bạn.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // tự lưu nháp
  useEffect(() => {
    const t = setTimeout(() => saveDraft(product.id, design), 600);
    return () => clearTimeout(t);
  }, [design, product.id]);

  /* ---------- tải ảnh lớp, ảnh mockup, font ---------- */
  useEffect(() => {
    const srcs = Object.values(design.areas).flatMap((a) => a.layers.filter((l): l is ImageLayer => l.type === "image").map((l) => l.src));
    const missing = [...new Set(srcs)].filter((s) => !images.has(s));
    if (!missing.length) return;
    Promise.all(missing.map((s) => loadImage(s).then((img) => images.set(s, img)).catch(() => undefined))).then(() => setVersion((v) => v + 1));
  }, [design, images]);

  useEffect(() => {
    if (assets[area.key]) return;
    loadAreaAssets(area).then((a) => setAssets((p) => ({ ...p, [area.key]: a })));
  }, [area, assets]);

  useEffect(() => {
    const layers = Object.values(design.areas).flatMap((a) => a.layers);
    ensureFonts(layers).then(() => setVersion((v) => v + 1));
  }, [design]);

  useEffect(() => {
    document.fonts?.ready.then(() => setVersion((v) => v + 1));
  }, []);

  /* ---------- lịch sử (undo/redo) ----------
   designRef luôn giữ bản mới nhất -> nhiều thao tác liên tiếp (VD tải 3 ảnh) không đè nhau */
  const designRef = useRef(design);
  const apply = useCallback((next: DesignJson, record: boolean) => {
    const cur = designRef.current;
    designRef.current = next;
    setDesign(next);
    if (record) {
      setPast((p) => [...p.slice(-59), cur]);
      setFuture([]);
    }
  }, []);

  const updateArea = useCallback(
    (fn: (a: AreaDesign) => AreaDesign) => {
      const cur = designRef.current;
      apply({ ...cur, areas: { ...cur.areas, [area.key]: fn(cur.areas[area.key] ?? { bg: null, layers: [] }) } }, true);
    },
    [apply, area.key],
  );

  const patchLayer = useCallback(
    (id: string, patch: Partial<DesignLayer>, isCommit: boolean) => {
      const cur = designRef.current;
      if (!isCommit && !dragSnap.current) dragSnap.current = cur;
      const a = cur.areas[area.key]!;
      apply({ ...cur, areas: { ...cur.areas, [area.key]: { ...a, layers: a.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as DesignLayer) : l)) } } }, isCommit);
    },
    [apply, area.key],
  );

  const endDrag = useCallback(() => {
    const snap = dragSnap.current;
    if (!snap) return;
    dragSnap.current = null;
    setPast((p) => [...p.slice(-59), snap]);
    setFuture([]);
  }, []);

  const undo = () => {
    const prev = past[past.length - 1];
    if (!prev) return;
    setPast(past.slice(0, -1));
    setFuture([designRef.current, ...future].slice(0, 60));
    designRef.current = prev;
    setDesign(prev);
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setFuture(future.slice(1));
    setPast([...past.slice(-59), designRef.current]);
    designRef.current = next;
    setDesign(next);
  };

  /* ---------- thao tác lớp ---------- */
  function addLayer(l: DesignLayer) {
    if ((designRef.current.areas[area.key]?.layers.length ?? 0) >= DESIGN_LIMITS.layersPerArea) return setError(`Tối đa ${DESIGN_LIMITS.layersPerArea} lớp mỗi mặt`);
    updateArea((a) => ({ ...a, layers: [...a.layers, l] }));
    setSelectedId(l.id);
  }

  function imageLayer(u: Upload, a: PrintArea = area): ImageLayer {
    const s = Math.min((a.widthMm * 0.8) / u.natW, (a.heightMm * 0.8) / u.natH);
    return { id: uid(), type: "image", src: u.src, natW: u.natW, natH: u.natH, x: a.widthMm / 2, y: a.heightMm / 2, w: u.natW * s, h: u.natH * s, rotation: 0, opacity: 1 };
  }

  async function onFiles(files: FileList | null) {
    setError("");
    const list = Array.from(files ?? []).slice(0, 5);
    for (const f of list) {
      if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
        setError("Chỉ nhận ảnh PNG, JPG hoặc WEBP");
        continue;
      }
      if (f.size > UPLOAD_MAX_BYTES) {
        setError("Ảnh tối đa 15MB");
        continue;
      }
      setBusy(`Đang tải "${f.name}"…`);
      try {
        const local = URL.createObjectURL(f);
        const img = await loadImage(local);
        const { w, h } = imgSize(img);
        const src = await uploadBlob(f, f.name, "design");
        images.set(src, img);
        const u = { src, natW: w, natH: h, name: f.name };
        setUploads((p) => [u, ...p.filter((x) => x.src !== src)]);
        addLayer(imageLayer(u));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy("");
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function addText() {
    const fontSize = Math.max(6, Math.min(40, Math.round(area.heightMm * 0.1)));
    const base: TextLayer = { id: uid(), type: "text", text: "Nội dung của bạn", font: "Be Vietnam Pro", fontSize, color: ad.bg === "#1d1d1f" ? "#ffffff" : "#1d1d1f", bold: true, italic: false, align: "center", lineHeight: 1.15, x: area.widthMm / 2, y: area.heightMm / 2, w: 10, h: 10, rotation: 0, opacity: 1 };
    addLayer({ ...base, ...measureText(base) });
    setTool("text");
  }

  const patchSelected = (patch: Partial<DesignLayer>) => {
    if (!selected) return;
    let p = patch;
    if (selected.type === "text" && ("text" in patch || "font" in patch || "fontSize" in patch || "bold" in patch || "italic" in patch || "lineHeight" in patch || "stroke" in patch)) {
      p = { ...patch, ...measureText({ ...selected, ...(patch as Partial<TextLayer>) }) };
    }
    patchLayer(selected.id, p, true);
  };

  function removeSelected() {
    if (!selected) return;
    updateArea((a) => ({ ...a, layers: a.layers.filter((l) => l.id !== selected.id) }));
    setSelectedId(null);
  }

  function duplicateSelected() {
    if (!selected) return;
    addLayer({ ...selected, id: uid(), x: selected.x + 5, y: selected.y + 5 });
  }

  function moveOrder(dir: -1 | 1) {
    if (!selected) return;
    updateArea((a) => {
      const i = a.layers.findIndex((l) => l.id === selected.id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= a.layers.length) return a;
      const layers = [...a.layers];
      [layers[i], layers[j]] = [layers[j]!, layers[i]!];
      return { ...a, layers };
    });
  }

  function fitImage(kind: "fill" | "fit") {
    if (!selected || selected.type !== "image") return;
    const f = kind === "fill" ? Math.max(area.widthMm / selected.natW, area.heightMm / selected.natH) : Math.min(area.widthMm / selected.natW, area.heightMm / selected.natH);
    patchSelected({ w: selected.natW * f, h: selected.natH * f, x: area.widthMm / 2, y: area.heightMm / 2, rotation: 0, tile: false });
  }

  function toggleTile() {
    if (!selected || selected.type !== "image") return;
    if (selected.tile) return patchSelected({ tile: false });
    const cell = Math.min(area.widthMm, area.heightMm) / 4;
    const f = cell / Math.max(selected.natW, selected.natH);
    patchSelected({ tile: true, w: selected.natW * f, h: selected.natH * f, x: area.widthMm / 2, y: area.heightMm / 2 });
  }

  /* ---------- phím tắt ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        return e.shiftKey ? redo() : undo();
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        return redo();
      }
      if (!selected) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSelected();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        patchLayer(selected.id, { x: selected.x + dx, y: selected.y + dy }, true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ---------- giá phụ phí mặt in ---------- */
  const used = usedAreas(design);
  const extras = areaExtraPrice(areas, used);

  /* ---------- hoàn tất: xuất file in ---------- */
  function lowDpiLayers(): string[] {
    const out: string[] = [];
    for (const a of areas) {
      for (const l of design.areas[a.key]?.layers ?? []) {
        if (l.type !== "image" || l.tile) continue;
        const d = effectiveDpi(l);
        if (dpiLevel(d, a.dpi) === "low") out.push(`${a.name}: ảnh chỉ đạt ${d} DPI (khuyến nghị ${a.dpi})`);
      }
    }
    return out;
  }

  async function finish(force = false) {
    setError("");
    if (!used.length) return setError("Thiết kế đang trống – thêm ảnh hoặc chữ trước khi hoàn tất");
    const low = force ? [] : lowDpiLayers();
    if (low.length) return setLowDpi(low);
    setLowDpi(null);
    try {
      const out = await exportDesign(areas, design, images, setBusy);
      if (mode === "seller") {
        stashSellerDesign(product.id, out);
        router.push(`/seller/mau/moi?product=${product.id}${templateId ? `&id=${templateId}` : ""}`);
      } else {
        attachDesign(product.id, out);
        clearDraft(product.id);
        router.push(returnTo);
      }
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
    }
  }

  /* ---------- lưu vào tài khoản ---------- */
  async function saveToAccount(name: string) {
    setError("");
    try {
      setBusy("Đang lưu thiết kế…");
      const me = await fetch("/api/account/me");
      if (me.status === 401) {
        setBusy("");
        return setSaveDlg({ name, needLogin: true });
      }
      let previewUrl = "";
      const first = used[0];
      const a = areas.find((x) => x.key === first);
      if (a) {
        await ensureFonts(design.areas[a.key]!.layers);
        const blob = await renderPreview(a, design.areas[a.key]!, images, assets[a.key] ?? (await loadAreaAssets(a)), 600);
        previewUrl = await uploadBlob(blob, "saved-preview.jpg", "design");
      }
      const body = JSON.stringify({ productId: product.id, name, json: design, previewUrl });
      const res = await fetch(savedId ? `/api/account/designs/${savedId}` : "/api/account/designs", { method: savedId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body });
      const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok) throw new Error(data.error ?? "Lưu thất bại");
      setSaveDlg(null);
      setNotice("✓ Đã lưu vào Tài khoản → Thiết kế của tôi");
      if (!savedId && data.id) router.replace(`?saved=${data.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  const layerLabel = (l: DesignLayer) => (l.type === "text" ? `Chữ: ${l.text.slice(0, 18)}` : l.tile ? "Ảnh lặp họa tiết" : "Ảnh");

  /* ---------- giao diện ---------- */
  const toolBtn = (t: Tool, label: string, Icon: typeof IconText, onClick?: () => void) => (
    <button
      type="button"
      onClick={onClick ?? (() => setTool(t))}
      className={`flex min-w-[64px] flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-bold lg:flex-none ${tool === t ? "bg-brand text-ink" : "text-ink/70 hover:bg-cream"}`}
      aria-pressed={tool === t}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 lg:pb-8">
      <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
      {/* Thanh trên */}
      <div className="sticky top-0 z-30 border-b border-ink/10 bg-white">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-2 px-3 md:px-5">
          <Link href={returnTo} className="rounded-md p-1.5 hover:bg-cream" aria-label="Quay lại">
            <IconClose className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold md:text-base">{product.name}</p>
            <p className="text-[11px] text-ink/60">{mode === "seller" ? "Thiết kế mẫu seller" : "Công cụ thiết kế"} · tự lưu nháp</p>
          </div>
          <button type="button" onClick={undo} disabled={!past.length} className="rounded-md p-2 disabled:opacity-30 hover:bg-cream" aria-label="Hoàn tác">
            <IconUndo className="h-5 w-5" />
          </button>
          <button type="button" onClick={redo} disabled={!future.length} className="rounded-md p-2 disabled:opacity-30 hover:bg-cream" aria-label="Làm lại">
            <IconRedo className="h-5 w-5" />
          </button>
          {mode === "customer" && (
            <button type="button" onClick={() => setSaveDlg({ name: savedName || product.name })} className="hidden items-center gap-1 rounded-md border-2 border-ink/15 px-3 py-1.5 text-sm font-bold hover:border-ink sm:flex">
              <IconSave className="h-4 w-4" /> Lưu
            </button>
          )}
          <button type="button" onClick={() => finish()} disabled={!!busy} className="btn hidden border-ink bg-brand px-4 py-2 text-sm text-ink disabled:opacity-60 lg:inline-flex">
            Hoàn tất
          </button>
        </div>
        {/* Tab mặt in */}
        {areas.length > 1 && (
          <div className="no-scrollbar mx-auto flex max-w-[1320px] gap-1 overflow-x-auto px-3 pb-2 md:px-5">
            {areas.map((a) => {
              const has = !!design.areas[a.key] && (design.areas[a.key]!.layers.length > 0 || !!design.areas[a.key]!.bg);
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => {
                    setAreaKey(a.key);
                    setSelectedId(null);
                  }}
                  className={`shrink-0 whitespace-nowrap rounded-full border-2 px-3 py-1 text-xs font-bold ${a.key === area.key ? "border-ink bg-ink text-white" : "border-ink/15 bg-white"}`}
                >
                  {has && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500 align-middle" />}
                  {a.name}
                  {a.extraPrice > 0 && <span className="ml-1 opacity-70">+{formatVND(a.extraPrice)}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {notice && (
        <div className="mx-auto mt-3 flex max-w-[1320px] items-center justify-between gap-2 px-3 text-sm md:px-5">
          <p className="flex-1 rounded-lg bg-green-50 px-3 py-2 text-green-800">
            {notice}{" "}
            {notice.startsWith("Đã mở lại") && (
              <button
                type="button"
                className="ml-1 font-bold underline"
                onClick={() => {
                  apply(normalize(null, product), true);
                  clearDraft(product.id);
                  setNotice("");
                }}
              >
                Bắt đầu lại
              </button>
            )}
          </p>
          <button type="button" onClick={() => setNotice("")} aria-label="Đóng" className="p-1">
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mx-auto grid max-w-[1320px] gap-4 px-3 pt-3 md:px-5 lg:grid-cols-[88px_minmax(0,1fr)_340px] lg:pt-5">
        {/* Công cụ (desktop: cột trái, mobile: dưới khung) */}
        <nav className="order-2 flex gap-1 rounded-xl border border-ink/10 bg-white p-1 lg:order-1 lg:h-fit lg:flex-col" aria-label="Công cụ">
          {toolBtn("upload", "Tải ảnh", IconUpload)}
          {toolBtn("text", "Chữ", IconText, () => (selected?.type === "text" ? setTool("text") : addText()))}
          {toolBtn("bg", "Màu nền", IconPalette)}
          {toolBtn("layers", `Lớp (${ad.layers.length})`, IconLayers)}
        </nav>

        <div className="order-1 mx-auto w-full max-w-[640px] lg:order-2">
          <Stage
            area={area}
            design={ad}
            assets={assets[area.key] ?? {}}
            images={images}
            version={version}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              const l = ad.layers.find((x) => x.id === id);
              if (l) setTool(l.type === "text" ? "text" : "upload");
            }}
            onChangeLayer={patchLayer}
            onCommit={endDrag}
          />
          <p className="mt-2 text-center text-[11px] text-ink/55">Kéo để di chuyển · kéo ô vuông ở góc để đổi cỡ · kéo nút tròn để xoay · phím Delete để xoá</p>
        </div>

        {/* Bảng thuộc tính */}
        <aside className="order-3 space-y-3 rounded-xl border border-ink/10 bg-white p-4 lg:h-fit">
          {tool === "upload" && (
            <section className="space-y-3">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={!!busy} className="btn w-full border-dashed border-ink/40 bg-cream py-3 text-sm">
                <IconUpload className="h-5 w-5" /> Tải ảnh lên (PNG, JPG, WEBP)
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => void onFiles(e.target.files)} />
              <p className="text-[11px] text-ink/60">
                Logo nên dùng PNG nền trong suốt. Mặt này in tốt nhất với ảnh ≥ {area.dpi} DPI ở kích thước thật ({area.widthMm / 10}×{area.heightMm / 10} cm ≈{" "}
                {Math.round((area.widthMm / 25.4) * area.dpi)}×{Math.round((area.heightMm / 25.4) * area.dpi)} px).
              </p>
              {uploads.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-bold text-ink/70">Ảnh đã tải (bấm để thêm lại)</p>
                  <ul className="grid grid-cols-4 gap-1.5">
                    {uploads.map((u) => (
                      <li key={u.src}>
                        <button type="button" onClick={() => addLayer(imageLayer(u))} className="block aspect-square w-full overflow-hidden rounded border border-ink/15 bg-[#f4f4f5]" title={u.name}>
                          <img src={u.src} alt={u.name} className="h-full w-full object-contain" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selected?.type === "image" && (
                <div className="space-y-2 border-t border-ink/10 pt-3">
                  <p className="text-xs font-bold text-ink/70">Ảnh đang chọn</p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                    <button type="button" className="btn-sm" onClick={() => fitImage("fill")}>
                      Phủ kín vùng in
                    </button>
                    <button type="button" className="btn-sm" onClick={() => fitImage("fit")}>
                      Vừa khít
                    </button>
                    <button type="button" className="btn-sm" onClick={() => patchSelected({ x: area.widthMm / 2, y: area.heightMm / 2 })}>
                      Căn giữa
                    </button>
                    <button type="button" className={`btn-sm ${selected.tile ? "!border-ink !bg-brand" : ""}`} onClick={toggleTile}>
                      {selected.tile ? "✓ Lặp họa tiết" : "Lặp họa tiết"}
                    </button>
                    <button type="button" className="btn-sm" onClick={() => patchSelected({ flipX: !selected.flipX })}>
                      Lật ngang
                    </button>
                    <button type="button" className="btn-sm" onClick={() => patchSelected({ rotation: 0 })}>
                      Bỏ xoay
                    </button>
                  </div>
                  {selected.tile && (
                    <label className="block text-xs font-semibold">
                      Cỡ ô lặp: {Math.round(Math.max(selected.w, selected.h))} mm
                      <input
                        type="range"
                        min={10}
                        max={Math.round(Math.min(area.widthMm, area.heightMm))}
                        value={Math.round(Math.max(selected.w, selected.h))}
                        onChange={(e) => {
                          const f = Number(e.target.value) / Math.max(selected.w, selected.h);
                          patchLayer(selected.id, { w: selected.w * f, h: selected.h * f }, false);
                        }}
                        onPointerUp={endDrag}
                        className="w-full accent-[#F08A00]"
                      />
                    </label>
                  )}
                  <label className="block text-xs font-semibold">
                    Độ đậm: {Math.round((selected.opacity ?? 1) * 100)}%
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={Math.round((selected.opacity ?? 1) * 100)}
                      onChange={(e) => patchLayer(selected.id, { opacity: Number(e.target.value) / 100 }, false)}
                      onPointerUp={endDrag}
                      className="w-full accent-[#F08A00]"
                    />
                  </label>
                  <p className="text-[11px] text-ink/60">
                    Kích thước in: {(selected.w / 10).toFixed(1)} × {(selected.h / 10).toFixed(1)} cm
                  </p>
                </div>
              )}
            </section>
          )}

          {tool === "text" && (
            <section className="space-y-3">
              <button type="button" onClick={addText} className="btn w-full border-ink bg-cream py-2.5 text-sm">
                <IconText className="h-5 w-5" /> Thêm chữ mới
              </button>
              {selected?.type === "text" ? (
                <div className="space-y-2.5">
                  <textarea
                    value={selected.text}
                    maxLength={DESIGN_LIMITS.textLength}
                    rows={3}
                    onChange={(e) => e.target.value && patchSelected({ text: e.target.value })}
                    className="w-full rounded-md border-2 border-ink/15 px-3 py-2 text-sm focus:border-ink focus:outline-none"
                    aria-label="Nội dung chữ"
                  />
                  <select
                    value={selected.font}
                    onChange={(e) => patchSelected({ font: e.target.value as TextLayer["font"] })}
                    className="w-full rounded-md border-2 border-ink/15 px-3 py-2 text-sm"
                    style={{ fontFamily: `"${selected.font}"` }}
                    aria-label="Font chữ"
                  >
                    {DESIGN_FONTS.map((f) => (
                      <option key={f.family} value={f.family} style={{ fontFamily: `"${f.family}"` }}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <label className="block text-xs font-semibold">
                    Cỡ chữ: {selected.fontSize} mm
                    <input
                      type="range"
                      min={3}
                      max={Math.max(20, Math.round(area.heightMm * 0.6))}
                      step={0.5}
                      value={selected.fontSize}
                      onChange={(e) => {
                        const fontSize = Number(e.target.value);
                        patchLayer(selected.id, { fontSize, ...measureText({ ...selected, fontSize }) } as Partial<DesignLayer>, false);
                      }}
                      onPointerUp={endDrag}
                      className="w-full accent-[#F08A00]"
                    />
                  </label>
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Màu chữ">
                    {SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => patchSelected({ color: c })}
                        className={`h-7 w-7 rounded-full border-2 ${selected.color === c ? "border-ink ring-2 ring-brand" : "border-ink/20"}`}
                        style={{ background: c }}
                        aria-label={`Màu ${c}`}
                      />
                    ))}
                    <input type="color" value={selected.color} onChange={(e) => patchSelected({ color: e.target.value })} className="h-7 w-9 cursor-pointer rounded border border-ink/20" aria-label="Chọn màu khác" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                    <button type="button" className={`btn-sm ${selected.bold ? "!border-ink !bg-brand" : ""}`} onClick={() => patchSelected({ bold: !selected.bold })}>
                      Đậm
                    </button>
                    <button type="button" className={`btn-sm italic ${selected.italic ? "!border-ink !bg-brand" : ""}`} onClick={() => patchSelected({ italic: !selected.italic })}>
                      Nghiêng
                    </button>
                    {(["left", "center", "right"] as const).map((a) => (
                      <button key={a} type="button" className={`btn-sm ${selected.align === a ? "!border-ink !bg-brand" : ""}`} onClick={() => patchSelected({ align: a })}>
                        {a === "left" ? "Trái" : a === "center" ? "Giữa" : "Phải"}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="shrink-0">Viền chữ</span>
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={0.1}
                      value={selected.stroke?.width ?? 0}
                      onChange={(e) => {
                        const width = Number(e.target.value);
                        patchSelected({ stroke: width > 0 ? { color: selected.stroke?.color ?? "#ffffff", width } : undefined });
                      }}
                      className="w-full accent-[#F08A00]"
                      aria-label="Độ dày viền chữ"
                    />
                    <input
                      type="color"
                      value={selected.stroke?.color ?? "#ffffff"}
                      onChange={(e) => patchSelected({ stroke: { color: e.target.value, width: selected.stroke?.width || 0.5 } })}
                      className="h-7 w-9 cursor-pointer rounded border border-ink/20"
                      aria-label="Màu viền"
                    />
                  </div>
                  <button type="button" className="btn-sm w-full text-xs" onClick={() => patchSelected({ x: area.widthMm / 2, y: area.heightMm / 2 })}>
                    Căn giữa vùng in
                  </button>
                </div>
              ) : (
                <p className="text-xs text-ink/60">Bấm vào chữ trên khung để sửa, hoặc thêm chữ mới. Font hỗ trợ đầy đủ dấu tiếng Việt.</p>
              )}
            </section>
          )}

          {tool === "bg" && (
            <section className="space-y-2">
              <p className="text-xs font-bold text-ink/70">Màu nền cả mặt in {area.maskImage ? "(phủ toàn thân áo)" : ""}</p>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => updateArea((a) => ({ ...a, bg: null }))} className={`h-8 rounded-full border-2 px-3 text-xs font-bold ${!ad.bg ? "border-ink bg-brand" : "border-ink/20"}`}>
                  Không màu
                </button>
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateArea((a) => ({ ...a, bg: c }))}
                    className={`h-8 w-8 rounded-full border-2 ${ad.bg === c ? "border-ink ring-2 ring-brand" : "border-ink/20"}`}
                    style={{ background: c }}
                    aria-label={`Nền ${c}`}
                  />
                ))}
                <input type="color" value={ad.bg ?? "#ffffff"} onChange={(e) => updateArea((a) => ({ ...a, bg: e.target.value }))} className="h-8 w-10 cursor-pointer rounded border border-ink/20" aria-label="Màu nền khác" />
              </div>
            </section>
          )}

          {tool === "layers" && (
            <section>
              {ad.layers.length === 0 ? (
                <p className="text-xs text-ink/60">Mặt này chưa có lớp nào.</p>
              ) : (
                <ul className="space-y-1">
                  {[...ad.layers].reverse().map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(l.id)}
                        className={`flex w-full items-center gap-2 rounded-md border-2 px-2 py-1.5 text-left text-xs font-semibold ${l.id === selectedId ? "border-ink bg-cream" : "border-transparent hover:bg-cream"}`}
                      >
                        {l.type === "image" ? <img src={l.src} alt="" className="h-7 w-7 rounded bg-[#f4f4f5] object-contain" /> : <IconText className="h-5 w-5" />}
                        <span className="truncate">{layerLabel(l)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {selected && (
            <div className="grid grid-cols-4 gap-1.5 border-t border-ink/10 pt-3 text-[11px] font-bold">
              <button type="button" className="btn-sm flex-col" onClick={() => moveOrder(1)} title="Đưa lên trên">
                ↑ Lên
              </button>
              <button type="button" className="btn-sm flex-col" onClick={() => moveOrder(-1)} title="Đưa xuống dưới">
                ↓ Xuống
              </button>
              <button type="button" className="btn-sm flex-col" onClick={duplicateSelected}>
                <IconCopy className="h-4 w-4" /> Nhân đôi
              </button>
              <button type="button" className="btn-sm flex-col !text-red-600" onClick={removeSelected}>
                <IconTrash className="h-4 w-4" /> Xoá
              </button>
            </div>
          )}

          <div className="rounded-lg bg-cream p-3 text-xs">
            <p>
              <b>Mặt có thiết kế:</b> {used.length ? used.map((k) => areas.find((a) => a.key === k)?.name).join(", ") : "chưa có"}
            </p>
            {extras > 0 && <p className="mt-1">Phụ phí in thêm mặt: <b>+{formatVND(extras)}</b>/sản phẩm</p>}
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </aside>
      </div>

      {/* Nút hoàn tất cố định trên mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white p-3 lg:hidden">
        <button type="button" onClick={() => finish()} disabled={!!busy} className="btn w-full border-ink bg-brand py-3 text-ink disabled:opacity-60">
          Hoàn tất thiết kế{used.length ? ` (${used.length} mặt)` : ""}
        </button>
      </div>

      {busy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="status" aria-live="polite">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-semibold shadow-xl">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
            {busy}
          </div>
        </div>
      )}

      {lowDpi && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="lowdpi-title">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 id="lowdpi-title" className="text-lg font-black">
              Ảnh có thể in bị vỡ
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/80">
              {lowDpi.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink/60">Thu nhỏ ảnh trên sản phẩm hoặc dùng ảnh gốc độ phân giải cao hơn.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="btn border-ink/20 bg-white" onClick={() => setLowDpi(null)}>
                Quay lại sửa
              </button>
              <button type="button" className="btn border-ink bg-brand" onClick={() => void finish(true)}>
                Vẫn tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {saveDlg && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="save-title">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h2 id="save-title" className="text-lg font-black">
              Lưu thiết kế
            </h2>
            {saveDlg.needLogin ? (
              <>
                <p className="mt-2 text-sm text-ink/80">Đăng nhập để lưu thiết kế vào tài khoản. Bản nháp vẫn được giữ trên máy này.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" className="btn border-ink/20 bg-white" onClick={() => setSaveDlg(null)}>
                    Để sau
                  </button>
                  <Link href={`/dang-nhap?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : returnTo)}`} className="btn border-ink bg-brand">
                    Đăng nhập
                  </Link>
                </div>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveToAccount(saveDlg.name.trim() || product.name);
                }}
              >
                <input
                  autoFocus
                  value={saveDlg.name}
                  maxLength={80}
                  onChange={(e) => setSaveDlg({ name: e.target.value })}
                  className="mt-3 w-full rounded-md border-2 border-ink/15 px-3 py-2 text-sm focus:border-ink focus:outline-none"
                  aria-label="Tên thiết kế"
                />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" className="btn border-ink/20 bg-white" onClick={() => setSaveDlg(null)}>
                    Huỷ
                  </button>
                  <button type="submit" className="btn border-ink bg-brand">
                    Lưu
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
