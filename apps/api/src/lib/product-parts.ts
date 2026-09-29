import { prisma } from "@pod/db";
import { buildVariantMatrix, suggestSku, type PrintAreaInput, type VariantInput } from "@pod/shared";
import { badRequest } from "./http";

/** SKU không trùng toàn hệ thống: thêm hậu tố -2, -3... nếu đã có */
async function uniqueSkus(wanted: { key: string; sku: string }[], excludeProductId?: string): Promise<Map<string, string>> {
  const bases = [...new Set(wanted.map((w) => w.sku.toUpperCase()))];
  const existing = bases.length
    ? await prisma.productVariant.findMany({
        where: { OR: bases.map((b) => ({ sku: { startsWith: b, mode: "insensitive" as const } })), ...(excludeProductId ? { productId: { not: excludeProductId } } : {}) },
        select: { sku: true },
      })
    : [];
  const taken = new Set(existing.map((e) => e.sku.toUpperCase()));
  const out = new Map<string, string>();
  for (const w of wanted) {
    const base = w.sku.toUpperCase();
    let sku = base;
    for (let i = 2; taken.has(sku); i++) sku = `${base}-${i}`;
    taken.add(sku);
    out.set(w.key, sku);
  }
  return out;
}

const vkey = (v: { color: string; size: string }) => `${v.color}|${v.size}`;

/**
 * Lưu toàn bộ biến thể của 1 sản phẩm (thay thế danh sách cũ):
 * - Khớp theo id hoặc màu+size để giữ SKU/lịch sử đơn
 * - Biến thể bị bỏ sẽ bị xoá (đơn cũ vẫn giữ snapshot SKU)
 * - Đồng bộ lại Product.colors / sizes (dùng cho bộ lọc, đồng phục nhóm)
 */
export async function saveVariants(productId: string, productName: string, inputs: VariantInput[]) {
  const current = await prisma.productVariant.findMany({ where: { productId } });
  const byId = new Map(current.map((v) => [v.id, v]));
  const byKey = new Map(current.map((v) => [vkey(v), v]));

  const planned = inputs.map((inp, i) => {
    const match = (inp.id && byId.get(inp.id)) || byKey.get(vkey(inp));
    return { inp, match, sortOrder: i };
  });
  const skuMap = await uniqueSkus(
    planned.map((p) => ({ key: vkey(p.inp), sku: p.inp.sku || p.match?.sku || suggestSku(productName, p.inp.color, p.inp.size) })),
    productId,
  );
  // SKU trùng trong chính danh sách gửi lên đã bị schema chặn; ở đây chỉ còn trùng với sản phẩm khác
  const keep = new Set(planned.filter((p) => p.match).map((p) => p.match!.id));

  await prisma.$transaction(async (tx) => {
    await tx.productVariant.deleteMany({ where: { productId, id: { notIn: [...keep] } } });
    // đổi SKU tạm để tránh va chạm unique khi hoán đổi SKU giữa các biến thể
    for (const p of planned) if (p.match) await tx.productVariant.update({ where: { id: p.match.id }, data: { sku: `tmp-${p.match.id}` } });
    for (const p of planned) {
      const data = {
        color: p.inp.color,
        colorHex: p.inp.colorHex,
        size: p.inp.size,
        sku: skuMap.get(vkey(p.inp))!,
        weightGram: p.inp.weightGram,
        priceDelta: p.inp.priceDelta,
        isActive: p.inp.isActive,
        sortOrder: p.sortOrder,
      };
      if (p.match) await tx.productVariant.update({ where: { id: p.match.id }, data });
      else await tx.productVariant.create({ data: { ...data, productId } });
    }
    const active = inputs.filter((v) => v.isActive);
    const colors = [...new Set(active.map((v) => v.color).filter(Boolean))];
    const sizes = [...new Set(active.map((v) => v.size).filter(Boolean))];
    await tx.product.update({ where: { id: productId }, data: { colors, sizes } });
  });
  return prisma.productVariant.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } });
}

export async function savePrintAreas(productId: string, areas: PrintAreaInput[]) {
  await prisma.$transaction(async (tx) => {
    await tx.printArea.deleteMany({ where: { productId, key: { notIn: areas.map((a) => a.key) } } });
    for (const [i, a] of areas.entries()) {
      const { id: _id, ...data } = a;
      await tx.printArea.upsert({
        where: { productId_key: { productId, key: a.key } },
        create: { ...data, productId, sortOrder: i },
        update: { ...data, sortOrder: i },
      });
    }
  });
  return prisma.printArea.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } });
}

/** Sản phẩm mới / chưa có dữ liệu: tạo biến thể từ màu × size và 1 vùng in mặc định */
export async function ensureProductParts(p: { id: string; name: string; colors: string[]; sizes: string[]; mockShape: string }) {
  const [vc, ac] = await Promise.all([prisma.productVariant.count({ where: { productId: p.id } }), prisma.printArea.count({ where: { productId: p.id } })]);
  if (!vc) {
    const matrix = buildVariantMatrix(p.name, p.colors.map((c) => ({ name: c, hex: "" })), p.sizes);
    await saveVariants(p.id, p.name, matrix);
  }
  if (!ac) {
    const aop = !!p.mockShape;
    await prisma.printArea.create({
      data: aop
        ? {
            productId: p.id,
            key: "front",
            name: "In toàn thân",
            widthMm: 600,
            heightMm: 700,
            dpi: 100,
            maskImage: `/shapes/mask-${p.mockShape}.svg`,
            overlayImage: `/shapes/line-${p.mockShape}.svg`,
            zoneX: 0,
            zoneY: 0,
            zoneW: 1,
            zoneH: 1,
          }
        : { productId: p.id, key: "logo", name: "Vị trí in logo", widthMm: 100, heightMm: 100, dpi: 300, zoneX: 0.35, zoneY: 0.3, zoneW: 0.3, zoneH: 0.3 },
    });
  }
}

export function assertAreasAllowed(areas: PrintAreaInput[]) {
  for (const a of areas) {
    const px = (a.widthMm / 25.4) * a.dpi * ((a.heightMm / 25.4) * a.dpi);
    if (px > 40_000_000) throw badRequest(`Mặt "${a.name}": khổ ${a.widthMm}×${a.heightMm}mm ở ${a.dpi} DPI quá lớn – giảm DPI`);
  }
}
