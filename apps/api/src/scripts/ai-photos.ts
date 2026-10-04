/**
 * Tự tạo ảnh thật (AI) cho mọi chỗ còn dùng ảnh vẽ 2D rồi gắn luôn vào website:
 *   1. Phôi trơn YALA (áo thun, dài tay, sweater, hoodie, jogger, tote × 5 màu) -> ảnh thật cùng khung hình
 *      -> dùng cho ảnh sản phẩm YALA Everyday, ảnh mockup trong Studio và ảnh xem trước mọi "mẫu có sẵn"
 *   2. Sản phẩm in toàn thân còn ảnh vẽ (/mock/*.svg)
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
import { mergeLanding } from "@pod/shared";
import { aiPhotoBudget, aiPhotoEnabled, aiPhotoModel, aiPhotoSpent, aiPhotoUnitPrice, buildPrompt, generateAiPhoto, type AiPhotoStyle } from "../lib/ai-photo";
import { saveBuffer } from "../lib/upload";
import { applyBlankPhotos, BASIC_DIR, blankKeys, blankPrompt } from "../lib/blank-photos";

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const KEEP_2D = args.includes("--keep-2d");
const style = (args.find((a) => a.startsWith("--style="))?.split("=")[1] ?? "studio") as AiPhotoStyle;
const SRC_DIR = resolve(process.cwd(), "assets/mock-src");
const ONLY = args.find((a) => a.startsWith("--only="))?.split("=")[1] ?? ""; // blanks | products
const PRICE = aiPhotoUnitPrice();

const mockKey = (u?: string) => /^\/mock\/([\w-]+)\.svg$/.exec(u ?? "")?.[1];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Bước 1: phôi trơn ảnh thật -> lưu vào Cài đặt (media.blanks) + gắn cho YALA Everyday & mockup Studio */
async function blanks() {
  let stopErr: unknown = null;
  const keys = blankKeys();
  const row = await prisma.setting.findUnique({ where: { key: "landing" } });
  const cur = mergeLanding(row?.value);
  const done = { ...cur.media.blanks };
  const todo = keys.filter((k) => !done[k]);
  console.log(`[Phôi trơn] ${todo.length}/${keys.length} ảnh cần tạo · ước tính ~${(todo.length * PRICE).toFixed(2)} USD`);
  if (!DRY) {
    let i = 0;
    const worker = async () => {
      while (i < todo.length) {
        const key = todo[i++]!;
        const [g, ...rest] = key.split("-");
        const c = rest.join("-");
        const src = await readFile(resolve(BASIC_DIR, `${key}.jpg`));
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const out = await generateAiPhoto(src, "image/jpeg", blankPrompt(g!, c));
            const { url } = await saveBuffer(out, "ai-");
            done[key] = url;
            // lưu dần sau mỗi ảnh -> dừng giữa chừng không mất tiền đã tốn
            const latest = mergeLanding((await prisma.setting.findUnique({ where: { key: "landing" } }))?.value);
            const value = { ...latest, media: { ...latest.media, blanks: { ...latest.media.blanks, [key]: url } } };
            await prisma.setting.upsert({ where: { key: "landing" }, update: { value }, create: { key: "landing", value } });
            console.log(`✓ phôi ${key}`);
            break;
          } catch (e) {
            const status = (e as { status?: number }).status ?? 0;
            if (attempt < 3 && (status === 429 || status >= 500 || status === 0)) {
              await sleep(attempt * 20_000);
              continue;
            }
            console.log(`✗ phôi ${key}: ${(e as Error).message}`);
            if (status === 400) throw e;
            break;
          }
        }
      }
    };
    // lỗi dừng hẳn (sai key, chạm hạn mức…) vẫn gắn những ảnh đã tạo xong trước khi dừng
    stopErr = await Promise.all([worker(), worker()]).then(() => null, (e: unknown) => e);
  }
  const { swapped, areas } = await applyBlankPhotos(done, { dry: DRY });
  if (stopErr) {
    console.log(`[Phôi trơn] gắn ảnh thật cho ${swapped} sản phẩm, ${areas} mockup vùng in (dừng giữa chừng)`);
    throw stopErr;
  }
  console.log(`[Phôi trơn] gắn ảnh thật cho ${swapped} sản phẩm, ${areas} mockup vùng in`);
}

async function main() {
  if (!["studio", "flatlay", "model"].includes(style)) throw new Error(`--style phải là studio | flatlay | model`);
  if (!DRY && !aiPhotoEnabled()) throw new Error("Chưa có OPENAI_API_KEY (hoặc GEMINI_API_KEY) trong .env.production");
  const spent = await aiPhotoSpent();
  console.log(`Hạn mức chi AI: ${aiPhotoBudget()} USD · đã dùng ~${spent.toFixed(2)} USD · còn ~${Math.max(0, aiPhotoBudget() - spent).toFixed(2)} USD (~${Math.floor(Math.max(0, aiPhotoBudget() - spent) / PRICE)} ảnh)`);
  if (ONLY !== "products") await blanks();
  if (ONLY === "blanks") return revalidate();

  const products = await prisma.product.findMany({
    select: { id: true, name: true, material: true, audience: true, images: true, category: { select: { name: true } } },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  const todo = products.filter((p) => {
    const k = mockKey(p.images[0]);
    return k && existsSync(resolve(SRC_DIR, `${k}.jpg`));
  });
  console.log(`[Sản phẩm] Model ${aiPhotoModel()} · kiểu ${style} · ${todo.length}/${products.length} sản phẩm còn ảnh hoạ tiết 2D · ước tính ~${(todo.length * PRICE).toFixed(2)} USD`);
  if (DRY || !todo.length) {
    for (const p of todo) console.log(`  - ${p.name}`);
    return revalidate();
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

  await revalidate();

  console.log(`Xong: ${ok} ảnh mới (~${(ok * PRICE).toFixed(2)} USD) · tổng đã dùng ~${(await aiPhotoSpent()).toFixed(2)}/${aiPhotoBudget()} USD${failed.length ? ` · lỗi ${failed.length}: chạy lại lệnh để thử tiếp` : ""}`);
}

/** làm mới cache web để ảnh mới hiện ngay */
async function revalidate() {
  const secret = process.env.REVALIDATE_SECRET;
  const web = (process.env.WEB_INTERNAL_URL || "http://web:3000").replace(/\/$/, "");
  if (secret && !DRY) await fetch(`${web}/revalidate`, { method: "POST", headers: { "x-revalidate-secret": secret } }).catch(() => undefined);
}

main()
  .catch((e) => {
    console.error("✗", (e as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
