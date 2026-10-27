import { prisma } from "@pod/db";
import { GROUP_MIN_LINE, mergeLanding, OLD_MIN_LINE, PAGE_KEY_PREFIX } from "@pod/shared";
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

/**
 * Định vị mới (11/10/2026): tập trung khách tập thể – đơn nhóm từ 10 sản phẩm.
 * Chỉ thay câu chữ còn GIỐNG mặc định cũ (chủ shop đã sửa trong CMS thì giữ nguyên).
 */
const PIVOT_FLAG = "update:group-pivot:2026-10-11";
const OLD = {
  seoTitle: "YALA – Tự thiết kế áo, in theo yêu cầu từ 1 chiếc",
  seoDescription:
    "Tự thiết kế áo thun, hoodie, đồng phục, túi và phụ kiện online với YALA Studio: thêm ảnh, chữ, in tên số từng người, xem trước tức thì. In từ 1 chiếc, COD toàn quốc.",
  hubTitle: "Merch & đồng phục cho team – từ 1 chiếc, thấy mockup và giá ngay",
  hubSubtitle: "Áo, túi, bình, sổ, hộp quà in logo. Đơn nhỏ đặt online, giao nhanh; đơn lớn hoặc nhiều món nhận báo giá & mockup miễn phí.",
  termValue: "Từ 1 sản phẩm",
  compareYala: "Từ 1 sản phẩm",
};

async function applyGroupPivot(): Promise<boolean> {
  if (await prisma.setting.findUnique({ where: { key: PIVOT_FLAG } })) return false;
  const row = await prisma.setting.findUnique({ where: { key: "landing" } });
  const done: string[] = [];
  if (row) {
    const cur = mergeLanding(row.value);
    const d = mergeLanding(null);
    const seo = { ...cur.seo };
    if (seo.title === OLD.seoTitle) (seo.title = d.seo.title), done.push("tiêu đề SEO");
    if (seo.description === OLD.seoDescription) (seo.description = d.seo.description), done.push("mô tả SEO");
    const hub = { ...cur.b2bHub };
    if (hub.title === OLD.hubTitle) (hub.title = d.b2bHub.title), done.push("tiêu đề trang Doanh nghiệp");
    if (hub.subtitle === OLD.hubSubtitle) (hub.subtitle = d.b2bHub.subtitle), done.push("mô tả trang Doanh nghiệp");
    const newTerm = d.b2bHub.terms.find((t) => t.label === "Số lượng tối thiểu");
    hub.terms = hub.terms.map((t) => (t.label === "Số lượng tối thiểu" && t.value === OLD.termValue && newTerm ? (done.push("điều kiện số lượng"), newTerm) : t));
    const newCmp = d.b2bHub.compare.find((c) => c.label === "Số lượng tối thiểu");
    hub.compare = hub.compare.map((c) => (c.label === "Số lượng tối thiểu" && c.yala === OLD.compareYala && newCmp ? (done.push("bảng so sánh"), newCmp) : c));
    if (done.length) {
      await prisma.setting.update({ where: { key: "landing" }, data: { value: { ...cur, seo, b2bHub: hub } } });
      invalidateLanding();
    }
  }
  await prisma.setting.create({ data: { key: PIVOT_FLAG, value: { at: new Date().toISOString(), done } } });
  console.log(`[settings] định vị áo nhóm: ${done.length ? done.join(", ") : "không có gì cần đổi"}`);
  return done.length > 0;
}

/**
 * Khối "Vì sao chọn YALA" + câu giới thiệu chân trang (11/10/2026): bỏ "In từ 1 chiếc" cho khớp định vị đơn nhóm từ 10.
 * Chỉ thay câu còn GIỐNG mặc định cũ – mục chủ shop đã sửa trong CMS giữ nguyên.
 */
const WHY_FLAG = "update:why-choose-group:2026-10-11";
const OLD_TAGLINE = "Tự thiết kế áo, túi, phụ kiện theo ý bạn ngay trên web – xem trước tức thì, in từ 1 chiếc, giao toàn quốc.";
const OLD_WHY = {
  text: "Chúng tôi tin rằng ai cũng xứng đáng có một chiếc áo mang dấu ấn riêng – giá hợp lý, chất lượng ổn định, giao nhanh.",
  items: [
    { title: "Không giới hạn số lượng", desc: "In từ 1 chiếc, giá sỉ tự động khi đặt nhiều." },
    { title: "Đồng phục in tên & số", desc: "Lớp, team, công ty – mỗi người một tên, một số, đặt trong 1 đơn." },
  ],
};

async function applyWhyChooseGroup(): Promise<boolean> {
  if (await prisma.setting.findUnique({ where: { key: WHY_FLAG } })) return false;
  const row = await prisma.setting.findUnique({ where: { key: "landing" } });
  const done: string[] = [];
  if (row) {
    const cur = mergeLanding(row.value);
    const d = mergeLanding(null).whyChoose;
    const why = { ...cur.whyChoose };
    if (why.text === OLD_WHY.text) (why.text = d.text), done.push("đoạn giới thiệu");
    why.items = why.items.map((it) => {
      const i = OLD_WHY.items.findIndex((o) => o.title === it.title && o.desc === it.desc);
      if (i === -1) return it;
      const next = d.items.find((x) => x.title === (i === 0 ? "Đơn nhóm từ 10 sản phẩm" : "In tên & số từng người"));
      if (!next) return it;
      done.push(`mục “${it.title}”`);
      return next;
    });
    const brand = { ...cur.brand };
    if (brand.tagline === OLD_TAGLINE) (brand.tagline = mergeLanding(null).brand.tagline), done.push("câu giới thiệu chân trang");
    if (done.length) {
      await prisma.setting.update({ where: { key: "landing" }, data: { value: { ...cur, brand, whyChoose: why } } });
      invalidateLanding();
    }
  }
  await prisma.setting.create({ data: { key: WHY_FLAG, value: { at: new Date().toISOString(), done } } });
  console.log(`[settings] Vì sao chọn YALA: ${done.length ? done.join(", ") : "không có gì cần đổi"}`);
  return done.length > 0;
}

/**
 * SEO trang dịp (23/10/2026): H1 /dip/20-11, /dip/tet-2027 chứa từ khoá "áo lớp 20/11", "áo gia đình Tết 2027".
 * Chỉ thay tiêu đề còn GIỐNG mặc định cũ; tiêu đề Google (seoTitle) tự lấy từ mặc định khi chưa lưu trong CMS.
 */
const CAMPAIGN_SEO_FLAG = "update:campaign-seo:2026-10-23";
const OLD_CAMPAIGN_TITLES: Record<string, string> = {
  "20-11": "Tri ân thầy cô, in lời cảm ơn",
  "tet-2027": "Áo Tết cả nhà, quà Tết in logo",
};

async function applyCampaignSeo(): Promise<boolean> {
  if (await prisma.setting.findUnique({ where: { key: CAMPAIGN_SEO_FLAG } })) return false;
  const row = await prisma.setting.findUnique({ where: { key: "landing" } });
  const done: string[] = [];
  if (row) {
    const cur = mergeLanding(row.value);
    const d = mergeLanding(null).campaigns;
    const campaigns = cur.campaigns.map((c) => {
      const next = d.find((x) => x.slug === c.slug);
      if (!next || OLD_CAMPAIGN_TITLES[c.slug] !== c.title) return c;
      done.push(`/dip/${c.slug}`);
      return { ...c, title: next.title };
    });
    if (done.length) {
      await prisma.setting.update({ where: { key: "landing" }, data: { value: { ...cur, campaigns } } });
      invalidateLanding();
    }
  }
  await prisma.setting.create({ data: { key: CAMPAIGN_SEO_FLAG, value: { at: new Date().toISOString(), done } } });
  console.log(`[settings] tiêu đề trang dịp: ${done.length ? done.join(", ") : "không có gì cần đổi"}`);
  return done.length > 0;
}

/**
 * Trang Giới thiệu (27/10/2026): bỏ "In từ 1 chiếc, không yêu cầu số lượng tối thiểu" (trái định vị đơn nhóm từ 10).
 * Chưa lưu trong CMS -> web dùng mặc định trong code (đã sửa). Đã lưu -> chỉ thay đúng dòng cũ, giữ phần chủ shop đã viết.
 */
const ABOUT_MIN_FLAG = "update:about-group-min:2026-10-27";

async function applyAboutGroupMin(): Promise<boolean> {
  if (await prisma.setting.findUnique({ where: { key: ABOUT_MIN_FLAG } })) return false;
  const key = `${PAGE_KEY_PREFIX}gioi-thieu`;
  const row = await prisma.setting.findUnique({ where: { key } });
  const page = row?.value as { content?: string } | null;
  const hit = typeof page?.content === "string" && page.content.includes(OLD_MIN_LINE);
  if (hit) await prisma.setting.update({ where: { key }, data: { value: { ...page, content: page!.content!.replace(OLD_MIN_LINE, GROUP_MIN_LINE) } } });
  await prisma.setting.create({ data: { key: ABOUT_MIN_FLAG, value: { at: new Date().toISOString(), changed: hit } } });
  console.log(`[settings] trang Giới thiệu – số lượng tối thiểu: ${hit ? "đã đổi" : "không có gì cần đổi"}`);
  return hit;
}

export async function applySettingsUpdates() {
  let changed = await applyBundledBlanks();
  if (await applyGroupPivot()) changed = true;
  if (await applyWhyChooseGroup()) changed = true;
  if (await applyCampaignSeo()) changed = true;
  if (await applyAboutGroupMin()) changed = true;
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
