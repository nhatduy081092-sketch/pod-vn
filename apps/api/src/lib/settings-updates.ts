import { prisma } from "@pod/db";
import { mergeLanding } from "@pod/shared";
import { invalidateLanding } from "./settings";
import { applyBlankPhotos } from "./blank-photos";

/**
 * Cập nhật cài đặt theo yêu cầu của chủ shop, chạy 1 lần khi API khởi động (đánh dấu bằng Setting).
 * Sau đó sửa trong CMS vẫn được giữ nguyên – không ghi đè lại.
 */
const UPDATES: { flag: string; brand: Record<string, string>; note: string }[] = [
  {
    flag: "update:brand-contact:2026-10-01",
    brand: { hotline: "0971808330", zalo: "0971808330", address: "39 Nguyễn Văn Đậu, Phường Bình Lợi Trung, TP. Hồ Chí Minh" },
    note: "Hotline/Zalo 0971808330 + địa chỉ 39 Nguyễn Văn Đậu",
  },
  {
    flag: "update:brand-email:2026-10-02",
    brand: { email: "contact@yala.vn" },
    note: "Email liên hệ contact@yala.vn",
  },
];

async function revalidateWeb() {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return;
  const web = (process.env.WEB_INTERNAL_URL || "http://web:3000").replace(/\/$/, "");
  // web có thể đang khởi động cùng lúc -> thử lại vài lần
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const ok = await fetch(`${web}/revalidate`, { method: "POST", headers: { "x-revalidate-secret": secret } })
      .then((r) => r.ok)
      .catch(() => false);
    if (ok) return;
  }
}

/**
 * Ảnh thật phôi trơn (6 dáng × 6 màu, nền trong suốt) đi kèm bản web: /blanks/<dáng>-<màu>.webp.
 * Chỉ điền ô CHƯA có ảnh (ảnh chủ shop tải lên CMS được giữ nguyên), rồi gắn vào sản phẩm + khung Studio.
 */
const BLANK_FLAG = "update:blank-photos:2026-10-07";
const BLANK_GARMENTS = ["tshirt", "longsleeve", "sweater", "hoodie", "jogger", "tote"];
const BLANK_COLORS = ["trang", "den", "kem", "xam", "navy", "hong"];

async function applyBundledBlanks(): Promise<boolean> {
  if (await prisma.setting.findUnique({ where: { key: BLANK_FLAG } })) return false;
  const row = await prisma.setting.findUnique({ where: { key: "landing" } });
  const cur = mergeLanding(row?.value);
  const blanks = { ...cur.media.blanks };
  let n = 0;
  for (const g of BLANK_GARMENTS)
    for (const c of BLANK_COLORS) {
      const key = `${g}-${c}`;
      if (blanks[key]) continue;
      blanks[key] = `/blanks/${key}.webp`;
      n++;
    }
  const value = { ...cur, media: { ...cur.media, blanks } };
  await prisma.setting.upsert({ where: { key: "landing" }, update: { value }, create: { key: "landing", value } });
  invalidateLanding();
  const r = await applyBlankPhotos(blanks);
  await prisma.setting.create({ data: { key: BLANK_FLAG, value: { at: new Date().toISOString(), filled: n, ...r } } });
  console.log(`[settings] ảnh phôi trơn: điền ${n} ô, đổi ảnh ${r.swapped} sản phẩm, ${r.areas} khung Studio`);
  return true;
}

export async function applySettingsUpdates() {
  let changed = await applyBundledBlanks();
  for (const u of UPDATES) {
    if (await prisma.setting.findUnique({ where: { key: u.flag } })) continue;
    const row = await prisma.setting.findUnique({ where: { key: "landing" } });
    if (row) {
      // chỉ cần sửa khi đã có cài đặt lưu trong DB (chưa có thì web dùng mặc định trong code – đã cập nhật)
      const cur = mergeLanding(row.value);
      await prisma.setting.update({ where: { key: "landing" }, data: { value: { ...cur, brand: { ...cur.brand, ...u.brand } } } });
      invalidateLanding();
      changed = true;
    }
    await prisma.setting.create({ data: { key: u.flag, value: { at: new Date().toISOString(), note: u.note } } });
    console.log(`[settings] đã cập nhật: ${u.note}`);
  }
  if (changed) void revalidateWeb();
}
