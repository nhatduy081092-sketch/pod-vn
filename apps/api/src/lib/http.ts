import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";

export const notFound = (msg = "Không tìm thấy") => new HTTPException(404, { message: msg });
export const badRequest = (msg: string) => new HTTPException(400, { message: msg });
export const conflict = (msg: string) => new HTTPException(409, { message: msg });
export const tooMany = () => new HTTPException(429, { message: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút" });

/**
 * IP khách (dùng cho rate limit/log). Production: Nginx GHI ĐÈ X-Real-IP/X-Forwarded-For bằng IP thật
 * và API không mở cổng ra Internet -> khách không giả mạo được header.
 */
export function clientIp(c: Context): string {
  const real = c.req.header("x-real-ip");
  if (real) return real.trim();
  const fwd = c.req.header("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return c.req.header("cf-connecting-ip") ?? "unknown";
}

export function pageParams(c: Context, defSize = 20) {
  const page = Math.max(1, Number(c.req.query("page") ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") ?? defSize) || defSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
