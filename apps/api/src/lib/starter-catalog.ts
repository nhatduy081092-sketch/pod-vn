import { prisma } from "@pod/db";
import { BASIC_COLORS, buildVariantMatrix, GARMENT_PRODUCT, GARMENT_ZONE, sortPriceOf, type ColorKey } from "@pod/shared";
import { saveVariants } from "./product-parts";
import { searchFields } from "./search";

/**
 * Dòng basic "YALA Everyday": áo/quần/túi trơn – bán kèm (tăng giá trị đơn) và làm phôi cho "Mẫu có sẵn".
 * Tự tạo 1 lần khi API khởi động (đánh dấu bằng Setting) – xoá/sửa trong CMS sau đó sẽ KHÔNG bị tạo lại.
 * Giá/chất liệu là giá trị khởi tạo – chỉnh trong CMS → Sản phẩm.
 */
const FLAG = "starter:yala-everyday:v1";
const CATEGORY = { slug: "yala-everyday", name: "YALA Everyday", description: "Dòng basic trơn mặc hằng ngày – thêm logo, tên hoặc thiết kế của bạn." };
const SIZES = ["S", "M", "L", "XL", "2XL"];

type Item = {
  key: "tshirt" | "longsleeve" | "sweater" | "hoodie" | "jogger" | "tote";
  slug: string;
  name: string;
  price: number;
  compareAt: number;
  material: string;
  colors: ColorKey[];
  sizes: string[];
  weightGram: number;
  description: string;
};

const ITEMS: Item[] = [
  { key: "tshirt", slug: GARMENT_PRODUCT.tshirt.slug, name: "Áo thun Relaxed Fit YALA Everyday", price: 199000, compareAt: 259000, material: "Cotton", colors: ["trang", "den", "kem", "xam", "navy"], sizes: SIZES, weightGram: 220, description: "Áo thun form rộng vừa (relaxed fit), vai hơi rớt, mặc hằng ngày. In chữ, logo hoặc thiết kế của bạn ở ngực trước và lưng." },
  { key: "longsleeve", slug: GARMENT_PRODUCT.longsleeve.slug, name: "Áo thun dài tay YALA Everyday", price: 229000, compareAt: 289000, material: "Cotton", colors: ["trang", "den", "kem", "navy"], sizes: SIZES, weightGram: 280, description: "Áo thun dài tay form rộng cho những ngày se lạnh. In theo thiết kế riêng từ 1 chiếc." },
  { key: "sweater", slug: GARMENT_PRODUCT.sweater.slug, name: "Áo sweater nỉ bông YALA Everyday", price: 359000, compareAt: 449000, material: "Nỉ bông", colors: ["kem", "den", "xam", "navy"], sizes: SIZES, weightGram: 480, description: "Sweater cổ tròn nỉ bông, bo cổ – bo tay – bo gấu. Hợp in chữ ngực và logo." },
  { key: "hoodie", slug: GARMENT_PRODUCT.hoodie.slug, name: "Áo hoodie nỉ bông YALA Everyday", price: 399000, compareAt: 499000, material: "Nỉ bông", colors: ["den", "kem", "xam", "navy"], sizes: SIZES, weightGram: 560, description: "Hoodie nỉ bông có mũ, túi trước. Mặc đi học, đi làm, đi chơi mùa lạnh." },
  { key: "jogger", slug: "quan-jogger-ni-bong-yala-everyday", name: "Quần jogger nỉ bông YALA Everyday", price: 349000, compareAt: 429000, material: "Nỉ bông", colors: ["den", "xam", "kem", "navy"], sizes: SIZES, weightGram: 450, description: "Quần jogger nỉ bông lưng thun, bo ống. Phối cùng hoodie/sweater thành bộ." },
  { key: "tote", slug: GARMENT_PRODUCT.tote.slug, name: "Túi tote canvas YALA Everyday", price: 129000, compareAt: 159000, material: "Canvas", colors: ["kem", "den"], sizes: [], weightGram: 200, description: "Túi vải canvas quai đeo vai – đi học, đi chợ, đi cà phê. In chữ hoặc hình 1 mặt." },
];

/** Vùng in trên ảnh phôi /shapes/basic/<g>.svg (khớp GARMENT_ZONE của ảnh xem trước) */
function areasFor(key: Item["key"]) {
  if (key === "jogger") return [{ key: "logo", name: "Logo đùi trái", widthMm: 80, heightMm: 80, dpi: 300, zoneX: 0.56, zoneY: 0.2, zoneW: 0.075, zoneH: 0.075, extraPrice: 0 }];
  const z = GARMENT_ZONE[key];
  const front = { key: "front", name: "Mặt trước", widthMm: z.widthMm, heightMm: z.heightMm, dpi: 200, zoneX: z.x, zoneY: z.y, zoneW: z.w, zoneH: z.h, extraPrice: 0 };
  if (key === "tote") return [front];
  return [front, { ...front, key: "back", name: "Mặt sau", extraPrice: 40000 }];
}

export async function ensureStarterCatalog() {
  if (await prisma.setting.findUnique({ where: { key: FLAG } })) return;
  const cat =
    (await prisma.category.findUnique({ where: { slug: CATEGORY.slug } })) ??
    (await prisma.category.create({ data: { ...CATEGORY, showOnHome: false, sortOrder: 90 } }));
  let created = 0;
  for (const [i, it] of ITEMS.entries()) {
    if (await prisma.product.findUnique({ where: { slug: it.slug }, select: { id: true } })) continue;
    const colors = it.colors.map((k) => ({ name: BASIC_COLORS[k].name, hex: BASIC_COLORS[k].hex }));
    const img = (k: ColorKey) => `/shapes/basic/${it.key}-${k}.svg`;
    const p = await prisma.product.create({
      data: {
        name: it.name,
        slug: it.slug,
        description: it.description,
        categoryId: cat.id,
        audience: "UNISEX",
        material: it.material,
        printMethod: "In DTF/DTG theo thiết kế",
        basePrice: it.price,
        compareAtPrice: it.compareAt,
        sortPrice: sortPriceOf(it.price, null),
        weightGram: it.weightGram,
        images: [img(it.colors[0]!), img(it.colors[1] ?? it.colors[0]!)],
        colors: colors.map((c) => c.name),
        sizes: it.sizes,
        isHotSale: false,
        sortOrder: i,
        ...searchFields(it.name, "", cat.name, it.material),
      },
    });
    await saveVariants(p.id, p.name, buildVariantMatrix(p.name, colors, it.sizes));
    for (const [j, a] of areasFor(it.key).entries()) {
      await prisma.printArea.create({ data: { ...a, productId: p.id, mockupImage: `/shapes/basic/${it.key}.svg`, sortOrder: j, safeMm: 10, tips: "Chữ và logo quan trọng nên nằm trong khung an toàn." } });
    }
    created++;
  }
  await prisma.setting.upsert({ where: { key: FLAG }, update: { value: { at: new Date().toISOString(), created } }, create: { key: FLAG, value: { at: new Date().toISOString(), created } } });
  if (created) console.log(`[starter] đã tạo ${created} sản phẩm YALA Everyday`);
}
