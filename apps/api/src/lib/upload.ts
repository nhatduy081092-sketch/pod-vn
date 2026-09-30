import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { PRINT_FILE_MAX_BYTES, UPLOAD_MAX_BYTES } from "@pod/shared";
import { env } from "../env";
import { badRequest } from "./http";
import { amzDateOf, sha256Hex, signV4 } from "./sigv4";

type Ext = "png" | "jpg" | "webp";
const MIME: Record<Ext, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

/** Kiểm tra magic bytes thay vì tin Content-Type từ client. SVG bị chặn (rủi ro XSS). */
function detectImage(buf: Buffer): Ext | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

/* ---------- Driver lưu trữ ---------- */

/** Cloudflare R2 (S3-compatible). Bật khi đủ 5 biến R2_* trong .env */
const r2 = (() => {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return null;
  return { host: `${accountId}.r2.cloudflarestorage.com`, accessKeyId, secretAccessKey, bucket, publicUrl };
})();

export const storageInfo = { driver: r2 ? "r2" : "local", publicUrl: r2?.publicUrl ?? "" } as const;

async function putR2(key: string, body: Buffer, contentType: string) {
  if (!r2) throw new Error("R2 chưa cấu hình");
  const path = `/${r2.bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const payloadHash = sha256Hex(body);
  const amzDate = amzDateOf();
  const headers = {
    "content-type": contentType,
    "cache-control": "public, max-age=31536000, immutable",
    "x-amz-content-sha256": payloadHash,
  };
  const authorization = signV4({
    method: "PUT",
    host: r2.host,
    path,
    headers,
    payloadHash,
    accessKeyId: r2.accessKeyId,
    secretAccessKey: r2.secretAccessKey,
    region: "auto",
    service: "s3",
    amzDate,
  });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60_000);
  try {
    const res = await fetch(`https://${r2.host}${path}`, {
      method: "PUT",
      headers: { ...headers, "x-amz-date": amzDate, authorization },
      body: new Uint8Array(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = (await res.text().catch(() => "")).slice(0, 300);
      console.error(`[upload] R2 PUT ${key} -> ${res.status} ${text}`);
      throw new Error("Không lưu được ảnh lên kho lưu trữ, thử lại sau");
    }
  } finally {
    clearTimeout(timer);
  }
}

async function putLocal(name: string, body: Buffer) {
  const dir = resolve(env.uploadDir);
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, name), body);
}

/**
 * Lưu ảnh → luôn trả về đường dẫn "/uploads/<tên>" (DB không phụ thuộc nơi lưu).
 * - R2 bật: file nằm ở <R2_PUBLIC_URL>/uploads/<tên>; API chuyển hướng /uploads/* sang đó.
 * - Không có R2: lưu ổ đĩa (apps/api/uploads) – chỉ dùng khi dev, mất file khi redeploy container.
 */
export async function saveUpload(file: unknown, opts: { kind?: "design" | "print" } = {}): Promise<{ url: string; size: number }> {
  if (!(file instanceof File)) throw badRequest("Thiếu file (field 'file')");
  const max = opts.kind === "print" ? PRINT_FILE_MAX_BYTES : UPLOAD_MAX_BYTES;
  if (file.size > max) throw badRequest(`File tối đa ${Math.round(max / 1024 / 1024)}MB`);
  return saveBuffer(Buffer.from(await file.arrayBuffer()));
}

/** Lưu ảnh đã có sẵn trong bộ nhớ (VD ảnh AI trả về) – cùng kiểm tra định dạng & nơi lưu như upload */
export async function saveBuffer(buf: Buffer, prefix = ""): Promise<{ url: string; size: number }> {
  const ext = detectImage(buf);
  if (!ext) throw badRequest("Chỉ chấp nhận ảnh PNG, JPG hoặc WEBP");
  const name = `${prefix}${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID()}.${ext}`;
  if (r2) await putR2(`uploads/${name}`, buf, MIME[ext]);
  else await putLocal(name, buf);
  return { url: `/uploads/${name}`, size: buf.length };
}

/** URL công khai của ảnh upload trên R2 (null khi lưu local) */
export function remoteUploadUrl(name: string): string | null {
  return r2 ? `${r2.publicUrl}/uploads/${encodeURIComponent(name)}` : null;
}
