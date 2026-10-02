import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "@pod/db";
import { mergeLanding } from "@pod/shared";
import { invalidateLanding } from "./settings";

/**
 * Ảnh thật của phôi trơn YALA (dáng × màu, VD "tshirt-den") lưu ở Cài đặt → media.blanks.
 * Dùng cho: ảnh sản phẩm YALA Everyday, mockup vùng in trong Studio, ảnh xem trước mọi "mẫu có sẵn".
 * Nguồn: lệnh AI (deploy/ai-photos.sh) HOẶC tải ảnh lên tay trong CMS → Ảnh thật AI → Phôi trơn.
 */
export const BASIC_DIR = resolve(process.cwd(), "assets/basic-src");

export const GARMENT_EN: Record<string, string> = {
  tshirt: "relaxed-fit short-sleeve crew-neck cotton T-shirt",
  longsleeve: "relaxed-fit long-sleeve crew-neck cotton T-shirt",
  sweater: "crew-neck cotton fleece sweatshirt with ribbed cuffs and hem",
  hoodie: "cotton fleece pullover hoodie with drawstrings and kangaroo pocket",
  jogger: "cotton fleece jogger sweatpants with elastic waist and cuffs",
  tote: "natural canvas tote bag with two shoulder straps",
};
export const GARMENT_VI: Record<string, string> = { tshirt: "Áo thun", longsleeve: "Áo dài tay", sweater: "Sweater", hoodie: "Hoodie", jogger: "Quần jogger", tote: "Túi tote" };
export const COLOR_EN: Record<string, string> = { trang: "white", den: "black", kem: "cream / off-white", xam: "heather grey", navy: "navy blue" };
export const COLOR_VI: Record<string, string> = { trang: "Trắng", den: "Đen", kem: "Kem", xam: "Xám", navy: "Navy" };

/** các ô phôi trơn = file nguồn có trong assets/basic-src (VD tshirt-den.jpg) */
export function blankKeys(): string[] {
  if (!existsSync(BASIC_DIR)) return [];
  return readdirSync(BASIC_DIR)
    .filter((f) => /^[a-z]+-[a-z-]+\.jpg$/.test(f))
    .map((f) => f.replace(/\.jpg$/, ""))
    .sort((a, b) => Object.keys(GARMENT_EN).indexOf(a.split("-")[0]!) - Object.keys(GARMENT_EN).indexOf(b.split("-")[0]!) || a.localeCompare(b));
}

export function blankPrompt(g: string, c: string) {
  return (
    `The input image is a flat 2D illustration of a plain ${COLOR_EN[c] ?? c} ${GARMENT_EN[g] ?? g}. ` +
    `Recreate it as a photorealistic e-commerce photo of the SAME plain ${COLOR_EN[c] ?? c} ${GARMENT_EN[g] ?? g}, ` +
    "ghost-mannequin style for clothing (no person), front view. " +
    "CRITICAL: keep exactly the same framing as the input – the product must occupy the same position and the same size inside the square, centered, same silhouette and proportions. " +
    "Realistic fabric texture, seams, stitching and soft natural folds, soft even studio lighting, seamless warm light grey (#f4f2ef) background with a soft shadow under the product. " +
    "The product is completely blank: no print, no graphics, no text, no logo, no labels, no tags, no hanger. Square 1:1."
  );
}

const basicKey = (u: string) => /^\/shapes\/basic\/([a-z]+-[a-z-]+)\.svg$/.exec(u)?.[1];

/**
 * Gắn ảnh phôi thật vào sản phẩm (ảnh /shapes/basic/<dáng>-<màu>.svg) và mockup vùng in (/shapes/basic/<dáng>.svg).
 * `replaced`: ảnh cũ -> ảnh mới cho ảnh sản phẩm (khi tải lại / xoá ảnh của 1 ô đã gắn trước đó).
 * `oldMockups`: các ảnh cũ từng làm mockup vùng in -> đổi sang ảnh hiện hành của dáng.
 */
export async function applyBlankPhotos(done: Record<string, string>, opts: { dry?: boolean; replaced?: Record<string, string>; oldMockups?: string[] } = {}) {
  const replaced = opts.replaced ?? {};
  const prods = await prisma.product.findMany({ where: { images: { isEmpty: false } }, select: { id: true, images: true } });
  let swapped = 0;
  for (const p of prods) {
    const images = p.images.map((u) => {
      const k = basicKey(u);
      if (k && done[k]) return done[k]!;
      return replaced[u] ?? u;
    });
    if (images.join() === p.images.join()) continue;
    if (!opts.dry) await prisma.product.update({ where: { id: p.id }, data: { images } });
    swapped++;
  }
  let areas = 0;
  for (const g of Object.keys(GARMENT_EN)) {
    const drawn = `/shapes/basic/${g}.svg`;
    // mockup vùng in = ảnh trắng (hoặc kem) của dáng – web tự nhuộm theo màu áo khách chọn
    const target = done[`${g}-trang`] ?? done[`${g}-kem`] ?? drawn;
    const from = [drawn, ...(opts.oldMockups ?? [])].filter((u) => u !== target);
    if (opts.dry || !from.length) continue;
    areas += (await prisma.printArea.updateMany({ where: { mockupImage: { in: from } }, data: { mockupImage: target } })).count;
  }
  return { swapped, areas };
}

/** Đặt (url) hoặc xoá (null) ảnh thật cho 1 ô phôi rồi gắn vào sản phẩm/mockup */
export async function setBlankPhoto(key: string, url: string | null) {
  if (!blankKeys().includes(key)) throw new Error(`Không có phôi "${key}"`);
  const row = await prisma.setting.findUnique({ where: { key: "landing" } });
  const cur = mergeLanding(row?.value);
  const prev = cur.media.blanks[key];
  const blanks = { ...cur.media.blanks };
  if (url) blanks[key] = url;
  else delete blanks[key];
  const value = { ...cur, media: { ...cur.media, blanks } };
  await prisma.setting.upsert({ where: { key: "landing" }, update: { value }, create: { key: "landing", value } });
  invalidateLanding();
  const replaced: Record<string, string> = {};
  if (prev && prev !== url) replaced[prev] = url ?? `/shapes/basic/${key}.svg`;
  const res = await applyBlankPhotos(blanks, { replaced, oldMockups: prev ? [prev] : [] });
  return { ...res, blanks };
}
