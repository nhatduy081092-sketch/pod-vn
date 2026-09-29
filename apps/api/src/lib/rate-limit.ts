import type { MiddlewareHandler } from "hono";
import { clientIp, tooMany } from "./http";

/**
 * Rate limit in-memory (đủ cho 1 instance). Khi scale nhiều instance -> chuyển sang Redis/Upstash.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(opts: { key: string; limit: number; windowMs: number }): MiddlewareHandler {
  return async (c, next) => {
    const k = `${opts.key}:${clientIp(c)}`;
    const now = Date.now();
    const b = buckets.get(k);
    if (!b || b.resetAt < now) {
      buckets.set(k, { count: 1, resetAt: now + opts.windowMs });
    } else if (++b.count > opts.limit) {
      throw tooMany();
    }
    await next();
  };
}

// dọn bucket hết hạn mỗi 5 phút
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
}, 5 * 60_000).unref();
