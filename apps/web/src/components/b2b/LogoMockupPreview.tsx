"use client";
import { useId, useState } from "react";
import { BASIC_COLORS, GARMENT_COLORS, type ColorKey, type GarmentKey } from "@pod/shared";
import { GarmentMockup } from "../designs/GarmentMockup";

/*
 * Xem nhanh logo khách vừa chọn trên áo thun, hoodie và túi tote (kiểu Placeit / Printful):
 * dùng lại bộ vẽ GarmentMockup (ảnh phôi thật + nếp vải + rỗ mực), logo đặt theo milimét của vùng in.
 * Chỉ để xem – không đổi file gửi đi. Ảnh logo là bản đã xử lý trên máy khách (prepareLogoPreview).
 */

type Spot = "trai" | "giua";
type Box = { x: number; y: number; w: number; h: number };

const ITEMS: { garment: GarmentKey; label: string; view: [number, number, number, number]; spot: Record<Spot, Box> }[] = [
  // vùng in áo thun 300×380mm. "Ngực trái" là bên trái người mặc = bên phải người xem
  { garment: "tshirt", label: "Áo thun", view: [0.24, 0.13, 0.52, 0.52], spot: { giua: { x: 60, y: 28, w: 180, h: 160 }, trai: { x: 192, y: 22, w: 82, h: 82 } } },
  // hoodie 300×250mm, vùng in bắt đầu dưới dây mũ
  { garment: "hoodie", label: "Hoodie", view: [0.24, 0.12, 0.52, 0.52], spot: { giua: { x: 65, y: 12, w: 170, h: 140 }, trai: { x: 192, y: -8, w: 78, h: 78 } } },
  // túi tote: luôn in giữa
  { garment: "tote", label: "Túi tote", view: [0.2, 0.36, 0.6, 0.6], spot: { giua: { x: 60, y: 45, w: 180, h: 170 }, trai: { x: 60, y: 45, w: 180, h: 170 } } },
];

const COLORS = GARMENT_COLORS.tshirt;

/** Màu đang bán của từng dáng: túi tote chỉ có kem/đen -> lấy màu gần nhất */
function colorFor(g: GarmentKey, c: ColorKey): ColorKey {
  const list = GARMENT_COLORS[g];
  if (list.includes(c)) return c;
  return BASIC_COLORS[c].dark ? (list.find((k) => BASIC_COLORS[k].dark) ?? list[0]) : list[0];
}

export function LogoMockupPreview({ src, cutout }: { src: string; cutout: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [spot, setSpot] = useState<Spot>("trai");
  const [color, setColor] = useState<ColorKey>("trang");
  return (
    <div className="mt-3 rounded-2xl border border-line bg-white p-3 md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] font-semibold">Xem nhanh logo trên sản phẩm</p>
        <div className="inline-flex rounded-full border border-line p-0.5 text-sm" role="group" aria-label="Vị trí in logo">
          {(
            [
              ["trai", "Ngực trái"],
              ["giua", "Giữa ngực"],
            ] as const
          ).map(([k, t]) => (
            <button
              key={k}
              type="button"
              aria-pressed={spot === k}
              onClick={() => setSpot(k)}
              className={`rounded-full px-3 py-1.5 font-medium transition ${spot === k ? "bg-ink text-white" : "text-ink/70 hover:text-ink"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {ITEMS.map((it) => {
          const c = colorFor(it.garment, color);
          const b = it.spot[spot];
          return (
            <figure key={it.garment} className="min-w-0">
              <GarmentMockup id={`${uid}-${it.garment}`} garment={it.garment} color={c} view={it.view} className="aspect-square w-full rounded-xl bg-surface" label={`${it.label} màu ${BASIC_COLORS[c].name.toLowerCase()} in logo`}>
                <image href={src} x={b.x} y={b.y} width={b.w} height={b.h} preserveAspectRatio="xMidYMin meet" />
              </GarmentMockup>
              <figcaption className="mt-1 text-center text-xs text-muted">
                {it.label}
                {c !== color && ` · ${BASIC_COLORS[c].name.toLowerCase()}`}
              </figcaption>
            </figure>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center" role="group" aria-label="Màu áo">
        <span className="mr-1.5 text-sm text-muted">Màu áo</span>
        {COLORS.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={color === k}
            aria-label={BASIC_COLORS[k].name}
            title={BASIC_COLORS[k].name}
            onClick={() => setColor(k)}
            className="grid h-8 w-8 place-items-center rounded-full"
          >
            <span
              className={`block h-6 w-6 rounded-full border transition ${color === k ? "border-ink ring-2 ring-ink ring-offset-2" : "border-ink/20"}`}
              style={{ background: BASIC_COLORS[k].hex }}
            />
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted">
        Ảnh xem nhanh tự dựng trên máy bạn{cutout ? ", đã tạm bỏ nền trắng của logo" : ""}. YALA gửi mockup chính thức đúng kích thước và màu in sau khi nhận yêu cầu.
      </p>
    </div>
  );
}

/**
 * Chuẩn bị ảnh logo để xem trước, làm hoàn toàn trên máy khách (không tải đi đâu):
 * cắt bỏ lề thừa để logo không bị nhỏ, và nếu logo có nền trắng liền (JPG) thì loang từ mép
 * để bỏ phần nền nối với mép – phần trắng nằm trong logo được giữ.
 */
export async function prepareLogoPreview(file: File): Promise<{ src: string; cutout: boolean }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { src: URL.createObjectURL(file), cutout: false };
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  // nền trắng: hầu hết điểm ở mép đều trắng đục
  const isWhite = (i: number) => d[i + 3] > 200 && Math.min(d[i], d[i + 1], d[i + 2]) > 225;
  let edge = 0;
  let white = 0;
  let clear = 0;
  for (let x = 0; x < w; x++)
    for (const y of [0, h - 1]) {
      const i = (y * w + x) * 4;
      edge++;
      if (isWhite(i)) white++;
      if (d[i + 3] < 128) clear++;
    }
  for (let y = 0; y < h; y++)
    for (const x of [0, w - 1]) {
      const i = (y * w + x) * 4;
      edge++;
      if (isWhite(i)) white++;
      if (d[i + 3] < 128) clear++;
    }
  const cutout = clear / edge < 0.5 && white / edge > 0.9;

  if (cutout) {
    const seen = new Uint8Array(w * h);
    const stack: number[] = [];
    const push = (p: number) => {
      if (!seen[p] && isWhite(p * 4)) {
        seen[p] = 1;
        stack.push(p);
      }
    };
    for (let x = 0; x < w; x++) push(x), push((h - 1) * w + x);
    for (let y = 0; y < h; y++) push(y * w), push(y * w + w - 1);
    while (stack.length) {
      const p = stack.pop()!;
      d[p * 4 + 3] = 0;
      const x = p % w;
      if (x > 0) push(p - 1);
      if (x < w - 1) push(p + 1);
      if (p >= w) push(p - w);
      if (p < w * (h - 1)) push(p + w);
    }
    // làm mềm viền: điểm sát nền, càng trắng càng trong
    for (let p = 0; p < w * h; p++) {
      if (seen[p]) continue;
      const x = p % w;
      const near = (x > 0 && seen[p - 1]) || (x < w - 1 && seen[p + 1]) || (p >= w && seen[p - w]) || (p < w * (h - 1) && seen[p + w]);
      if (!near) continue;
      const i = p * 4;
      const m = Math.min(d[i], d[i + 1], d[i + 2]);
      d[i + 3] = Math.round(d[i + 3] * Math.min(1, (255 - m) / 90));
    }
    ctx.putImageData(img, 0, 0);
  }

  // cắt lề trong suốt
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (d[(y * w + x) * 4 + 3] > 16) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return { src: URL.createObjectURL(file), cutout: false };
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext("2d")!.drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return { src: out.toDataURL("image/png"), cutout };
}
