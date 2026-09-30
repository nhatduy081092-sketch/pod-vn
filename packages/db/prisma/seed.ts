/**
 * Seed dữ liệu mẫu tiếng Việt.
 * Chạy: pnpm db:seed   (idempotent – upsert theo slug)
 */
import { PrismaClient, type Audience } from "@prisma/client";
import { DEFAULT_LANDING, mergeLanding, slugify, toSearchText, DEFAULT_SIZES, KIDS_SIZES } from "@pod/shared";
import { hashPassword } from "../src/password";
import { MOCKS } from "./mockups";
import { HELP_SEED } from "./help-seed";

import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";

if (existsSync(".env")) process.loadEnvFile(".env"); // DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD
const prisma = new PrismaClient();

const TIERS = (base: number) => [
  { minQty: 10, price: Math.round((base * 0.9) / 1000) * 1000 },
  { minQty: 50, price: Math.round((base * 0.8) / 1000) * 1000 },
  { minQty: 100, price: Math.round((base * 0.75) / 1000) * 1000 },
];
const compareAt = (price: number) => Math.round(price / 0.8 / 1000) * 1000;

type SeedProduct = {
  name: string;
  mock: string;
  price: number;
  audience: Audience;
  material: string;
  bestSeller?: boolean;
  kids?: boolean;
  colors?: string[];
};

const CATALOG: { name: string; description: string; products: SeedProduct[] }[] = [
  {
    name: "Áo thun",
    description: "Áo thun in toàn thân 3D, form unisex, nam, nữ và trẻ em.",
    products: [
      { name: "Áo thun nữ in toàn thân ngắn tay | Polyester", mock: "tee-pink-waves.svg", price: 159000, audience: "WOMEN", material: "Polyester 180GSM", bestSeller: true },
      { name: "Áo thun unisex cổ tròn in toàn thân | Cotton 180GSM", mock: "tee-tiedye-pastel.svg", price: 199000, audience: "UNISEX", material: "Cotton 180GSM" },
      { name: "Áo thun trẻ em in toàn thân ngắn tay | Polyester", mock: "tee-kids-stars.svg", price: 129000, audience: "KIDS", material: "Polyester thun lạnh", kids: true, bestSeller: true },
      { name: "Áo thun nam in toàn thân họa tiết nhiệt đới", mock: "tee-tropical.svg", price: 169000, audience: "MEN", material: "Polyester 180GSM" },
      { name: "Áo thun nam in toàn thân Premium | Polyester", mock: "tee-geo-night.svg", price: 179000, audience: "MEN", material: "Polyester co giãn 4 chiều" },
      { name: "Áo thun có túi ngực in toàn thân | Cotton", mock: "tee-ocean-gradient.svg", price: 189000, audience: "UNISEX", material: "Cotton 180GSM" },
    ],
  },
  {
    name: "Hoodie & Sweater",
    description: "Hoodie, sweater nỉ in toàn thân, giữ ấm, hình in sắc nét.",
    products: [
      { name: "Hoodie unisex in toàn thân có túi | Nỉ bông", mock: "hoodie-camo.svg", price: 389000, audience: "UNISEX", material: "Nỉ bông 280GSM", bestSeller: true },
      { name: "Hoodie nữ in toàn thân Galaxy | Polyester", mock: "hoodie-galaxy.svg", price: 369000, audience: "WOMEN", material: "Polyester nỉ mỏng" },
      { name: "Sweater nam cổ tròn in toàn thân | Polyester", mock: "sweater-halftone.svg", price: 299000, audience: "MEN", material: "Polyester nỉ mỏng" },
      { name: "Sweater unisex caro in toàn thân | Nỉ", mock: "sweater-check.svg", price: 319000, audience: "UNISEX", material: "Nỉ da cá" },
      { name: "Hoodie trẻ em in toàn thân chấm bi | Polyester", mock: "hoodie-neon-dots.svg", price: 279000, audience: "KIDS", material: "Polyester nỉ mỏng", kids: true },
    ],
  },
  {
    name: "Pijama",
    description: "Bộ pijama in toàn thân mặc nhà, quà tặng gia đình, cặp đôi.",
    products: [
      { name: "Bộ pijama nữ in toàn thân tay ngắn quần dài | Lụa", mock: "pajama-check.svg", price: 329000, audience: "WOMEN", material: "Lụa satin" },
      { name: "Bộ pijama nam in toàn thân nhiệt đới | Cotton", mock: "pajama-tropical.svg", price: 339000, audience: "MEN", material: "Cotton lạnh" },
      { name: "Bộ pijama trẻ em in toàn thân ngôi sao", mock: "pajama-stars.svg", price: 249000, audience: "KIDS", material: "Cotton lạnh", kids: true, bestSeller: true },
      { name: "Bộ pijama gia đình in toàn thân chấm bi", mock: "pajama-dots.svg", price: 299000, audience: "UNISEX", material: "Thun lạnh" },
    ],
  },
  {
    name: "Sơ mi & Polo",
    description: "Sơ mi Hawaii, polo đồng phục in toàn thân.",
    products: [
      { name: "Sơ mi Hawaii nam in toàn thân | Polyester", mock: "shirt-hawaii.svg", price: 249000, audience: "MEN", material: "Polyester lụa", bestSeller: true },
      { name: "Sơ mi nam kẻ sọc in toàn thân", mock: "shirt-stripes.svg", price: 259000, audience: "MEN", material: "Polyester lụa" },
      { name: "Áo polo đồng phục in toàn thân | Cá sấu", mock: "polo-geo.svg", price: 229000, audience: "UNISEX", material: "Vải cá sấu Poly" },
      { name: "Áo polo nữ in toàn thân gradient", mock: "polo-gradient.svg", price: 219000, audience: "WOMEN", material: "Vải cá sấu Poly" },
    ],
  },
  {
    name: "Đồ thể thao",
    description: "Áo đấu, ba lỗ, quần short, legging in toàn thân – thấm hút, nhanh khô.",
    products: [
      { name: "Áo bóng chày thể thao in toàn thân | Mè thoáng khí", mock: "jersey-baseball.svg", price: 259000, audience: "UNISEX", material: "Vải mè thoáng khí", bestSeller: true },
      { name: "Áo ba lỗ nữ in toàn thân da báo", mock: "tank-leopard.svg", price: 139000, audience: "WOMEN", material: "Thun lạnh" },
      { name: "Quần short thể thao in toàn thân | Polyester", mock: "shorts-camo.svg", price: 149000, audience: "MEN", material: "Polyester gió" },
      { name: "Quần legging yoga nữ in toàn thân | 240GSM", mock: "leggings-waves.svg", price: 219000, audience: "WOMEN", material: "Thun Spandex 240GSM" },
      { name: "Đầm suông nữ in toàn thân nhiệt đới", mock: "dress-tropical.svg", price: 279000, audience: "WOMEN", material: "Lụa Polyester" },
    ],
  },
  {
    name: "Phụ kiện",
    description: "Túi tote, mũ bucket, tất, khăn bandana in toàn thân theo yêu cầu.",
    products: [
      { name: "Túi tote in toàn thân 2 mặt | Canvas", mock: "tote-dots.svg", price: 119000, audience: "UNISEX", material: "Canvas", colors: [] },
      { name: "Mũ bucket in toàn thân", mock: "bucket-camo.svg", price: 129000, audience: "UNISEX", material: "Kaki Polyester" },
      { name: "Tất cổ cao in toàn thân", mock: "sock-stripes.svg", price: 59000, audience: "UNISEX", material: "Cotton Poly" },
      { name: "Khăn bandana in toàn thân 55x55cm", mock: "bandana-leopard.svg", price: 69000, audience: "UNISEX", material: "Lụa Polyester" },
    ],
  },
];

async function main() {
  // 1. Admin
  const email = (process.env.ADMIN_EMAIL ?? "admin@yala.vn").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Admin@123456";
  // Production: không cho tạo admin bằng mật khẩu mặc định/yếu
  if (process.env.NODE_ENV === "production" && (password.length < 12 || password === "Admin@123456" || !process.env.ADMIN_EMAIL)) {
    throw new Error("Production cần ADMIN_EMAIL và ADMIN_PASSWORD mạnh (≥ 12 ký tự, khác mật khẩu mẫu)");
  }
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, name: "Quản trị viên", passwordHash: await hashPassword(password) },
  });

  // 2. Danh mục + sản phẩm
  let catOrder = 0;
  for (const cat of CATALOG) {
    const slug = slugify(cat.name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: {}, // đã có thì giữ nguyên (không ghi đè chỉnh sửa trong CMS)
      create: { name: cat.name, slug, description: cat.description, sortOrder: catOrder++ },
    });
    let pOrder = 0;
    for (const p of cat.products) {
      const pslug = slugify(p.name);
      const isAccessory = cat.name === "Phụ kiện";
      const data = {
        name: p.name,
        description: `${p.name}. In chuyển nhiệt toàn thân (All-Over Print) – hình in tràn viền, màu sắc bền đẹp, không bong tróc sau giặt. Tải thiết kế của bạn hoặc gửi ý tưởng qua Zalo để được hỗ trợ thiết kế miễn phí.`,
        categoryId: category.id,
        audience: p.audience,
        material: p.material,
        basePrice: p.price,
        sortPrice: p.price > 0 ? p.price : null,
        compareAtPrice: compareAt(p.price),
        images: [`/mock/${p.mock}`],
        mockShape: MOCKS.find((m) => m.file === p.mock)?.shape ?? "",
        colors: p.colors ?? ["Theo thiết kế"],
        sizes: isAccessory ? ["Free size"] : p.kids ? KIDS_SIZES : DEFAULT_SIZES,
        priceTiers: TIERS(p.price),
        isBestSeller: !!p.bestSeller,
        isHotSale: true,
        sortOrder: pOrder++,
      };
      await prisma.product.upsert({ where: { slug: pslug }, update: {}, create: { ...data, slug: pslug } });
    }
  }

  // 3. Landing settings
  const landingRow = await prisma.setting.findUnique({ where: { key: "landing" } });
  if (!landingRow) {
    await prisma.setting.create({ data: { key: "landing", value: DEFAULT_LANDING } });
  } else {
    // Thương hiệu mẫu cũ "PODViet" -> YALA (OEM Group -> YALA do migration 20260930090000_rebrand_yala xử lý)
    const cur = mergeLanding(landingRow.value);
    if (cur.brand.name === "PODViet") {
      const next = {
        ...cur,
        brand: DEFAULT_LANDING.brand,
        b2b: DEFAULT_LANDING.b2b,
        seo: DEFAULT_LANDING.seo,
        hero: { ...cur.hero, tag: DEFAULT_LANDING.hero.tag },
        whyChoose: { ...cur.whyChoose, title: DEFAULT_LANDING.whyChoose.title },
        bank: { ...cur.bank, accountName: cur.bank.accountName === "CONG TY PODVIET" ? DEFAULT_LANDING.bank.accountName : cur.bank.accountName },
      };
      await prisma.setting.update({ where: { key: "landing" }, data: { value: next } });
      console.log("✓ Đã chuyển thương hiệu sang YALA");
    }
  }

  // 3b. Sản phẩm OEM Group: đồng bộ từ oemgroup.vn trong CMS → Sản phẩm → "Đồng bộ từ oemgroup.vn"

  // 4. Đánh giá: KHÔNG tạo dữ liệu mẫu. Chỉ đăng review thật của khách trong CMS → Đánh giá
  //    (review giả vi phạm chính sách quảng cáo Meta/TikTok và Luật Bảo vệ quyền lợi người tiêu dùng).

  // 4b. Biến thể + mặt in cho sản phẩm chưa có (DB mới tạo; DB cũ đã được migration điền)
  const bare = await prisma.product.findMany({
    where: { OR: [{ variants: { none: {} } }, { printAreas: { none: {} } }] },
    select: { id: true, colors: true, sizes: true, mockShape: true, _count: { select: { variants: true, printAreas: true } } },
  });
  for (const p of bare) {
    if (!p._count.variants) {
      const cs = p.colors.length ? p.colors : [""];
      const ss = p.sizes.length ? p.sizes : [""];
      let i = 0;
      for (const color of cs)
        for (const size of ss)
          await prisma.productVariant.create({
            data: { productId: p.id, color, size, sku: `SP-${randomBytes(5).toString("hex").toUpperCase()}`, sortOrder: i++ },
          });
    }
    if (!p._count.printAreas) {
      const aop = !!p.mockShape;
      await prisma.printArea.create({
        data: aop
          ? { productId: p.id, key: "front", name: "In toàn thân", widthMm: 600, heightMm: 700, dpi: 100, maskImage: `/shapes/mask-${p.mockShape}.svg`, overlayImage: `/shapes/line-${p.mockShape}.svg`, zoneX: 0, zoneY: 0, zoneW: 1, zoneH: 1 }
          : { productId: p.id, key: "logo", name: "Vị trí in logo", widthMm: 100, heightMm: 100, dpi: 300, zoneX: 0.35, zoneY: 0.3, zoneW: 0.3, zoneH: 0.3 },
      });
    }
  }
  if (bare.length) console.log(`✓ Tạo biến thể/mặt in cho ${bare.length} sản phẩm`);

  // 5. Help Center: chỉ tạo khi trống (sửa trong CMS → Help Center)
  if ((await prisma.helpArticle.count()) === 0) {
    await prisma.helpArticle.createMany({ data: HELP_SEED.map((a) => ({ ...a, searchText: toSearchText(a.title, a.content), isPublished: true })) });
    console.log(`✓ Tạo ${HELP_SEED.length} bài Help Center`);
  }

  const [c, p] = await Promise.all([prisma.category.count(), prisma.product.count()]);
  console.log(`✓ Seed xong: ${c} danh mục, ${p} sản phẩm. Admin: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
