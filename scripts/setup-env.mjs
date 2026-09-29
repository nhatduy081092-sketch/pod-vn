// Copy .env ở root vào từng app/package (Prisma, Next.js, API đều đọc .env tại thư mục của chúng).
// Chạy: pnpm init-env   (sau khi đã tạo .env từ .env.example)
import { existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const src = resolve(root, ".env");
if (!existsSync(src)) {
  copyFileSync(resolve(root, ".env.example"), src);
  console.log("• Đã tạo .env từ .env.example — hãy sửa lại giá trị rồi chạy lại `pnpm init-env`.");
}
for (const target of ["packages/db", "apps/api", "apps/web", "apps/cms"]) {
  const dest = resolve(root, target, ".env");
  copyFileSync(src, dest);
  console.log(`✓ ${target}/.env`);
}
