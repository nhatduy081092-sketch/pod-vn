import { HTTPException } from "hono/http-exception";

/**
 * Ảnh thật bằng AI (Google Gemini – "Nano Banana"): biến ảnh sản phẩm vẽ 2D thành ảnh chụp.
 * Đầu vào là chính ảnh 2D (đúng hoạ tiết in) -> AI giữ hoạ tiết, chỉ đổi sang chất liệu/ánh sáng thật.
 * Cấu hình: GEMINI_API_KEY (bắt buộc), GEMINI_IMAGE_MODEL (mặc định gemini-3.1-flash-lite-image = Nano Banana 2 Lite, rẻ nhất).
 * Ảnh AI luôn có watermark ẩn SynthID của Google.
 */
const KEY = () => process.env.GEMINI_API_KEY?.trim() ?? "";
export const aiPhotoModel = () => process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-3.1-flash-lite-image";
export const aiPhotoEnabled = () => KEY().length > 0;

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const TIMEOUT_MS = 100_000; // < proxy_read_timeout 120s của Nginx

export type AiPhotoStyle = "studio" | "flatlay" | "model";
export type AiPhotoProduct = { name: string; material: string; audience: string; category: string };

const WHO: Record<string, string> = {
  MEN: "a young Vietnamese man in his mid-20s",
  WOMEN: "a young Vietnamese woman in her mid-20s",
  KIDS: "a cheerful Vietnamese child about 8 years old",
  UNISEX: "a young Vietnamese adult in their mid-20s",
};

/** Phụ kiện không mặc lên người (túi, mũ, tất, khăn…) -> ảnh người mẫu đổi sang ảnh cầm/đeo tự nhiên */
const isAccessory = (p: AiPhotoProduct) => /túi|tote|mũ|nón|bucket|tất|vớ|khăn|bandana|cốc|ly|gối|ốp/i.test(`${p.name} ${p.category}`);

export function buildPrompt(p: AiPhotoProduct, style: AiPhotoStyle): string {
  const item = `"${p.name}"${p.material ? ` made of ${p.material}` : ""}`;
  const keep =
    "The input image is a flat 2D illustration of the product. Recreate it as the SAME real physical product: " +
    "keep the exact same all-over print pattern, motifs, colors, color placement, scale of the pattern and the same cut/shape. " +
    "Do not invent new graphics, do not simplify or recolor the print.";
  const clean = "No text, no letters, no logos, no brand marks, no watermark, no price tags, no hangers.";
  if (style === "flatlay") {
    return `${keep} Photorealistic top-down flat-lay product photo of ${item}, neatly laid flat with natural soft fabric wrinkles, visible stitching and fabric texture, centered, on a seamless warm off-white background, soft diffused daylight with gentle shadow. Square 1:1 e-commerce catalog photo. ${clean}`;
  }
  if (style === "model") {
    const who = WHO[p.audience] ?? WHO.UNISEX;
    const pose = isAccessory(p) ? `${who} naturally holding or wearing the product so it is clearly visible and large in frame` : `${who} wearing the product, front view, the whole garment clearly visible`;
    return `${keep} Photorealistic fashion e-commerce photo: ${pose}. Product: ${item}. Clean bright studio with a seamless light grey background, soft even lighting, natural relaxed pose, realistic skin and hands, sharp focus on the product. Square 1:1. ${clean}`;
  }
  return `${keep} Photorealistic studio product photo of ${item} in ghost-mannequin (invisible mannequin) style for garments, or standing naturally for accessories, front view, centered, realistic fabric texture, seams and natural folds, soft even studio lighting, seamless light grey (#f4f4f5) background with a soft shadow. Square 1:1 e-commerce catalog photo. ${clean}`;
}

/** Tìm ảnh base64 đầu tiên trong JSON trả về (chịu được cả API interactions lẫn generateContent) */
function findImage(node: unknown, depth = 0): { data: string; mime: string } | null {
  if (!node || typeof node !== "object" || depth > 12) return null;
  const o = node as Record<string, unknown>;
  const mime = (o.mime_type ?? o.mimeType) as string | undefined;
  if (typeof o.data === "string" && o.data.length > 1000 && (!mime || mime.startsWith("image/"))) return { data: o.data, mime: mime ?? "image/png" };
  for (const v of Object.values(o)) {
    const hit = Array.isArray(v) ? v.map((x) => findImage(x, depth + 1)).find(Boolean) : findImage(v, depth + 1);
    if (hit) return hit;
  }
  return null;
}

function findText(node: unknown, depth = 0): string {
  if (!node || typeof node !== "object" || depth > 12) return "";
  const o = node as Record<string, unknown>;
  if (typeof o.text === "string") return o.text;
  for (const v of Object.values(o)) {
    const t = Array.isArray(v) ? v.map((x) => findText(x, depth + 1)).find(Boolean) : findText(v, depth + 1);
    if (t) return t;
  }
  return "";
}

async function post(url: string, body: unknown) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": KEY() },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, json };
  } catch (e) {
    if ((e as Error).name === "AbortError") throw new HTTPException(504, { message: "AI tạo ảnh quá lâu (> 100 giây) – thử lại" });
    throw new HTTPException(502, { message: "Không kết nối được Google AI – kiểm tra mạng VPS" });
  } finally {
    clearTimeout(timer);
  }
}

function apiError(status: number, json: Record<string, unknown>): HTTPException {
  const msg = String((json.error as { message?: string } | undefined)?.message ?? "");
  console.error(`[ai-photo] Gemini ${status}: ${msg.slice(0, 300)}`);
  if (status === 400 && /api key/i.test(msg)) return new HTTPException(400, { message: "GEMINI_API_KEY không hợp lệ – kiểm tra lại trong .env.production" });
  if (status === 401 || status === 403) return new HTTPException(400, { message: "Google từ chối API key (chưa bật Gemini API hoặc chưa gắn thanh toán)" });
  // "limit: 0 … Free Tier" = project chưa gắn thanh toán -> chờ bao lâu cũng không chạy, dừng hẳn
  if (status === 429 && /limit:\s*0\b/i.test(msg) && /free tier/i.test(msg))
    return new HTTPException(400, { message: "Project Google của API key đang ở gói Free – model tạo ảnh cần bật thanh toán (Billing). Vào aistudio.google.com/apikey → Set up billing, rồi chạy lại" });
  if (status === 429) return new HTTPException(429, { message: "Vượt giới hạn Google AI (quota) – đợi 1 phút rồi thử lại" });
  if (status === 404) return new HTTPException(400, { message: `Model ${aiPhotoModel()} không tồn tại/không được phép – đổi GEMINI_IMAGE_MODEL` });
  return new HTTPException(502, { message: `Google AI lỗi ${status}${msg ? `: ${msg.slice(0, 160)}` : ""}` });
}

/**
 * Gọi Gemini: ảnh nguồn (PNG/JPG) + prompt -> ảnh mới (Buffer).
 * Thử API "interactions" (tài liệu hiện hành) trước, không được thì dùng generateContent (API cũ vẫn chạy).
 */
export async function generateAiPhoto(source: Buffer, sourceMime: string, prompt: string): Promise<Buffer> {
  if (!aiPhotoEnabled()) throw new HTTPException(400, { message: "Chưa cấu hình GEMINI_API_KEY trong .env.production" });
  const model = aiPhotoModel();
  const b64 = source.toString("base64");

  let r = await post(`${BASE}/interactions`, {
    model,
    input: [
      { type: "text", text: prompt },
      { type: "image", mime_type: sourceMime, data: b64 },
    ],
    response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: "1:1", image_size: "1K" },
  });
  let img = r.status < 300 ? findImage(r.json) : null;

  if (!img && r.status !== 401 && r.status !== 403 && r.status !== 429) {
    if (r.status >= 300) console.warn(`[ai-photo] interactions ${r.status} – thử generateContent`);
    r = await post(`${BASE}/models/${encodeURIComponent(model)}:generateContent`, {
      contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: sourceMime, data: b64 } }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "1K" } },
    });
    img = r.status < 300 ? findImage(r.json) : null;
  }
  if (r.status >= 300) throw apiError(r.status, r.json);
  if (!img) {
    const why = findText(r.json).slice(0, 200);
    throw new HTTPException(422, { message: `AI không trả về ảnh${why ? `: ${why}` : " (có thể bị bộ lọc an toàn chặn) – thử kiểu ảnh khác"}` });
  }
  return Buffer.from(img.data, "base64");
}
