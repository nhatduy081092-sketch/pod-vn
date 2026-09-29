import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { sign, verify } from "hono/jwt";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@pod/db";
import { env } from "../env";

/**
 * Phiên đăng nhập của KHÁCH/SELLER (tách biệt admin):
 * - JWT typ="customer" trong cookie httpOnly "pod_session" (web gọi API cùng origin qua rewrite /api/*)
 * - Hoặc header Authorization: Bearer <jwt> (app/mobile)
 * API key của seller (Open API) xử lý riêng ở requireApiKey.
 */
export const SESSION_COOKIE = "pod_session";
const TTL = 60 * 60 * 24 * 30; // 30 ngày

export type CustomerCtx = { id: string; phone: string; name: string };
export type SellerCtx = CustomerCtx & { discountPercent: number; webhookUrl: string; webhookSecret: string };
export type CustomerVars = { Variables: { customer: CustomerCtx } };
export type SellerVars = { Variables: { customer: CustomerCtx; seller: SellerCtx } };

export async function issueSession(c: Context, customerId: string) {
  const token = await sign({ sub: customerId, typ: "customer", exp: Math.floor(Date.now() / 1000) + TTL }, env.jwtSecret, "HS256");
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    secure: env.isProd,
    path: "/",
    maxAge: TTL,
  });
  return token;
}

export function clearSession(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}

async function readCustomerId(c: Context): Promise<string | null> {
  const header = c.req.header("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") && !header.startsWith("Bearer pk_") ? header.slice(7) : "";
  const token = bearer || getCookie(c, SESSION_COOKIE) || "";
  if (!token) return null;
  try {
    const claims = (await verify(token, env.jwtSecret, "HS256")) as { sub?: string; typ?: string };
    return claims.typ === "customer" && claims.sub ? claims.sub : null;
  } catch {
    return null;
  }
}

/** Gắn khách vào context nếu đã đăng nhập (không bắt buộc) */
export async function currentCustomer(c: Context): Promise<CustomerCtx | null> {
  const id = await readCustomerId(c);
  if (!id) return null;
  const cu = await prisma.customer.findUnique({ where: { id }, select: { id: true, phone: true, name: true, isActive: true } });
  return cu && cu.isActive ? { id: cu.id, phone: cu.phone, name: cu.name } : null;
}

export const requireCustomer: MiddlewareHandler<CustomerVars> = async (c, next) => {
  const cu = await currentCustomer(c);
  if (!cu) throw new HTTPException(401, { message: "Vui lòng đăng nhập" });
  c.set("customer", cu);
  await next();
};

export async function loadSeller(customerId: string): Promise<Omit<SellerCtx, keyof CustomerCtx> | null> {
  const s = await prisma.sellerProfile.findUnique({
    where: { customerId },
    select: { status: true, discountPercent: true, webhookUrl: true, webhookSecret: true },
  });
  return s && s.status === "APPROVED" ? { discountPercent: s.discountPercent, webhookUrl: s.webhookUrl, webhookSecret: s.webhookSecret } : null;
}

export const requireSeller: MiddlewareHandler<SellerVars> = async (c, next) => {
  const cu = await currentCustomer(c);
  if (!cu) throw new HTTPException(401, { message: "Vui lòng đăng nhập" });
  const s = await loadSeller(cu.id);
  if (!s) throw new HTTPException(403, { message: "Tài khoản seller chưa được duyệt" });
  c.set("customer", cu);
  c.set("seller", { ...cu, ...s });
  await next();
};

/* ---------- API key (Open API cho seller) ---------- */

export const hashApiKey = (key: string) => createHash("sha256").update(key).digest("hex");

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `pk_live_${randomBytes(24).toString("base64url")}`;
  return { key, prefix: key.slice(0, 14), hash: hashApiKey(key) };
}

const lastTouch = new Map<string, number>();

export const requireApiKey: MiddlewareHandler<SellerVars> = async (c, next) => {
  const header = c.req.header("authorization") ?? "";
  const key = header.startsWith("Bearer ") ? header.slice(7).trim() : (c.req.header("x-api-key") ?? "").trim();
  if (!key.startsWith("pk_")) throw new HTTPException(401, { message: "Thiếu API key (Authorization: Bearer pk_live_...)" });
  const row = await prisma.apiKey.findUnique({
    where: { hash: hashApiKey(key) },
    select: { id: true, revokedAt: true, customer: { select: { id: true, phone: true, name: true, isActive: true } } },
  });
  if (!row || row.revokedAt || !row.customer.isActive) throw new HTTPException(401, { message: "API key không hợp lệ hoặc đã thu hồi" });
  const s = await loadSeller(row.customer.id);
  if (!s) throw new HTTPException(403, { message: "Tài khoản seller chưa được duyệt hoặc đang tạm khoá" });
  // cập nhật lastUsedAt tối đa 1 lần/phút/key
  const now = Date.now();
  if ((lastTouch.get(row.id) ?? 0) < now - 60_000) {
    lastTouch.set(row.id, now);
    prisma.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
  }
  const cu = { id: row.customer.id, phone: row.customer.phone, name: row.customer.name };
  c.set("customer", cu);
  c.set("seller", { ...cu, ...s });
  await next();
};
