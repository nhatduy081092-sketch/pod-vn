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
import { readdirSync } from "node:fs";
import { mergeLanding } from "@pod/shared";
import { aiPhotoEnabled, aiPhotoModel, buildPrompt, generateAiPhoto, type AiPhotoStyle } from "../lib/ai-photo";
import { saveBuffer } from "../lib/upload";

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const KEEP_2D = args.includes("--keep-2d");
const style = (args.find((a) => a.startsWith("--style="))?.split("=")[1] ?? "studio") as AiPhotoStyle;
const SRC_DIR = resolve(process.cwd(), "assets/mock-src");
const BASIC_DIR = resolve(process.cwd(), "assets/basic-src");
const ONLY = args.find((a) => a.startsWith("--only="))?.split("=")[1] ?? ""; // blanks | products
const PRICE = /pro/.test(aiPhotoModel()) ? 0.134 : /lite/.test(aiPhotoModel()) ? 0.034 : 0.067;

const mockKey = (u?: string) => /^\/mock\/([\w-]+)\.svg$/.exec(u ?? "")?.[1];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const GARMENT_EN: Record<string, string> = {
  tshirt: "relaxed-fit short-sleeve crew-neck cotton T-shirt",
  longsleeve: "relaxed-fit long-sleeve crew-neck cotton T-shirt",
  sweater: "crew-neck cotton fleece sweatshirt with ribbed cuffs and hem",
  hoodie: "cotton fleece pullover hoodie with drawstrings and kangaroo pocket",
  jogger: "cotton fleece jogger sweatpants with elastic waist and cuffs",
  tote: "natural canvas tote bag with two shoulder straps",
};
const COLOR_EN: Record<string, string> = { trang: "white", den: "black", kem: "cream / off-white", xam: "heather grey", navy: "navy blue" };

function blankPrompt(g: string, c: string) {
  return (
    `The input image is a flat 2D illustration of a plain ${COLOR_EN[c] ?? c} ${GARMENT_EN[g] ?? g}. ` +
    `Recreate it as a photorealistic e-commerce photo of the SAME plain ${COLOR_EN[c] ?? c} ${GARMENT_EN[g] ?? g}, ` +
    "ghost-mannequin style for clothing (no person), front view. " +
    "CRITICAL: keep exactly the same framing as the input – the product must occupy the same position and the same size inside the square, centered, same silhouette and proportions. " +
    "Realistic fabric texture, seams, stitching and soft natural folds, soft even studio lighting, seamless warm light grey (#f4f2ef) background with a soft shadow under the product. " +
    "The product is completely blank: no print, no graphics, no text, no logo, no labels, no tags, no hanger. Square 1:1."
  );
}

/** Bước 1: phôi trơn ảnh thật -> lưu vào Cài đặt (media.blanks) + gắn cho YALA Everyday & mockup Studio */
async function blanks() {
  const files = existsSync(BASIC_DIR) ? readdirSync(BASIC_DIR).filter((f) => /^[a-z]+-[a-z-]+\.jpg$/.test(f)) : [];
  const row = await prisma.setting.findUnique({ where: { key: "landing" } });
  const cur = mergeLanding(row?.value);
  const done = { ...cur.media.blanks };
  const todo = files.map((f) => f.replace(/\.jpg$/, "")).filter((k) => !done[k]);
  console.log(`[Phôi trơn] ${todo.length}/${files.length} ảnh cần tạo · ước tính ~${(todo.length * PRICE).toFixed(2)} USD`);
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
    await Promise.all([worker(), worker()]);
  }
  // gắn ảnh thật cho sản phẩm đang dùng phôi vẽ /shapes/basic/<dáng>-<màu>.svg + mockup vùng in /shapes/basic/<dáng>.svg
  const basicKey = (u: string) => /^\/shapes\/basic\/([a-z]+-[a-z-]+)\.svg$/.exec(u)?.[1];
  const prods = await prisma.product.findMany({ where: { images: { isEmpty: false } }, select: { id: true, name: true, images: true } });
  let swapped = 0;
  for (const p of prods) {
    if (!p.images.some((u) => basicKey(u))) continue;
    const images = p.images.map((u) => (basicKey(u) && done[basicKey(u)!] ? done[basicKey(u)!]! : u));
    if (images.join() === p.images.join()) continue;
    if (!DRY) await prisma.product.update({ where: { id: p.id }, data: { images } });
    swapped++;
  }
  let areas = 0;
  for (const g of Object.keys(GARMENT_EN)) {
    const photo = done[`${g}-trang`] ?? done[`${g}-kem`];
    if (!photo) continue;
    if (!DRY) areas += (await prisma.printArea.updateMany({ where: { mockupImage: `/shapes/basic/${g}.svg` }, data: { mockupImage: photo } })).count;
  }
  console.log(`[Phôi trơn] gắn ảnh thật cho ${swapped} sản phẩm, ${areas} mockup vùng in`);
}

async function main() {
  if (!["studio", "flatlay", "model"].includes(style)) throw new Error(`--style phải là studio | flatlay | model`);
  if (!DRY && !aiPhotoEnabled()) throw new Error("Chưa có GEMINI_API_KEY trong .env.production");
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

  console.log(`Xong: ${ok} ảnh mới (~${(ok * PRICE).toFixed(2)} USD)${failed.length ? ` · lỗi ${failed.length}: chạy lại lệnh để thử tiếp` : ""}`);
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
