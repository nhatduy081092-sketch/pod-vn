"use client";
/**
 * Xoá nền ảnh NGAY TRÊN MÁY KHÁCH (ảnh không gửi đi đâu để xử lý).
 * - Thư viện: Transformers.js (Apache-2.0) nạp từ CDN khi khách bấm lần đầu – không làm nặng trang.
 * - Mô hình: BiRefNet lite (giấy phép MIT), bản fp16 ~115MB, trình duyệt tự lưu cache sau lần đầu.
 * Đổi nguồn (tự host trên R2/CDN riêng): NEXT_PUBLIC_BG_MODEL_HOST + NEXT_PUBLIC_BG_MODEL_ID.
 */

const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
const MODEL_ID = process.env.NEXT_PUBLIC_BG_MODEL_ID || "onnx-community/BiRefNet_lite-ONNX";
const MODEL_HOST = process.env.NEXT_PUBLIC_BG_MODEL_HOST || "";

type RawImageLike = { width: number; height: number; channels: number; data: Uint8Array | Uint8ClampedArray; toCanvas?: () => HTMLCanvasElement | OffscreenCanvas };
type Segmenter = (input: string) => Promise<unknown>;
type TransformersModule = {
  env: { allowLocalModels: boolean; remoteHost?: string; backends?: { onnx?: { wasm?: { proxy?: boolean } } } };
  pipeline: (task: string, model: string, opts?: Record<string, unknown>) => Promise<Segmenter>;
};

let pipe: Promise<Segmenter> | null = null;

/** Thiết bị có WebGPU (nhanh hơn nhiều so với WASM) */
function hasWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export type BgProgress = (msg: string) => void;

function load(onProgress?: BgProgress): Promise<Segmenter> {
  if (pipe) return pipe;
  pipe = (async () => {
    onProgress?.("Đang tải công cụ xoá nền…");
    const mod = (await import(/* webpackIgnore: true */ TRANSFORMERS_URL)) as TransformersModule;
    mod.env.allowLocalModels = false;
    if (MODEL_HOST) mod.env.remoteHost = MODEL_HOST.replace(/\/?$/, "/");
    const files = new Map<string, number>();
    const progress_callback = (p: { status?: string; file?: string; loaded?: number; total?: number }) => {
      if (p.status !== "progress" || !p.file || !p.total) return;
      files.set(p.file, (p.loaded ?? 0) / p.total);
      const pct = Math.round((Math.min(...files.values()) || 0) * 100);
      onProgress?.(`Đang tải mô hình xoá nền lần đầu (~115MB, lần sau dùng ngay): ${pct}%`);
    };
    const opts = { dtype: "fp16", device: hasWebGPU() ? "webgpu" : "wasm", progress_callback };
    try {
      return await mod.pipeline("background-removal", MODEL_ID, opts);
    } catch (e) {
      // WebGPU lỗi trên một số máy -> thử lại bằng WASM
      if (opts.device === "webgpu") return await mod.pipeline("background-removal", MODEL_ID, { ...opts, device: "wasm" });
      throw e;
    }
  })();
  pipe.catch(() => (pipe = null));
  return pipe;
}

function toCanvas(r: RawImageLike): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = r.width;
  c.height = r.height;
  const ctx = c.getContext("2d")!;
  const rgba = new ImageData(r.width, r.height);
  const n = r.width * r.height;
  for (let i = 0; i < n; i++) {
    const s = i * r.channels;
    rgba.data[i * 4] = r.data[s]!;
    rgba.data[i * 4 + 1] = r.data[s + (r.channels > 1 ? 1 : 0)]!;
    rgba.data[i * 4 + 2] = r.data[s + (r.channels > 2 ? 2 : 0)]!;
    rgba.data[i * 4 + 3] = r.channels === 4 ? r.data[s + 3]! : 255;
  }
  ctx.putImageData(rgba, 0, 0);
  return c;
}

/**
 * Xoá nền 1 ảnh (URL cùng domain, VD /uploads/x.png?raw=1) -> PNG nền trong suốt, giữ nguyên kích thước ảnh gốc.
 */
export async function removeBackground(src: string, onProgress?: BgProgress): Promise<Blob> {
  const seg = await load(onProgress);
  onProgress?.("Đang xoá nền… (máy yếu có thể mất 10–30 giây)");
  const blob = await fetch(src).then((r) => {
    if (!r.ok) throw new Error("Không đọc được ảnh gốc");
    return r.blob();
  });
  const url = URL.createObjectURL(blob);
  try {
    const out = (await seg(url)) as RawImageLike | RawImageLike[];
    const img = Array.isArray(out) ? out[0] : out;
    if (!img || !img.data) throw new Error("Không xoá được nền ảnh này");
    let canvas = toCanvas(img);
    // đảm bảo đúng kích thước ảnh gốc (một số phiên bản trả mask theo cỡ đầu vào mô hình)
    const bmp = await createImageBitmap(blob);
    if (canvas.width !== bmp.width || canvas.height !== bmp.height) {
      const c = document.createElement("canvas");
      c.width = bmp.width;
      c.height = bmp.height;
      c.getContext("2d")!.drawImage(canvas, 0, 0, bmp.width, bmp.height);
      canvas = c;
    }
    bmp.close();
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Không xuất được ảnh"))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}
