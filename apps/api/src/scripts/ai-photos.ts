/**
 * Tự tạo ảnh thật (AI) cho mọi sản phẩm còn dùng ảnh vẽ 2D (/mock/*.svg) rồi gắn luôn vào sản phẩm.
 * Chạy trên VPS:  bash deploy/ai-photos.sh            (tạo + gắn)
 *                 bash deploy/ai-photos.sh --dry      (chỉ liệt kê, không tốn tiền)
 *                 bash deploy/ai-photos.sh --style=model   (ảnh người mẫu mặc; mặc định studio)
 * Ảnh lưu /uploads/ai-… -> web tự gắn nhãn "Ảnh minh hoạ" tới khi thay bằng ảnh/mockup thật.
 * Chạy lại an toàn: sản phẩm đã có ảnh AI/ảnh thật ở vị trí đầu thì bỏ qua.
 */
import "../env";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "@pod/db";
import { aiPhotoEnabled, aiPhotoModel, buildPrompt, generateAiPhoto, type AiPhotoStyle } from "../lib/ai-photo";
import { saveBuffer } from "../lib/upload";

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const KEEP_2D = args.includes("--keep-2d");
const style = (args.find((a) => a.startsWith("--style="))?.split("=")[1] ?? "studio") as AiPhotoStyle;
const SRC_DIR = resolve(process.cwd(), "assets/mock-src");
const PRICE = /pro/.test(aiPhotoModel()) ? 0.134 : /lite/.test(aiPhotoModel()) ? 0.034 : 0.067;

const mockKey = (u?: string) => /^\/mock\/([\w-]+)\.svg$/.exec(u ?? "")?.[1];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!["studio", "flatlay", "model"].includes(style)) throw new Error(`--style phải là studio | flatlay | model`);
  if (!DRY && !aiPhotoEnabled()) throw new Error("Chưa có GEMINI_API_KEY trong .env.production");

  const products = await prisma.product.findMany({
    select: { id: true, name: true, material: true, audience: true, images: true, category: { select: { name: true } } },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  const todo = products.filter((p) => {
    const k = mockKey(p.images[0]);
    return k && existsSync(resolve(SRC_DIR, `${k}.jpg`));
  });
  console.log(`Model ${aiPhotoModel()} · kiểu ${style} · ${todo.length}/${products.length} sản phẩm còn ảnh 2D · ước tính ~${(todo.length * PRICE).toFixed(2)} USD`);
  if (DRY || !todo.length) {
    for (const p of todo) console.log(`  - ${p.name}`);
    return;
  }

  let ok = 0;
  let i = 0;
  const failed: string[] = [];
  // 2 luồng song song, thử lại khi Google báo bận/giới hạn
  const worker = async () => {
    while (i < todo.length) {
      const p = todo[i++]!;
      const k = mockKey(p.images[0])!;
      const src = await readFile(resolve(SRC_DIR, `${k}.jpg`));
      const prompt = buildPrompt({ name: p.name, material: p.material, audience: p.audience, category: p.category.name }, style);
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const out = await generateAiPhoto(src, "image/jpeg", prompt);
          const { url } = await saveBuffer(out, "ai-");
          const rest = p.images.filter((u) => KEEP_2D || !mockKey(u));
          await prisma.product.update({ where: { id: p.id }, data: { images: [url, ...rest].slice(0, 12) } });
          ok++;
          console.log(`✓ [${ok + failed.length}/${todo.length}] ${p.name}`);
          break;
        } catch (e) {
          const status = (e as { status?: number }).status ?? 0;
          const msg = (e as Error).message;
          if (attempt < 3 && (status === 429 || status >= 500 || status === 0)) {
            console.log(`  … ${p.name}: ${msg} – thử lại sau ${attempt * 20}s`);
            await sleep(attempt * 20_000);
            continue;
          }
          failed.push(p.name);
          console.log(`✗ [${ok + failed.length}/${todo.length}] ${p.name}: ${msg}`);
          if (status === 400) throw e; // sai key/model -> dừng hẳn, tránh lặp lỗi 28 lần
          break;
        }
      }
    }
  };
  await Promise.all([worker(), worker()]);

  // làm mới cache web để ảnh mới hiện ngay
  const secret = process.env.REVALIDATE_SECRET;
  const web = (process.env.WEB_INTERNAL_URL || "http://web:3000").replace(/\/$/, "");
  if (secret) await fetch(`${web}/revalidate`, { method: "POST", headers: { "x-revalidate-secret": secret } }).catch(() => undefined);

  console.log(`Xong: ${ok} ảnh mới (~${(ok * PRICE).toFixed(2)} USD)${failed.length ? ` · lỗi ${failed.length}: chạy lại lệnh để thử tiếp` : ""}`);
}

main()
  .catch((e) => {
    console.error("✗", (e as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
