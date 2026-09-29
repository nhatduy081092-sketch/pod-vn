"use client";
import { useEffect, useRef, useState } from "react";
import { personalizeArea, type DesignJson } from "@pod/shared";
import type { PrintArea } from "@/lib/types";
import { IconClose } from "../ui/icons";
import { canvasToBlob, createCanvas, drawMockup, type ImageCache, type MockupAssets } from "./render";
import { loadAreaAssets, loadLayerImages } from "./export";
import { ensureFonts } from "./fonts";

type Props = {
  productName: string;
  areas: PrintArea[];
  design: DesignJson;
  images: ImageCache;
  garmentColor?: string | null;
  colorName?: string;
  /** dữ liệu mẫu cho ô tên/số (xem trước như áo thật) */
  sample?: { name?: string; number?: string };
  onClose: () => void;
};

async function prepare(areas: PrintArea[], design: DesignJson, images: ImageCache) {
  const out: { area: PrintArea; assets: MockupAssets }[] = [];
  for (const a of areas) {
    const ad = design.areas[a.key];
    if (ad) {
      await ensureFonts(ad.layers);
      await loadLayerImages(ad, images).catch(() => undefined);
    }
    out.push({ area: a, assets: await loadAreaAssets(a) });
  }
  return out;
}

/** Xem tất cả mặt cùng lúc + tải ảnh ghép / chia sẻ (Zalo, Messenger qua menu chia sẻ của điện thoại) */
export function OverviewModal({ productName, areas, design, images, garmentColor, colorName, sample, onClose }: Props) {
  const [items, setItems] = useState<{ area: PrintArea; assets: MockupAssets }[] | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const refs = useRef<Record<string, HTMLCanvasElement | null>>({});

  // chỉ các mặt có thiết kế; chưa có mặt nào thì hiện tất cả
  const withDesign = areas.filter((a) => (design.areas[a.key]?.layers.length ?? 0) > 0 || !!design.areas[a.key]?.bg);
  const shown = withDesign.length ? withDesign : areas;

  useEffect(() => {
    let alive = true;
    void prepare(shown, design, images).then((r) => alive && setItems(r));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adOf = (key: string) => personalizeArea(design.areas[key] ?? { bg: null, layers: [] }, sample ?? null);

  useEffect(() => {
    if (!items) return;
    for (const it of items) {
      const c = refs.current[it.area.key];
      if (!c) continue;
      const px = 520;
      c.width = px;
      c.height = px;
      drawMockup(c.getContext("2d")!, px, px, it.area, adOf(it.area.key), it.assets, images, { background: "#ffffff", padding: px * 0.04, garmentColor, shading: 0.45 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, garmentColor]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  /** Ảnh ghép tất cả mặt + tên sản phẩm (JPEG) */
  async function compose(): Promise<File> {
    if (!items) throw new Error("Đang tải");
    const cell = 800;
    const cols = Math.min(items.length, 3);
    const rows = Math.ceil(items.length / cols);
    const head = 90;
    const c = createCanvas(cols * cell, rows * cell + head);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#1d1d1f";
    ctx.font = `700 34px "Be Vietnam Pro", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(productName.slice(0, 70), 32, head / 2 - 6);
    ctx.font = `400 22px "Be Vietnam Pro", sans-serif`;
    ctx.fillStyle = "#6b7280";
    ctx.fillText([colorName, "Ảnh xem trước thiết kế – màu thực tế có thể chênh nhẹ"].filter(Boolean).join(" · "), 32, head - 18);
    items.forEach((it, i) => {
      const x = (i % cols) * cell;
      const y = head + Math.floor(i / cols) * cell;
      const sub = createCanvas(cell, cell);
      drawMockup(sub.getContext("2d")!, cell, cell, it.area, adOf(it.area.key), it.assets, images, { background: "#ffffff", padding: cell * 0.05, garmentColor, shading: 0.45 });
      ctx.drawImage(sub, x, y);
      ctx.fillStyle = "#1d1d1f";
      ctx.font = `600 24px "Be Vietnam Pro", sans-serif`;
      ctx.fillText(it.area.name, x + 24, y + 30);
      sub.width = sub.height = 0;
    });
    const blob = await canvasToBlob(c, "image/jpeg", 0.9);
    c.width = c.height = 0;
    return new File([blob], "thiet-ke-cua-toi.jpg", { type: "image/jpeg" });
  }

  async function download() {
    setBusy("Đang tạo ảnh…");
    setMsg("");
    try {
      const f = await compose();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(f);
      a.download = f.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function share() {
    setBusy("Đang tạo ảnh…");
    setMsg("");
    try {
      const f = await compose();
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.share && nav.canShare?.({ files: [f] })) await nav.share({ files: [f], title: productName, text: `Thiết kế ${productName}` });
      else {
        setMsg("Trình duyệt này chưa hỗ trợ chia sẻ ảnh – đã tải ảnh về máy, bạn gửi qua Zalo nhé.");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(f);
        a.download = f.name;
        a.click();
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setMsg((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="ov-title" className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-t-2xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
          <h2 id="ov-title" className="mr-auto font-black">
            Xem tổng thể {colorName ? `· ${colorName}` : ""}
          </h2>
          <button type="button" onClick={onClose} className="p-1" aria-label="Đóng">
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          {!items ? (
            <p className="py-10 text-center text-sm text-ink/60">Đang dựng ảnh xem trước…</p>
          ) : (
            <ul className={`grid gap-3 ${shown.length > 1 ? "grid-cols-2 md:grid-cols-3" : "mx-auto max-w-md grid-cols-1"}`}>
              {items.map((it) => (
                <li key={it.area.key} className="overflow-hidden rounded-lg border border-ink/10">
                  <canvas ref={(el) => void (refs.current[it.area.key] = el)} className="aspect-square w-full" aria-label={`Xem trước ${it.area.name}`} />
                  <p className="border-t border-ink/10 px-2 py-1 text-xs font-bold">{it.area.name}</p>
                </li>
              ))}
            </ul>
          )}
          {sample && (sample.name || sample.number) && <p className="mt-3 text-xs text-ink/60">Ô tên/số đang hiển thị dữ liệu mẫu – khi in sẽ thay bằng tên, số của từng thành viên.</p>}
          {msg && <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">{msg}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-ink/10 p-3">
          <button type="button" onClick={download} disabled={!items || !!busy} className="btn border-ink/20 bg-white py-2.5 text-sm">
            {busy || "Tải ảnh xem trước"}
          </button>
          <button type="button" onClick={share} disabled={!items || !!busy} className="btn border-ink bg-zalo py-2.5 text-sm text-white">
            Chia sẻ (Zalo…)
          </button>
        </div>
      </div>
    </div>
  );
}
