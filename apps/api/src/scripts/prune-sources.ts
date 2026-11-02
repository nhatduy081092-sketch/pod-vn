/**
 * Dọn chi tiết nguồn khách (cột utm: utm_*, mã click fbclid/gclid/ttclid, trang dẫn tới, trang vào) của đơn cũ hơn 90 ngày.
 * Giữ lại nhóm nguồn (sourceGroup, firstSourceGroup) và tên miền dẫn tới -> báo cáo "Nguồn khách" trong CMS vẫn đúng.
 * Trang /do-luong trên web ghi đúng thời hạn này (SOURCE_DAYS trong apps/web/src/lib/track.ts) – đổi một bên thì sửa cả bên kia.
 * Chạy trên VPS:  bash deploy/prune-sources.sh            (chạy thử: chỉ đếm, không đổi gì)
 *                 bash deploy/prune-sources.sh --apply    (dọn thật)
 * Chạy lại an toàn: đơn đã dọn không bị đụng lại.
 */
import "../env";
import { prisma } from "@pod/db";

const DAYS = 90;
const APPLY = process.argv.includes("--apply");

async function main() {
  const cutoff = new Date(Date.now() - DAYS * 86400_000);
  const [{ n }] = await prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*)::bigint AS n FROM "Order" WHERE "createdAt" < ${cutoff} AND "utm" IS NOT NULL`;
  const at = cutoff.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  if (!APPLY) {
    console.log(`[prune-sources] chạy thử: ${n} đơn đặt trước ${at} còn chi tiết nguồn. Thêm --apply để dọn.`);
    return;
  }
  const done = await prisma.$executeRaw`UPDATE "Order" SET "utm" = NULL WHERE "createdAt" < ${cutoff} AND "utm" IS NOT NULL`;
  console.log(`[prune-sources] đã dọn chi tiết nguồn của ${done} đơn đặt trước ${at}.`);
}

main()
  .catch((e) => {
    console.error("[prune-sources]", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
