// Phải được import ĐẦU TIÊN trong index.ts để nạp .env trước khi Prisma khởi tạo.
import { existsSync } from "node:fs";

console.log("[api] khởi động... cwd =", process.cwd());

if (existsSync(".env")) {
  try {
    process.loadEnvFile(".env");
  } catch {
    /* bỏ qua */
  }
}

const isProd = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET ?? "";
if (jwtSecret.length < 32) {
  const msg = "JWT_SECRET phải dài ít nhất 32 ký tự (xem .env.example)";
  if (isProd) throw new Error(msg);
  console.warn("⚠️  " + msg);
}

export const env = {
  isProd,
  port: Number(process.env.API_PORT ?? 4000),
  jwtSecret: jwtSecret || "dev-only-insecure-secret-change-me-please-32chars",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
};
