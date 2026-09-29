import { env } from "./env"; // nạp .env trước tiên
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { prisma } from "@pod/db";
import { publicRoutes } from "./routes/public";
import { adminRoutes } from "./routes/admin";
import { checkoutRoutes } from "./routes/checkout";
import { accountRoutes } from "./routes/account";
import { sellerRoutes } from "./routes/seller";
import { v1Routes } from "./routes/v1";
import { backfillSearchText } from "./lib/search";
import { remoteUploadUrl, storageInfo } from "./lib/upload";

const app = new Hono();

app.use("*", logger());
app.use("*", secureHeaders({ crossOriginResourcePolicy: "cross-origin" }));
app.use(
  "/api/*",
  cors({
    origin: env.corsOrigins,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

// File tĩnh: ảnh upload + mockup
app.use("/uploads/*", async (c, next) => {
  await next();
  if (c.res.status < 400) c.header("Cache-Control", "public, max-age=31536000, immutable");
  c.header("X-Content-Type-Options", "nosniff");
});
app.use("/uploads/*", serveStatic({ root: "./" }));
// Không có file local + đang dùng R2 -> chuyển hướng sang CDN (DB luôn lưu "/uploads/<tên>")
app.get("/uploads/:name", async (c) => {
  const name = c.req.param("name");
  const url = /^[\w.-]+$/.test(name) ? remoteUploadUrl(name) : null;
  if (!url) return c.json({ error: "Không tìm thấy file" }, 404);
  // ?raw=1: trả thẳng nội dung (cùng domain) cho canvas của editor/CMS – chuyển hướng sang CDN khác domain làm canvas không xuất được file
  if (c.req.query("raw") !== "1") return c.redirect(url, 301);
  const r = await fetch(url).catch(() => null);
  if (!r?.ok || !r.body) return c.json({ error: "Không tải được file" }, 502);
  const type = r.headers.get("content-type") ?? "application/octet-stream";
  if (!/^image\/(png|jpeg|webp)$/.test(type)) return c.json({ error: "Định dạng không hỗ trợ" }, 415);
  return new Response(r.body, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
});
app.use("/mock/*", serveStatic({ root: "./public" }));

/** Health check (Docker, Nginx, deploy script) – không trả thông tin nhạy cảm */
const startedAt = Date.now();
async function health(c: Context) {
  let db = "up";
  try {
    await Promise.race([prisma.$queryRaw`SELECT 1`, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000))]);
  } catch {
    db = "down";
  }
  c.header("Cache-Control", "no-store");
  return c.json({ ok: db === "up", service: "api", db, uptimeSec: Math.round((Date.now() - startedAt) / 1000), time: new Date().toISOString() }, db === "up" ? 200 : 503);
}
app.get("/health", health);
app.get("/api/health", health);

app.route("/api", publicRoutes);
app.route("/api", checkoutRoutes);
app.route("/api/account", accountRoutes);
app.route("/api/seller", sellerRoutes);
app.route("/api/v1", v1Routes);
app.route("/api/admin", adminRoutes);

app.notFound((c) => c.json({ error: "Không tìm thấy endpoint" }, 404));

app.onError((err, c) => {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return c.json({ error: first?.message ?? "Dữ liệu không hợp lệ", issues: err.issues }, 400);
  }
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  const code = (err as { code?: string }).code;
  if (code === "P2002") return c.json({ error: "Dữ liệu bị trùng (slug/email/mã)" }, 409);
  if (code === "P2025") return c.json({ error: "Không tìm thấy bản ghi" }, 404);
  if (err instanceof SyntaxError) return c.json({ error: "JSON không hợp lệ" }, 400);
  console.error(err);
  return c.json({ error: "Lỗi hệ thống, vui lòng thử lại" }, 500);
});

const server = serve({ fetch: app.fetch, port: env.port, hostname: process.env.API_HOST ?? "0.0.0.0" }, (info) => {
  console.log(`🚀 API chạy tại http://localhost:${info.port}`);
  console.log(`[upload] lưu ảnh: ${storageInfo.driver === "r2" ? `Cloudflare R2 → ${storageInfo.publicUrl}` : "ổ đĩa local (chỉ dùng khi dev)"}`);
  backfillSearchText().catch((e) => console.warn("[search] backfill lỗi:", (e as Error).message));
});

// Tắt êm khi Docker/PM2 dừng container: ngừng nhận request, đóng kết nối DB
let closing = false;
for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => {
    if (closing) return;
    closing = true;
    console.log(`[api] nhận ${sig}, đang tắt…`);
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}
process.on("unhandledRejection", (e) => console.error("[api] unhandledRejection:", e));
