"use client";
import type { DesignLayer, ImageCrop, ImageMask, TextLayer } from "@pod/shared";
import { measureText } from "./render";

/**
 * Khung ghép ảnh: chọn bố cục (cặp đôi, gia đình, polaroid, dải phim…) → chọn ảnh → YALA tự cắt ảnh vừa từng ô,
 * thêm chữ tên/ngày. Mọi thứ là lớp thường (ảnh có cắt + mặt nạ, chữ) nên sửa/di chuyển/thay ảnh như bình thường.
 * Toạ độ bố cục tính theo "đơn vị" của khung (box), sau đó co giãn vừa vùng in.
 */

type Cell = {
  x: number;
  y: number;
  w: number;
  h: number;
  mask?: ImageMask;
  rot?: number;
  /** khung polaroid trắng: ảnh lùi vào `pad`, chừa đáy `bottom` để ghi chữ */
  card?: { pad: number; bottom: number; caption?: string };
};
type Txt = { text: string; x: number; y: number; size: number; font: TextLayer["font"]; bold?: boolean; curve?: number; spacing?: number };
export type Collage = { id: string; name: string; hint: string; box: { w: number; h: number }; cells: Cell[]; texts: Txt[] };

export const COLLAGES: Collage[] = [
  {
    id: "doi-ngang",
    name: "Cặp đôi",
    hint: "2 ảnh + tên",
    box: { w: 100, h: 78 },
    cells: [
      { x: 1, y: 1, w: 48, h: 60, mask: "rounded" },
      { x: 51, y: 1, w: 48, h: 60, mask: "rounded" },
    ],
    texts: [{ text: "{names}", x: 50, y: 70, size: 9, font: "Dancing Script", bold: true }],
  },
  {
    id: "tim-doi",
    name: "Tim đôi",
    hint: "2 ảnh trái tim",
    box: { w: 100, h: 74 },
    cells: [
      { x: 1, y: 1, w: 48, h: 48, mask: "heart" },
      { x: 51, y: 1, w: 48, h: 48, mask: "heart" },
    ],
    texts: [
      { text: "Mãi bên nhau", x: 50, y: 59, size: 9, font: "Pacifico" },
      { text: "{date}", x: 50, y: 70, size: 4.2, font: "Montserrat", bold: true, spacing: 0.2 },
    ],
  },
  {
    id: "polaroid-1",
    name: "Polaroid",
    hint: "1 ảnh + lời nhắn",
    box: { w: 84, h: 100 },
    cells: [{ x: 0, y: 0, w: 84, h: 100, card: { pad: 6, bottom: 22, caption: "{date}" } }],
    texts: [],
  },
  {
    id: "polaroid-2",
    name: "Polaroid đôi",
    hint: "2 ảnh nghiêng",
    box: { w: 124, h: 88 },
    cells: [
      { x: 3, y: 8, w: 56, h: 68, rot: -6, card: { pad: 4, bottom: 15, caption: "Anh" } },
      { x: 64, y: 10, w: 56, h: 68, rot: 5, card: { pad: 4, bottom: 15, caption: "Em" } },
    ],
    texts: [],
  },
  {
    id: "luoi-4",
    name: "Lưới 4 ảnh",
    hint: "gia đình, nhóm bạn",
    box: { w: 100, h: 110 },
    cells: [
      { x: 1, y: 1, w: 48, h: 48, mask: "rounded" },
      { x: 51, y: 1, w: 48, h: 48, mask: "rounded" },
      { x: 1, y: 51, w: 48, h: 48, mask: "rounded" },
      { x: 51, y: 51, w: 48, h: 48, mask: "rounded" },
    ],
    texts: [{ text: "Gia đình mình", x: 50, y: 105, size: 6.5, font: "Be Vietnam Pro", bold: true }],
  },
  {
    id: "gia-dinh-1-3",
    name: "1 lớn + 3 nhỏ",
    hint: "ảnh chính + kỷ niệm",
    box: { w: 100, h: 100 },
    cells: [
      { x: 1, y: 1, w: 98, h: 58, mask: "rounded" },
      { x: 1, y: 61, w: 32, h: 27, mask: "rounded" },
      { x: 34, y: 61, w: 32, h: 27, mask: "rounded" },
      { x: 67, y: 61, w: 32, h: 27, mask: "rounded" },
    ],
    texts: [{ text: "{date}", x: 50, y: 95, size: 5, font: "Montserrat", bold: true, spacing: 0.25 }],
  },
  {
    id: "phim-3",
    name: "Dải phim",
    hint: "3 ảnh dọc",
    box: { w: 62, h: 132 },
    cells: [
      { x: 3, y: 3, w: 56, h: 40 },
      { x: 3, y: 46, w: 56, h: 40 },
      { x: 3, y: 89, w: 56, h: 40 },
    ],
    texts: [],
  },
  {
    id: "tron-ten",
    name: "Ảnh tròn",
    hint: "1 ảnh + tên cong",
    box: { w: 100, h: 100 },
    cells: [{ x: 16, y: 16, w: 68, h: 68, mask: "circle" }],
    texts: [
      { text: "{names}", x: 50, y: 8, size: 9, font: "Pacifico", curve: 32 },
      { text: "{date}", x: 50, y: 93, size: 5, font: "Montserrat", bold: true, spacing: 0.25 },
    ],
  },
];

export type Photo = { src: string; natW: number; natH: number };

/** Cắt ảnh phủ kín ô (giữ giữa ảnh, hơi lệch lên trên – thường là khuôn mặt) */
export function coverCrop(natW: number, natH: number, w: number, h: number): ImageCrop | undefined {
  const a = w / h;
  const ia = natW / natH;
  if (Math.abs(ia - a) < 0.01) return undefined;
  if (ia > a) {
    const cw = a / ia;
    return { x: (1 - cw) / 2, y: 0, w: cw, h: 1 };
  }
  const ch = ia / a;
  return { x: 0, y: Math.min(1 - ch, (1 - ch) * 0.35), w: 1, h: ch };
}

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};
const fill = (t: string) => t.replace("{names}", "An & Bình").replace("{date}", today());

/** Số ô ảnh của bố cục */
export const collageSlots = (c: Collage) => c.cells.length;

/**
 * Dựng lớp cho bố cục trong vùng in. `photos` thiếu ô nào thì dùng lại ảnh đầu (khách bấm ảnh → Thay ảnh).
 * `card`: ảnh khung polaroid (PNG trắng) đã tải lên; `ink`: màu chữ dễ đọc trên áo.
 */
export function buildCollage(c: Collage, area: { widthMm: number; heightMm: number }, photos: Photo[], card: Photo | null, ink: string, newId: () => string): DesignLayer[] {
  const k = Math.min((area.widthMm * 0.92) / c.box.w, (area.heightMm * 0.92) / c.box.h);
  const ox = (area.widthMm - c.box.w * k) / 2;
  const oy = (area.heightMm - c.box.h * k) / 2;
  const P = (x: number, y: number) => ({ x: ox + x * k, y: oy + y * k });
  const out: DesignLayer[] = [];
  const text = (t: Omit<Txt, "x" | "y">, at: { x: number; y: number }, color: string, rotation = 0): TextLayer => {
    const base: TextLayer = {
      id: newId(),
      type: "text",
      text: fill(t.text),
      font: t.font,
      fontSize: Math.round(t.size * k * 10) / 10,
      color,
      bold: !!t.bold,
      italic: false,
      align: "center",
      lineHeight: 1.15,
      letterSpacing: t.spacing,
      curve: t.curve,
      x: at.x,
      y: at.y,
      w: 10,
      h: 10,
      rotation,
      opacity: 1,
    };
    return { ...base, ...measureText(base) };
  };
  c.cells.forEach((cell, i) => {
    const photo = photos[i] ?? photos[i % Math.max(1, photos.length)];
    const rot = cell.rot ?? 0;
    const r = (rot * Math.PI) / 180;
    const center = P(cell.x + cell.w / 2, cell.y + cell.h / 2);
    // điểm lệch so với tâm khung (đơn vị bố cục) -> mm trên vùng in, xoay theo khung
    const at = (dx: number, dy: number) => ({ x: center.x + (dx * Math.cos(r) - dy * Math.sin(r)) * k, y: center.y + (dx * Math.sin(r) + dy * Math.cos(r)) * k });
    let pw = cell.w;
    let ph = cell.h;
    let pc = { x: center.x, y: center.y };
    if (cell.card) {
      const { pad, bottom } = cell.card;
      if (card) out.push({ id: newId(), type: "image", src: card.src, natW: card.natW, natH: card.natH, x: center.x, y: center.y, w: cell.w * k, h: cell.h * k, rotation: rot, opacity: 1 });
      pw = cell.w - pad * 2;
      ph = cell.h - pad - bottom;
      pc = at(0, -cell.h / 2 + pad + ph / 2);
    }
    if (photo) {
      out.push({
        id: newId(),
        type: "image",
        src: photo.src,
        natW: photo.natW,
        natH: photo.natH,
        crop: coverCrop(photo.natW, photo.natH, pw, ph),
        mask: cell.mask,
        x: pc.x,
        y: pc.y,
        w: pw * k,
        h: ph * k,
        rotation: rot,
        opacity: 1,
      });
    }
    if (cell.card?.caption) {
      const size = Math.min(cell.card.bottom * 0.45, 9);
      out.push(text({ text: cell.card.caption, size, font: "Dancing Script", bold: true }, at(0, cell.h / 2 - cell.card.bottom / 2), "#1d1d1f", rot));
    }
  });
  for (const t of c.texts) out.push(text(t, P(t.x, t.y), ink));
  return out;
}

/** Khung polaroid: thẻ trắng viền xám nhạt, 2400px (in nét ở mọi cỡ) */
export async function polaroidCard(): Promise<Blob> {
  const W = 2400;
  const H = 2880;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fbfaf7";
  ctx.beginPath();
  ctx.roundRect?.(6, 6, W - 12, H - 12, 28);
  if (!ctx.roundRect) ctx.rect(6, 6, W - 12, H - 12);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#d9d5cc";
  ctx.stroke();
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  c.width = c.height = 0;
  if (!blob) throw new Error("Không tạo được khung ảnh");
  return blob;
}

/** Hình minh hoạ nhỏ của bố cục */
function Thumb({ c }: { c: Collage }) {
  const pad = 4;
  const vb = `${-pad} ${-pad} ${c.box.w + pad * 2} ${c.box.h + pad * 2}`;
  return (
    <svg viewBox={vb} className="h-16 w-full" aria-hidden>
      {c.cells.map((cell, i) => {
        const cx = cell.x + cell.w / 2;
        const cy = cell.y + cell.h / 2;
        const tr = cell.rot ? `rotate(${cell.rot} ${cx} ${cy})` : undefined;
        if (cell.card) {
          const { pad: p, bottom } = cell.card;
          return (
            <g key={i} transform={tr}>
              <rect x={cell.x} y={cell.y} width={cell.w} height={cell.h} rx={2} fill="#fff" stroke="#1d1d1f" strokeOpacity={0.35} strokeWidth={1.2} />
              <rect x={cell.x + p} y={cell.y + p} width={cell.w - p * 2} height={cell.h - p - bottom} fill="#F59E7A" />
            </g>
          );
        }
        if (cell.mask === "heart") {
          const s = cell.w / 2;
          return <path key={i} d={`M${cx} ${cy + s * 0.95} C${cx - s * 1.1} ${cy + s * 0.2} ${cx - s * 1.05} ${cy - s * 0.95} ${cx - s * 0.5} ${cy - s * 0.95} C${cx - s * 0.15} ${cy - s * 0.95} ${cx} ${cy - s * 0.62} ${cx} ${cy - s * 0.5} C${cx} ${cy - s * 0.62} ${cx + s * 0.15} ${cy - s * 0.95} ${cx + s * 0.5} ${cy - s * 0.95} C${cx + s * 1.05} ${cy - s * 0.95} ${cx + s * 1.1} ${cy + s * 0.2} ${cx} ${cy + s * 0.95}Z`} fill="#F472B6" />;
        }
        if (cell.mask === "circle") return <circle key={i} cx={cx} cy={cy} r={cell.w / 2} fill="#7DD3FC" />;
        return <rect key={i} x={cell.x} y={cell.y} width={cell.w} height={cell.h} rx={cell.mask === "rounded" ? 6 : 0} fill={["#FDBA74", "#86EFAC", "#93C5FD", "#F9A8D4"][i % 4]} transform={tr} />;
      })}
      {c.texts.map((t, i) => (
        <rect key={`t${i}`} x={t.x - t.size * 2.4} y={t.y - t.size * 0.3} width={t.size * 4.8} height={t.size * 0.6} rx={1} fill="#1d1d1f" opacity={0.55} />
      ))}
    </svg>
  );
}

/** Bảng chọn bố cục ghép ảnh */
export function CollagePanel({ onPick, busy }: { onPick: (c: Collage) => void; busy: boolean }) {
  return (
    <section className="space-y-2.5">
      <div>
        <p className="text-sm font-black">Khung ghép ảnh</p>
        <p className="text-[11px] text-ink/60">Chọn bố cục → chọn ảnh từ máy. YALA tự cắt ảnh vừa từng ô, thêm tên & ngày – bấm vào chữ để sửa, bấm ảnh → “Thay ảnh” để đổi.</p>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {COLLAGES.map((c) => (
          <li key={c.id}>
            <button type="button" disabled={busy} onClick={() => onPick(c)} className="block w-full rounded-xl border-2 border-ink/10 bg-surface p-2 text-left transition hover:-translate-y-px hover:border-ink disabled:opacity-50">
              <Thumb c={c} />
              <span className="mt-1 block text-xs font-bold">{c.name}</span>
              <span className="block text-[10px] text-ink/60">
                {c.hint} · {c.cells.length} ảnh
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-ink/55">Mẹo: dùng ảnh gốc từ điện thoại (không qua Zalo/Messenger – bị nén mờ). Áo tối: khung polaroid trắng nổi bật nhất.</p>
    </section>
  );
}
