/**
 * Biến ảnh chụp thành tranh vẽ – chạy hoàn toàn trên máy khách (miễn phí, không gửi ảnh đi đâu).
 * Kết quả PNG; các kiểu 1 màu có nền trong suốt để in thẳng lên áo/túi/cốc.
 */
import { imgSize, type Img } from "./render";

export const ART_STYLES = [
  { id: "line", label: "Nét vẽ", hint: "nét mực, nền trong" },
  { id: "sketch", label: "Phác chì", hint: "bút chì, nền trong" },
  { id: "stencil", label: "Pop-art", hint: "1 màu đậm" },
  { id: "halftone", label: "Chấm in", hint: "chấm tròn retro" },
  { id: "cartoon", label: "Hoạt hình", hint: "màu phẳng + viền" },
] as const;
export type ArtStyle = (typeof ART_STYLES)[number]["id"];

const MAX = 1800;

function grayOf(d: Uint8ClampedArray, n: number) {
  const g = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = d[i * 4 + 3]! / 255;
    // vùng trong suốt (ảnh đã xoá nền) coi như nền trắng
    g[i] = (0.299 * d[i * 4]! + 0.587 * d[i * 4 + 1]! + 0.114 * d[i * 4 + 2]!) * a + 255 * (1 - a);
  }
  return g;
}

/** Làm mờ hộp 3 lượt ≈ Gaussian (tách ngang/dọc, O(n)) */
function blur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  if (r < 1) return src.slice();
  let a = src.slice();
  let b = new Float32Array(src.length);
  const rr = Math.max(1, Math.round(r));
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) {
      let acc = 0;
      const row = y * w;
      for (let x = -rr; x <= rr; x++) acc += a[row + Math.min(w - 1, Math.max(0, x))]!;
      for (let x = 0; x < w; x++) {
        b[row + x] = acc / (2 * rr + 1);
        acc += a[row + Math.min(w - 1, x + rr + 1)]! - a[row + Math.max(0, x - rr)]!;
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -rr; y <= rr; y++) acc += b[Math.min(h - 1, Math.max(0, y)) * w + x]!;
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc / (2 * rr + 1);
        acc += b[Math.min(h - 1, y + rr + 1) * w + x]! - b[Math.max(0, y - rr) * w + x]!;
      }
    }
  }
  return a;
}

/** Ngưỡng Otsu cho ảnh xám 0–255 */
function otsu(g: Float32Array): number {
  const hist = new Array<number>(256).fill(0);
  for (const v of g) hist[Math.max(0, Math.min(255, v | 0))]!++;
  const total = g.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i]!;
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let t = 128;
  for (let i = 0; i < 256; i++) {
    wB += hist[i]!;
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += i * hist[i]!;
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) {
      best = between;
      t = i;
    }
  }
  return t;
}

const hexRgb = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

/** Đường viền kiểu XDoG: hiệu 2 lớp mờ -> nét mực */
function dogLines(g: Float32Array, w: number, h: number, scale: number): Float32Array {
  const s = Math.max(1, scale);
  const g1 = blur(g, w, h, 0.8 * s);
  const g2 = blur(g, w, h, 1.6 * s);
  const out = new Float32Array(g.length);
  // bỏ dải sát mép ảnh (làm mờ ở mép tạo đường kẻ giả)
  const m = Math.ceil(3 * s);
  for (let y = m; y < h - m; y++)
    for (let x = m; x < w - m; x++) {
      const i = y * w + x;
      const d = g1[i]! - 0.985 * g2[i]!;
      // d âm mạnh = cạnh tối -> mực đậm (0..1)
      out[i] = d < -1.5 ? Math.min(1, (-d - 1.5) / 6) : 0;
    }
  return out;
}

/**
 * Áp kiểu tranh cho ảnh. `ink`: màu mực cho kiểu 1 màu (trắng trên áo tối, đen trên áo sáng).
 */
export async function artify(img: Img, style: ArtStyle, ink: string): Promise<{ blob: Blob; w: number; h: number }> {
  const { w: nw, h: nh } = imgSize(img);
  const k = Math.min(1, MAX / Math.max(nw, nh));
  const w = Math.max(1, Math.round(nw * k));
  const h = Math.max(1, Math.round(nh * k));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Thiết bị không hỗ trợ xử lý ảnh");
  ctx.drawImage(img, 0, 0, w, h);
  const src = ctx.getImageData(0, 0, w, h);
  const d = src.data;
  const n = w * h;
  const g = grayOf(d, n);
  const alphaIn = new Uint8ClampedArray(n);
  for (let i = 0; i < n; i++) alphaIn[i] = d[i * 4 + 3]!;
  const out = ctx.createImageData(w, h);
  const o = out.data;
  const [ir, ig, ib] = hexRgb(ink);
  const scale = Math.max(1, Math.max(w, h) / 900);
  // tránh tốn CPU khiến trình duyệt "đơ": nhường 1 nhịp trước khi tính
  await new Promise((r) => setTimeout(r, 30));

  if (style === "line") {
    const lines = dogLines(g, w, h, scale);
    for (let i = 0; i < n; i++) {
      o[i * 4] = ir;
      o[i * 4 + 1] = ig;
      o[i * 4 + 2] = ib;
      o[i * 4 + 3] = Math.round(lines[i]! * 255);
    }
  } else if (style === "sketch") {
    const inv = new Float32Array(n);
    for (let i = 0; i < n; i++) inv[i] = 255 - g[i]!;
    const bl = blur(inv, w, h, 6 * scale);
    for (let i = 0; i < n; i++) {
      const v = Math.min(255, (g[i]! * 255) / Math.max(1, 255 - bl[i]!));
      const dark = Math.max(0, 1 - v / 255);
      o[i * 4] = ir;
      o[i * 4 + 1] = ig;
      o[i * 4 + 2] = ib;
      o[i * 4 + 3] = Math.round(Math.min(1, dark * 1.6) * 255);
    }
  } else if (style === "stencil") {
    const bl = blur(g, w, h, 1.2 * scale);
    const t = otsu(bl);
    for (let i = 0; i < n; i++) {
      const on = bl[i]! < t && alphaIn[i]! > 40;
      o[i * 4] = ir;
      o[i * 4 + 1] = ig;
      o[i * 4 + 2] = ib;
      o[i * 4 + 3] = on ? 255 : 0;
    }
  } else if (style === "halftone") {
    const cell = Math.max(6, Math.round(Math.max(w, h) / 90));
    const bl = blur(g, w, h, cell / 3);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = ink;
    for (let y = cell / 2; y < h; y += cell)
      for (let x = cell / 2; x < w; x += cell) {
        const i = Math.min(h - 1, y | 0) * w + Math.min(w - 1, x | 0);
        if (alphaIn[i]! < 40) continue;
        const dark = 1 - bl[i]! / 255;
        const r = (cell / 2) * Math.sqrt(Math.max(0, dark)) * 1.08;
        if (r < 0.6) continue;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
    c.width = c.height = 0;
    if (!blob) throw new Error("Không xuất được ảnh");
    return { blob, w, h };
  } else {
    // hoạt hình: làm mịn màu + giảm số màu + viền mực
    const ch = [0, 1, 2].map((j) => {
      const a = new Float32Array(n);
      for (let i = 0; i < n; i++) a[i] = d[i * 4 + j]!;
      return blur(a, w, h, 2 * scale);
    });
    const lines = dogLines(g, w, h, scale);
    const lv = 6;
    const q = (v: number) => Math.round(Math.round((v / 255) * (lv - 1)) * (255 / (lv - 1)));
    for (let i = 0; i < n; i++) {
      const e = lines[i]!;
      for (let j = 0; j < 3; j++) o[i * 4 + j] = Math.round(q(ch[j]![i]!) * (1 - e) + 24 * e);
      o[i * 4 + 3] = alphaIn[i]!;
    }
  }
  ctx.putImageData(out, 0, 0);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  c.width = c.height = 0;
  if (!blob) throw new Error("Không xuất được ảnh");
  return { blob, w, h };
}
