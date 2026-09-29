import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { sign, verify } from "hono/jwt";
import { prisma } from "@pod/db";
import { env } from "../env";

export type AdminClaims = { sub: string; email: string; exp: number; typ?: "admin" };

const TOKEN_TTL = 60 * 60 * 24 * 7; // 7 ngày

export async function signAdminToken(user: { id: string; email: string }) {
  const payload: AdminClaims = { sub: user.id, email: user.email, typ: "admin", exp: Math.floor(Date.now() / 1000) + TOKEN_TTL };
  return sign(payload, env.jwtSecret, "HS256");
}

/**
 * Chỉ nhận token admin. Token khách (typ="customer") ký cùng secret nên PHẢI bị từ chối,
 * và tài khoản admin phải còn tồn tại (xoá admin = thu hồi phiên).
 */
export const requireAdmin: MiddlewareHandler<{ Variables: { admin: AdminClaims } }> = async (c, next) => {
  const header = c.req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HTTPException(401, { message: "Chưa đăng nhập" });
  let claims: AdminClaims & { typ?: string };
  try {
    claims = (await verify(token, env.jwtSecret, "HS256")) as unknown as AdminClaims & { typ?: string };
  } catch {
    throw new HTTPException(401, { message: "Phiên đăng nhập hết hạn" });
  }
  if ((claims.typ && claims.typ !== "admin") || !claims.email) throw new HTTPException(401, { message: "Phiên đăng nhập không hợp lệ" });
  const exists = await prisma.adminUser.findUnique({ where: { id: claims.sub }, select: { id: true } });
  if (!exists) throw new HTTPException(401, { message: "Tài khoản quản trị không còn tồn tại" });
  c.set("admin", claims);
  await next();
};
