"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  areaExtraPrice,
  areaForSize,
  DESIGN_FIELDS,
  DESIGN_FONTS,
  DESIGN_LIMITS,
  designFields,
  designReport,
  emptyDesign,
  formatVND,
  layerBounds,
  scaleAreaDesign,
  sizeScale,
  UPLOAD_MAX_BYTES,
  UPLOAD_MAX_SIDE_PX,
  usedAreas,
  type AreaDesign,
  type DesignAssetView,
  type DesignField,
  type DesignIssue,
  type DesignJson,
  type DesignLayer,
  type DesignTemplateData,
  type ImageLayer,
  type TextLayer,
} from "@pod/shared";
import type { PrintArea, ProductDetail } from "@/lib/types";
import { IconClose, IconCopy, IconEye, IconGrid, IconLayers, IconLock, IconPalette, IconRedo, IconSave, IconText, IconTrash, IconUndo, IconUpload } from "../ui/icons";
import { Stage } from "./Stage";
import { canvasSrc, imgSize, loadImage, measureText, type ImageCache, type MockupAssets } from "./render";
import { ensureFonts, GOOGLE_FONTS_HREF } from "./fonts";
import { exportDesign, loadAreaAssets, renderPreview, uploadBlob } from "./export";
import { attachDesign, clearDraft, loadDraft, saveDraft, stashSellerDesign } from "./storage";
import { LibraryPanel, templateLayers } from "./LibraryPanel";
import { OverviewModal } from "./OverviewModal";
import { ImagePanel } from "./ImagePanel";
import { ColorPicker } from "./ui";
import { removeBackground } from "./bgRemoval";

type Props = {
  product: ProductDetail;
  mode: "customer" | "seller";
  initial?: DesignJson | null;
  savedId?: string | null;
  savedName?: string;
  templateId?: string | null;
  /** màu phân loại đang chọn ở trang sản phẩm (tên màu) */
  initialColor?: string | null;
  returnTo: string;
};

type Tool = "upload" | "library" | "text" | "bg" | "layers";
type Upload = { src: string; natW: number; natH: number; name: string };

const uid = () => `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const FIELD_SAMPLE: Record<DesignField, string> = { name: "TÊN", number: "10" };

/** Bổ sung mặt in còn thiếu (sản phẩm có thêm mặt sau khi lưu thiết kế) và bỏ mặt không còn */
function normalize(design: DesignJson | null | undefined, product: ProductDetail): DesignJson {
  const base = emptyDesign(product.id, product.printAreas.map((a) => a.key));
  if (!design || design.productId !== product.id) return base;
  for (const k of Object.keys(base.areas)) if (design.areas[k]) base.areas[k] = design.areas[k]!;
  return base;
}

/** Các size có vùng in riêng (theo thứ tự phân loại), size lớn nhất trước để kiểm tra độ nét khắt khe nhất */
function sizeOptions(product: ProductDetail): { list: string[]; largest: string | null } {
  const keys = new Set<string>();
  for (const a of product.printAreas) for (const k of Object.keys(a.sizeSpecs ?? {})) keys.add(k);
  if (!keys.size) return { list: [], largest: null };
  const order = [...new Set(product.variants.map((v) => v.size))];
  const list = [...order.filter((x) => keys.has(x)), ...[...keys].filter((x) => !order.includes(x))];
  const a0 = product.printAreas.find((a) => a.sizeSpecs && Object.keys(a.sizeSpecs).length) ?? product.printAreas[0]!;
  const largest = [...list].sort((x, y) => {
    const s = (k: string) => areaForSize(a0, k);
    return s(y).widthMm * s(y).heightMm - s(x).widthMm * s(x).heightMm;
  })[0]!;
  return { list, largest };
}

const AGREE_KEY = "yala-upload-agree";

/** Màu vải có mã hex (từ phân loại) */
function garmentColors(product: ProductDetail) {
  const seen = new Map<string, string>();
  for (const v of product.variants) if (v.color && /^#[0-9a-f]{6}$/i.test(v.colorHex) && !seen.has(v.color)) seen.set(v.color, v.colorHex);
  return [...seen].map(([name, hex]) => ({ name, hex }));
}

export function DesignEditor({ product, mode, initial, savedId, savedName, templateId, initialColor, returnTo }: Props) {
  const router = useRouter();
  const areas = product.printAreas;
  const colors = garmentColors(product);
  const [color, setColor] = useState(() => colors.find((c) => c.name === initialColor) ?? colors[0] ?? null);
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
  const [issues, setIssues] = useState<DesignIssue[] | null>(null);
  const [saveDlg, setSaveDlg] = useState<{ name: string; needLogin?: boolean } | null>(null);
  const [overview, setOverview] = useState(false);
  const sizes = useMemo(() => sizeOptions(product), [product]);
  const [size, setSize] = useState<string | null>(sizes.largest);
  const [agreed, setAgreed] = useState(false);
  const [askAgree, setAskAgree] = useState(false);
  const [bgSupported, setBgSupported] = useState(false);
  const images = useRef<ImageCache>(new Map()).current;
  const [assets, setAssets] = useState<Record<string, MockupAssets>>({});
  const [version, setVersion] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const area = areas.find((a) => a.key === areaKey) ?? areas[0]!;
  const ad: AreaDesign = design.areas[area.key] ?? { bg: null, layers: [] };
  const selected = ad.layers.find((l) => l.id === selectedId) ?? null;
  const fields = designFields(design);
  const sized = areaForSize(area, size);
  const dpiScale = sizeScale(area, sized);

  useEffect(() => {
    setBgSupported(typeof WebAssembly !== "undefined");
    try {
      setAgreed(localStorage.getItem(AGREE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

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

  // font tải xong -> đo lại khung chữ (bản nháp/mẫu có thể được đo bằng font dự phòng)
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

  const updateAreaOf = useCallback(
    (key: string, fn: (a: AreaDesign) => AreaDesign) => {
      const cur = designRef.current;
      apply({ ...cur, areas: { ...cur.areas, [key]: fn(cur.areas[key] ?? { bg: null, layers: [] }) } }, true);
    },
    [apply],
  );
  const updateArea = useCallback((fn: (a: AreaDesign) => AreaDesign) => updateAreaOf(area.key, fn), [updateAreaOf, area.key]);

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
  function addLayers(ls: DesignLayer[], key = area.key) {
    if (!ls.length) return;
    if ((designRef.current.areas[key]?.layers.length ?? 0) + ls.length > DESIGN_LIMITS.layersPerArea) return setError(`Tối đa ${DESIGN_LIMITS.layersPerArea} lớp mỗi mặt`);
    updateAreaOf(key, (a) => ({ ...a, layers: [...a.layers, ...ls] }));
    if (key === area.key) setSelectedId(ls[ls.length - 1]!.id);
  }
  const addLayer = (l: DesignLayer) => addLayers([l]);

  function imageLayer(u: Upload, a: PrintArea = area): ImageLayer {
    const s = Math.min((a.widthMm * 0.8) / u.natW, (a.heightMm * 0.8) / u.natH);
    return { id: uid(), type: "image", src: u.src, natW: u.natW, natH: u.natH, x: a.widthMm / 2, y: a.heightMm / 2, w: u.natW * s, h: u.natH * s, rotation: 0, opacity: 1 };
  }

  async function onFiles(files: FileList | null) {
    setError("");
    const list = Array.from(files ?? []).slice(0, 10);
    for (const f of list) {
      if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
        setError("Chỉ nhận ảnh PNG, JPG hoặc WEBP");
        continue;
      }
      if (f.size > UPLOAD_MAX_BYTES) {
        setError(`Ảnh tối đa ${Math.round(UPLOAD_MAX_BYTES / 1024 / 1024)}MB`);
        continue;
      }
      setBusy(`Đang tải "${f.name}"…`);
      try {
        const local = URL.createObjectURL(f);
        const img = await loadImage(local);
        const { w, h } = imgSize(img);
        if (w > UPLOAD_MAX_SIDE_PX || h > UPLOAD_MAX_SIDE_PX) {
          setError(`Ảnh "${f.name}" quá lớn (${w}×${h}px) – tối đa ${UPLOAD_MAX_SIDE_PX.toLocaleString("vi-VN")}px mỗi cạnh`);
          continue;
        }
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

  function textLayer(p: Partial<TextLayer> = {}): TextLayer {
    const fontSize = Math.max(6, Math.min(40, Math.round(area.heightMm * 0.1)));
    const base: TextLayer = { id: uid(), type: "text", text: "Nội dung của bạn", font: "Be Vietnam Pro", fontSize, color: ad.bg === "#1d1d1f" ? "#ffffff" : "#1d1d1f", bold: true, italic: false, align: "center", lineHeight: 1.15, x: area.widthMm / 2, y: area.heightMm / 2, w: 10, h: 10, rotation: 0, opacity: 1, ...p };
    return { ...base, ...measureText(base) };
  }

  function addText() {
    addLayer(textLayer());
    setTool("text");
  }

  /** Ô tên / số đồng phục: chữ mẫu, khi in thay theo danh sách thành viên */
  function addField(field: DesignField) {
    const big = field === "number";
    const fontSize = Math.max(8, Math.min(big ? 220 : 60, Math.round(area.heightMm * (big ? 0.32 : 0.1))));
    const y = big ? area.heightMm * 0.55 : area.heightMm * 0.2;
    addLayer(textLayer({ text: FIELD_SAMPLE[field], field, font: big ? "Anton" : "Oswald", bold: !big, fontSize, y, letterSpacing: big ? 0 : 0.06 }));
    setTool("text");
  }

  function addTemplate(data: DesignTemplateData, name: string) {
    setError("");
    const ls = templateLayers(data, area, uid);
    addLayers(ls);
    if (data.bg && !ad.bg) updateArea((a) => ({ ...a, bg: data.bg }));
    setNotice(`Đã thêm mẫu "${name}" – bấm vào chữ để sửa nội dung.`);
    // font của mẫu tải xong -> đo lại khung chữ cho chính xác
    void ensureFonts(ls).then(() => {
      const ids = new Set(ls.map((l) => l.id));
      const cur = designRef.current;
      const a = cur.areas[area.key];
      if (!a) return;
      apply({ ...cur, areas: { ...cur.areas, [area.key]: { ...a, layers: a.layers.map((l) => (ids.has(l.id) && l.type === "text" ? { ...l, ...measureText(l) } : l)) } } }, false);
    });
  }

  function addClipart(a: DesignAssetView) {
    const u = { src: a.imageUrl, natW: a.natW, natH: a.natH, name: a.name };
    const l = imageLayer(u);
    const s = Math.min((area.widthMm * 0.45) / u.natW, (area.heightMm * 0.45) / u.natH);
    addLayer({ ...l, w: u.natW * s, h: u.natH * s });
  }

  const patchSelected = (patch: Partial<DesignLayer>) => {
    if (!selected) return;
    let p = patch;
    if (selected.type === "text" && ["text", "font", "fontSize", "bold", "italic", "lineHeight", "stroke", "letterSpacing", "curve"].some((k) => k in patch)) {
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
    addLayer({ ...selected, id: uid(), x: selected.x + 5, y: selected.y + 5, locked: false });
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

  /** Căn lớp trong vùng in theo khung bao (tính cả khi đã xoay) */
  function align(h: "left" | "center" | "right" | null, v: "top" | "middle" | "bottom" | null) {
    if (!selected) return;
    const b = layerBounds({ ...selected, x: 0, y: 0 });
    const x = h === "left" ? b.right : h === "right" ? area.widthMm - b.right : h === "center" ? area.widthMm / 2 : selected.x;
    const y = v === "top" ? b.bottom : v === "bottom" ? area.heightMm - b.bottom : v === "middle" ? area.heightMm / 2 : selected.y;
    patchSelected({ x, y });
  }

  /** Chép lớp sang mặt khác (co giãn theo tỉ lệ vùng in) */
  function copyTo(key: string) {
    const target = areas.find((a) => a.key === key);
    if (!selected || !target) return;
    const [l] = templateLayers({ srcW: area.widthMm, srcH: area.heightMm, bg: null, layers: [selected] }, target, uid);
    if (!l) return;
    addLayers([{ ...l, locked: false }], key);
    setNotice(`Đã chép sang "${target.name}".`);
  }

  /** Xoá nền ảnh ngay trên máy khách, giữ ảnh gốc để khôi phục */
  async function removeBg() {
    if (!selected || selected.type !== "image") return;
    const l = selected;
    setError("");
    try {
      setBusy("Đang chuẩn bị xoá nền…");
      const blob = await removeBackground(canvasSrc(l.src), setBusy);
      setBusy("Đang lưu ảnh đã xoá nền…");
      const src = await uploadBlob(blob, "xoa-nen.png", "design");
      images.set(src, await loadImage(src));
      patchLayer(l.id, { src, origSrc: l.src } as Partial<DesignLayer>, true);
      setNotice("✓ Đã xoá nền. Bấm “Ảnh gốc” nếu muốn trả lại.");
    } catch (e) {
      setError(`Không xoá được nền: ${(e as Error).message}`);
    } finally {
      setBusy("");
    }
  }

  function restoreOriginal() {
    if (!selected || selected.type !== "image" || !selected.origSrc) return;
    patchLayer(selected.id, { src: selected.origSrc, origSrc: undefined } as Partial<DesignLayer>, true);
  }

  /** Kiểm tra theo size đang chọn (vùng in theo size + nội dung đã co giãn) */
  function report() {
    const scaled = Object.fromEntries(areas.map((a) => [a.key, scaleAreaDesign(design.areas[a.key] ?? { bg: null, layers: [] }, a, areaForSize(a, size))]));
    return designReport({ areas: scaled }, areas.map((a) => areaForSize(a, size)));
  }

  function openUpload() {
    if (!agreed) return setAskAgree(true);
    fileRef.current?.click();
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
      if (e.key === "Escape") return setSelectedId(null);
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSelected();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key.startsWith("Arrow") && !selected.locked) {
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

  /* ---------- hoàn tất: kiểm tra + xuất file in ---------- */
  async function finish(force = false) {
    setError("");
    if (!used.length) return setError("Thiết kế đang trống – thêm ảnh hoặc chữ trước khi hoàn tất");
    if (!force) {
      const rep = report();
      // chỉ dừng lại khi có lỗi thật sự hoặc lớp bị cắt/nằm ngoài; cảnh báo DPI "tạm được" hiện kèm
      if (rep.some((i) => i.level === "error" || !i.message.includes("DPI"))) return setIssues(rep);
    }
    setIssues(null);
    try {
      const out = await exportDesign(areas, design, images, setBusy, { garmentColor: color?.hex });
      if (mode === "seller") {
        stashSellerDesign(product.id, out);
        router.push(`/seller/mau/moi?product=${product.id}${templateId ? `&id=${templateId}` : ""}`);
      } else {
        attachDesign(product.id, out, color?.name);
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
        const blob = await renderPreview(a, design.areas[a.key]!, images, assets[a.key] ?? (await loadAreaAssets(a)), 600, { garmentColor: color?.hex });
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

  const layerLabel = (l: DesignLayer) =>
    l.type === "text" ? (l.field ? `Ô ${DESIGN_FIELDS[l.field].toLowerCase()} (theo danh sách)` : `Chữ: ${l.text.slice(0, 18)}`) : l.tile ? "Ảnh lặp họa tiết" : "Ảnh";

  /* ---------- giao diện ---------- */
  const toolBtn = (t: Tool, label: string, Icon: typeof IconText, onClick?: () => void) => (
    <button
      type="button"
      onClick={onClick ?? (() => setTool(t))}
      className={`flex min-w-[58px] flex-1 flex-col items-center gap-1 rounded-lg px-1.5 py-2 text-[11px] font-bold lg:flex-none ${tool === t ? "bg-brand text-ink" : "text-ink/70 hover:bg-cream"}`}
      aria-pressed={tool === t}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
  const slider = (label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, fmt?: (v: number) => string) => (
    <label className="block text-xs font-semibold">
      {label}: {fmt ? fmt(value) : value}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} onPointerUp={endDrag} onKeyUp={endDrag} className="w-full accent-[#F08A00]" />
    </label>
  );
  const otherAreas = areas.filter((a) => a.key !== area.key);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 lg:pb-8">
      <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
      {/* Thanh trên */}
      <div className="sticky top-0 z-30 border-b border-ink/10 bg-white">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-1.5 px-3 md:px-5">
          <Link href={returnTo} className="rounded-md p-1.5 hover:bg-cream" aria-label="Quay lại">
            <IconClose className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold md:text-base">{product.name}</p>
            <p className="text-[11px] text-ink/60">{mode === "seller" ? "Thiết kế mẫu seller" : "YALA Studio"} · tự lưu nháp</p>
          </div>
          <button type="button" onClick={undo} disabled={!past.length} className="rounded-md p-2 disabled:opacity-30 hover:bg-cream" aria-label="Hoàn tác">
            <IconUndo className="h-5 w-5" />
          </button>
          <button type="button" onClick={redo} disabled={!future.length} className="rounded-md p-2 disabled:opacity-30 hover:bg-cream" aria-label="Làm lại">
            <IconRedo className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => setOverview(true)} className="flex items-center gap-1 rounded-md p-2 text-sm font-bold hover:bg-cream md:border-2 md:border-ink/15 md:px-3 md:py-1.5" aria-label="Xem tổng thể">
            <IconEye className="h-5 w-5 md:h-4 md:w-4" /> <span className="hidden md:inline">Xem</span>
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
        {/* Size in (sản phẩm có vùng in đổi theo size: cờ, tranh, poster…) */}
        {sizes.list.length > 0 && (
          <div className="no-scrollbar mx-auto flex max-w-[1320px] items-center gap-1 overflow-x-auto px-3 pb-2 md:px-5" role="radiogroup" aria-label="Size in">
            <span className="mr-1 shrink-0 text-[11px] font-bold text-ink/60">Xem theo size:</span>
            {sizes.list.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={size === k}
                onClick={() => setSize(k)}
                className={`shrink-0 whitespace-nowrap rounded-full border-2 px-3 py-0.5 text-xs font-bold ${size === k ? "border-ink bg-brand" : "border-ink/15 bg-white"}`}
              >
                {k}
              </button>
            ))}
          </div>
        )}
      </div>

      {(notice || fields.length > 0) && (
        <div className="mx-auto mt-3 max-w-[1320px] space-y-2 px-3 text-sm md:px-5">
          {notice && (
            <div className="flex items-center justify-between gap-2">
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
          {fields.length > 0 && (
            <p className="rounded-lg bg-navy-light px-3 py-2 text-navy-dark">
              👕 Thiết kế có ô <b>{fields.map((f) => DESIGN_FIELDS[f]).join(" + ")}</b>: khi đặt hàng chọn <b>Đồng phục nhóm</b> và tải danh sách – mỗi áo in đúng tên/số của từng người.
            </p>
          )}
        </div>
      )}

      <div className="mx-auto grid max-w-[1320px] grid-cols-[minmax(0,1fr)] gap-4 px-3 pt-3 md:px-5 lg:grid-cols-[88px_minmax(0,1fr)_340px] lg:pt-5">
        {/* Công cụ (desktop: cột trái, mobile: dưới khung) */}
        <nav className="order-2 flex gap-1 rounded-xl border border-ink/10 bg-white p-1 lg:order-1 lg:h-fit lg:flex-col" aria-label="Công cụ">
          {toolBtn("upload", "Tải ảnh", IconUpload)}
          {toolBtn("library", "Mẫu", IconGrid)}
          {toolBtn("text", "Chữ", IconText, () => (selected?.type === "text" ? setTool("text") : addText()))}
          {toolBtn("bg", colors.length > 1 ? "Màu" : "Màu nền", IconPalette)}
          {toolBtn("layers", `Lớp (${ad.layers.length})`, IconLayers)}
        </nav>

        <div className="order-1 mx-auto w-full max-w-[640px] lg:order-2">
          {(area.tips || (area.bleedMm ?? 0) > 0) && (
            <details className="mb-2 rounded-lg border border-navy/20 bg-navy-light px-3 py-2 text-xs text-navy-dark" open={!!area.tips}>
              <summary className="cursor-pointer font-bold">💡 Gợi ý thiết kế cho {area.name.toLowerCase()}</summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {area.tips && <li className="whitespace-pre-line">{area.tips}</li>}
                {(area.bleedMm ?? 0) > 0 && <li>Ảnh nền nên phủ tới mép ngoài: phần ngoài đường đỏ ({area.bleedMm} mm) sẽ bị xén sau khi in.</li>}
                {(area.safeMm ?? 0) > 0 && <li>Chữ, logo, khuôn mặt nên nằm trong đường xanh (vùng an toàn).</li>}
                {size && <li>Thiết kế tự co giãn theo size bạn đặt; đang xem size {size}.</li>}
              </ul>
            </details>
          )}
          <Stage
            area={area}
            design={ad}
            assets={assets[area.key] ?? {}}
            images={images}
            version={version}
            selectedId={selectedId}
            garmentColor={color?.hex}
            dpiScale={dpiScale}
            sizeLabel={size ? `${sized.widthMm / 10}×${sized.heightMm / 10} cm · size ${size}` : undefined}
            onSelect={(id) => {
              setSelectedId(id);
              const l = ad.layers.find((x) => x.id === id);
              if (l && tool !== "layers") setTool(l.type === "text" ? "text" : "upload");
            }}
            onChangeLayer={patchLayer}
            onCommit={endDrag}
          />
          <p className="mt-2 text-center text-[11px] text-ink/55">Kéo để di chuyển · kéo ô vuông ở góc để đổi cỡ · nút tròn để xoay · điện thoại: 2 ngón để phóng to/xoay</p>
        </div>

        {/* Bảng thuộc tính */}
        <aside className="order-3 space-y-3 rounded-xl border border-ink/10 bg-white p-4 lg:h-fit">
          {tool === "upload" && (
            <section className="space-y-3">
              <button type="button" onClick={openUpload} disabled={!!busy} className="btn w-full border-dashed border-ink/40 bg-cream py-3 text-sm">
                <IconUpload className="h-5 w-5" /> Tải ảnh lên (PNG, JPG, WEBP · tối đa 10 ảnh)
              </button>
              {askAgree && !agreed && (
                <div className="rounded-lg border-2 border-ink/15 bg-white p-3 text-xs leading-relaxed">
                  <p className="font-bold">Cam kết khi tải ảnh lên</p>
                  <p className="mt-1 text-ink/75">
                    Tôi có quyền sử dụng hình ảnh, chữ, logo tải lên; không vi phạm bản quyền, nhãn hiệu, hình ảnh cá nhân của người khác và không chứa nội dung trái pháp luật. Đơn vi phạm sẽ bị từ chối in.
                  </p>
                  <button
                    type="button"
                    className="btn mt-2 w-full border-ink bg-brand py-2 text-xs"
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
                    Tôi đồng ý – chọn ảnh
                  </button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => void onFiles(e.target.files)} />
              <p className="text-[11px] text-ink/60">
                Logo nên dùng PNG nền trong suốt (hoặc bấm “Xoá nền”). Mặt này in tốt nhất với ảnh ≥ {area.dpi} DPI ở kích thước thật ({sized.widthMm / 10}×{sized.heightMm / 10} cm ≈{" "}
                {Math.round((sized.widthMm / 25.4) * area.dpi)}×{Math.round((sized.heightMm / 25.4) * area.dpi)} px). Tối đa {Math.round(UPLOAD_MAX_BYTES / 1024 / 1024)}MB mỗi ảnh.
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
                <ImagePanel
                  layer={selected}
                  area={area}
                  onPatch={(p, commit) => patchLayer(selected.id, p as Partial<DesignLayer>, commit)}
                  onEnd={endDrag}
                  onRemoveBg={() => void removeBg()}
                  onRestore={restoreOriginal}
                  bgSupported={bgSupported}
                />
              )}
            </section>
          )}

          {tool === "library" && <LibraryPanel onTemplate={addTemplate} onClipart={addClipart} />}

          {tool === "text" && (
            <section className="space-y-3">
              <button type="button" onClick={addText} className="btn w-full border-ink bg-cream py-2.5 text-sm">
                <IconText className="h-5 w-5" /> Thêm chữ mới
              </button>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                <button type="button" className="btn-sm" onClick={() => addField("name")}>
                  + Ô tên thành viên
                </button>
                <button type="button" className="btn-sm" onClick={() => addField("number")}>
                  + Ô số áo
                </button>
              </div>
              {selected?.type === "text" ? (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap gap-1 text-[11px] font-bold" role="radiogroup" aria-label="Loại nội dung">
                    {(
                      [
                        [undefined, "Chữ cố định"],
                        ["name", "Tên thành viên"],
                        ["number", "Số áo"],
                      ] as const
                    ).map(([f, label]) => (
                      <button
                        key={label}
                        type="button"
                        role="radio"
                        aria-checked={selected.field === f}
                        onClick={() => patchSelected({ field: f, ...(f && selected.field !== f ? { text: FIELD_SAMPLE[f] } : {}) })}
                        className={`rounded-full border-2 px-2 py-0.5 ${selected.field === f ? "border-ink bg-brand" : "border-ink/15"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={selected.text}
                    maxLength={DESIGN_LIMITS.textLength}
                    rows={selected.field ? 1 : 3}
                    onChange={(e) => e.target.value && patchSelected({ text: e.target.value })}
                    className="w-full rounded-md border-2 border-ink/15 px-3 py-2 text-sm focus:border-ink focus:outline-none"
                    aria-label="Nội dung chữ"
                  />
                  {selected.field && <p className="-mt-1.5 text-[11px] text-ink/60">Chữ mẫu để canh vị trí – khi in thay bằng {DESIGN_FIELDS[selected.field].toLowerCase()} từng người trong danh sách.</p>}
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
                  {slider(
                    "Cỡ chữ",
                    selected.fontSize,
                    3,
                    Math.max(20, Math.round(area.heightMm * 0.6)),
                    0.5,
                    (fontSize) => patchLayer(selected.id, { fontSize, ...measureText({ ...selected, fontSize }) } as Partial<DesignLayer>, false),
                    (v) => `${v} mm`,
                  )}
                  <ColorPicker label="Màu chữ" value={selected.color} onChange={(c) => c && patchSelected({ color: c })} />
                  <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                    <button type="button" className={`btn-sm ${selected.bold ? "!border-ink !bg-brand" : ""}`} onClick={() => patchSelected({ bold: !selected.bold })}>
                      Đậm
                    </button>
                    <button type="button" className={`btn-sm italic ${selected.italic ? "!border-ink !bg-brand" : ""}`} onClick={() => patchSelected({ italic: !selected.italic })}>
                      Nghiêng
                    </button>
                    {!selected.curve &&
                      (["left", "center", "right"] as const).map((a) => (
                        <button key={a} type="button" className={`btn-sm ${selected.align === a ? "!border-ink !bg-brand" : ""}`} onClick={() => patchSelected({ align: a })}>
                          {a === "left" ? "Trái" : a === "center" ? "Giữa" : "Phải"}
                        </button>
                      ))}
                  </div>
                  {slider(
                    "Uốn cong",
                    selected.curve ?? 0,
                    -100,
                    100,
                    1,
                    (curve) => patchLayer(selected.id, { curve: curve || undefined, ...measureText({ ...selected, curve }) } as Partial<DesignLayer>, false),
                    (v) => (v === 0 ? "thẳng" : v > 0 ? `vòng cung lên ${v}` : `cong xuống ${-v}`),
                  )}
                  {slider(
                    "Giãn chữ",
                    Math.round((selected.letterSpacing ?? 0) * 100),
                    -10,
                    100,
                    1,
                    (v) => patchLayer(selected.id, { letterSpacing: v / 100 || undefined, ...measureText({ ...selected, letterSpacing: v / 100 }) } as Partial<DesignLayer>, false),
                    (v) => `${v}%`,
                  )}
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
                </div>
              ) : (
                <p className="text-xs text-ink/60">Bấm vào chữ trên khung để sửa, hoặc thêm chữ mới / chọn mẫu chữ ở mục Mẫu. Font hỗ trợ đầy đủ dấu tiếng Việt.</p>
              )}
            </section>
          )}

          {tool === "bg" && (
            <section className="space-y-3">
              {colors.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-ink/70">
                    Màu áo: <span className="font-normal">{color?.name}</span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Màu áo">
                    {colors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        role="radio"
                        aria-checked={color?.name === c.name}
                        title={c.name}
                        onClick={() => setColor(c)}
                        className={`h-8 w-8 rounded-full border-2 ${color?.name === c.name ? "border-ink ring-2 ring-brand" : "border-ink/20"}`}
                        style={{ background: c.hex }}
                        aria-label={c.name}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-ink/55">Màu xem trước gần đúng, màu vải thật có thể chênh nhẹ.</p>
                </div>
              )}
              <div>
                <ColorPicker
                  label={`Màu nền in cả mặt${area.maskImage ? " (phủ toàn thân áo)" : ""}`}
                  none="Không in nền"
                  value={ad.bg}
                  onChange={(c) => updateArea((a) => ({ ...a, bg: c }))}
                />
                {(area.bleedMm ?? 0) > 0 && <p className="mt-1 text-[11px] text-ink/55">Màu nền tự phủ tới mép ngoài (viền tràn) – không lo lộ viền trắng.</p>}
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
                    <li key={l.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedId(l.id)}
                        className={`flex min-w-0 flex-1 items-center gap-2 rounded-md border-2 px-2 py-1.5 text-left text-xs font-semibold ${l.id === selectedId ? "border-ink bg-cream" : "border-transparent hover:bg-cream"}`}
                      >
                        {l.type === "image" ? <img src={l.src} alt="" className="h-7 w-7 rounded bg-[#f4f4f5] object-contain" /> : <IconText className="h-5 w-5 shrink-0" />}
                        <span className="truncate">{layerLabel(l)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(l.id);
                          updateArea((a) => ({ ...a, layers: a.layers.map((x) => (x.id === l.id ? { ...x, locked: !x.locked } : x)) }));
                        }}
                        className={`rounded p-1.5 ${l.locked ? "bg-ink text-white" : "text-ink/40 hover:bg-cream"}`}
                        aria-label={l.locked ? "Mở khoá lớp" : "Khoá lớp"}
                        aria-pressed={!!l.locked}
                      >
                        <IconLock className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {selected && (
            <div className="space-y-2 border-t border-ink/10 pt-3">
              <p className="text-xs font-bold text-ink/70">Vị trí trong vùng in</p>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-bold" role="group" aria-label="Căn chỉnh">
                <button type="button" className="btn-sm" disabled={selected.locked} onClick={() => align("left", null)}>
                  ⇤ Trái
                </button>
                <button type="button" className="btn-sm" disabled={selected.locked} onClick={() => align("center", null)}>
                  ↔ Giữa
                </button>
                <button type="button" className="btn-sm" disabled={selected.locked} onClick={() => align("right", null)}>
                  Phải ⇥
                </button>
                <button type="button" className="btn-sm" disabled={selected.locked} onClick={() => align(null, "top")}>
                  ⤒ Trên
                </button>
                <button type="button" className="btn-sm" disabled={selected.locked} onClick={() => align("center", "middle")}>
                  ✛ Tâm
                </button>
                <button type="button" className="btn-sm" disabled={selected.locked} onClick={() => align(null, "bottom")}>
                  ⤓ Dưới
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-bold">
                <button type="button" className="btn-sm" disabled={selected.locked} onClick={() => patchSelected({ flipX: !selected.flipX })}>
                  ⇋ Lật ngang
                </button>
                <button type="button" className="btn-sm" disabled={selected.locked} onClick={() => patchSelected({ flipY: !selected.flipY })}>
                  ⇵ Lật dọc
                </button>
                <button type="button" className={`btn-sm ${selected.locked ? "!border-ink !bg-ink !text-white" : ""}`} onClick={() => patchSelected({ locked: !selected.locked })}>
                  <IconLock className="h-3.5 w-3.5" /> {selected.locked ? "Mở khoá" : "Khoá"}
                </button>
              </div>
              {otherAreas.length > 0 && (
                <select
                  value=""
                  onChange={(e) => e.target.value && copyTo(e.target.value)}
                  className="w-full rounded-md border-2 border-ink/15 px-2 py-1.5 text-xs font-bold"
                  aria-label="Chép lớp sang mặt khác"
                >
                  <option value="">Chép lớp này sang mặt…</option>
                  {otherAreas.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold">
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
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-ink/10 bg-white p-3 lg:hidden">
        {mode === "customer" && (
          <button type="button" onClick={() => setSaveDlg({ name: savedName || product.name })} className="btn border-ink/20 bg-white px-3 py-3 sm:hidden" aria-label="Lưu thiết kế">
            <IconSave className="h-5 w-5" />
          </button>
        )}
        <button type="button" onClick={() => finish()} disabled={!!busy} className="btn flex-1 border-ink bg-brand py-3 text-ink disabled:opacity-60">
          Hoàn tất thiết kế{used.length ? ` (${used.length} mặt)` : ""}
        </button>
      </div>

      {busy && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" role="status" aria-live="polite">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-semibold shadow-xl">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
            {busy}
          </div>
        </div>
      )}

      {overview && (
        <OverviewModal
          productName={product.name}
          areas={areas}
          design={design}
          images={images}
          garmentColor={color?.hex}
          colorName={color?.name}
          sample={fields.length ? { name: "NGUYỄN AN", number: "10" } : undefined}
          onClose={() => setOverview(false)}
        />
      )}

      {issues && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="issues-title">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 id="issues-title" className="text-lg font-black">
              Kiểm tra trước khi in
            </h2>
            <ul className="mt-2 max-h-[40vh] space-y-1.5 overflow-y-auto text-sm">
              {issues.map((x, i) => (
                <li key={i} className="flex gap-2">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${x.level === "error" ? "bg-red-600" : "bg-amber-500"}`} />
                  <span>
                    <b>{x.areaName}:</b> {x.message}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink/60">Ảnh vỡ: thu nhỏ ảnh hoặc dùng ảnh gốc độ phân giải cao hơn. Phần nằm ngoài khung nét đứt sẽ không được in.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="btn border-ink/20 bg-white" onClick={() => setIssues(null)}>
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
