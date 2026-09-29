import { prisma, type Prisma } from "@pod/db";
import {
  areaExtraPrice,
  linePrice,
  parseTiers,
  pickShipping,
  usedAreas,
  type OrderDesign,
  type PrintMode,
  type RosterRow,
  type ShippingOption,
} from "@pod/shared";
import { badRequest } from "./http";
import { getLanding } from "./settings";

/** Dòng hàng đầu vào chung cho: checkout web, đơn seller, CSV, Open API */
export type LineInput = {
  productId: string;
  variantId?: string;
  size?: string;
  color?: string;
  quantity: number;
  designUrl?: string;
  printMode?: PrintMode;
  designNote?: string;
  roster?: RosterRow[];
  design?: OrderDesign;
};

const productInclude = {
  variants: { orderBy: { sortOrder: "asc" } },
  printAreas: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductInclude;
export type ProductWithParts = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export async function loadProducts(ids: string[]) {
  const products = await prisma.product.findMany({ where: { id: { in: [...new Set(ids)] }, isActive: true }, include: productInclude });
  return new Map(products.map((p) => [p.id, p]));
}

/** Kiểm tra thiết kế khớp sản phẩm: đúng mặt in, mặt nào có nội dung phải có file in */
export function assertDesign(p: ProductWithParts, design: OrderDesign) {
  if (design.json.productId !== p.id) throw badRequest(`Thiết kế không thuộc sản phẩm "${p.name}"`);
  const keys = new Set(p.printAreas.map((a) => a.key));
  for (const k of Object.keys(design.json.areas)) if (!keys.has(k)) throw badRequest(`Mặt in "${k}" không có trên "${p.name}"`);
  const used = usedAreas(design.json);
  if (!used.length) throw badRequest(`Thiết kế "${p.name}" đang trống`);
  const withFile = new Set(design.files.map((f) => f.area));
  const missing = used.filter((k) => !withFile.has(k));
  if (missing.length) throw badRequest(`Thiếu file in cho mặt: ${missing.join(", ")}`);
  return used;
}

function resolveVariant(p: ProductWithParts, line: LineInput) {
  const active = p.variants.filter((v) => v.isActive);
  if (!active.length) return null;
  if (line.variantId) {
    const v = active.find((x) => x.id === line.variantId);
    if (!v) throw badRequest(`Phân loại đã chọn của "${p.name}" không còn bán`);
    return v;
  }
  // tương thích giỏ hàng cũ / CSV: tìm theo màu + size
  const color = line.color ?? "";
  const size = line.size ?? "";
  const v =
    active.find((x) => x.color === color && x.size === size) ??
    (active.every((x) => x.color === active[0]!.color) ? active.find((x) => x.size === size) : undefined) ??
    (active.length === 1 ? active[0] : undefined);
  if (!v) throw badRequest(`"${p.name}" không có phân loại ${[color, size].filter(Boolean).join(" / ") || "đã chọn"}`);
  return v;
}

export type PricedLine = {
  data: Prisma.OrderItemUncheckedCreateWithoutOrderInput & { productId: string; variantId: string | null; lineTotal: number };
  weightGram: number;
  product: ProductWithParts;
};

/**
 * Tính giá + validate toàn bộ dòng hàng phía server (không tin giá client).
 * discountPercent: chiết khấu seller.
 */
export async function priceLines(lines: LineInput[], opts: { discountPercent?: number } = {}): Promise<{ lines: PricedLine[]; subtotal: number; weightGram: number }> {
  const byId = await loadProducts(lines.map((l) => l.productId));
  const qtyByProduct = new Map<string, number>();
  for (const l of lines) qtyByProduct.set(l.productId, (qtyByProduct.get(l.productId) ?? 0) + l.quantity);
  const now = new Date();

  const out: PricedLine[] = lines.map((l) => {
    const p = byId.get(l.productId);
    if (!p) throw badRequest("Có sản phẩm không còn bán, vui lòng tải lại trang");
    if (p.basePrice <= 0) throw badRequest(`"${p.name}" là sản phẩm báo giá theo yêu cầu – vui lòng gửi yêu cầu báo giá`);
    const totalQty = qtyByProduct.get(p.id)!;
    if (totalQty < p.minQty) throw badRequest(`"${p.name}" đặt tối thiểu ${p.minQty} sản phẩm`);

    const used = l.design ? assertDesign(p, l.design) : [];
    const areaExtras = areaExtraPrice(p.printAreas, used);
    const priceSrc = { basePrice: p.basePrice, salePrice: p.salePrice, saleEndsAt: p.saleEndsAt, priceTiers: parseTiers(p.priceTiers) };
    const unitOf = (delta: number) => linePrice({ product: priceSrc, totalQty, variantDelta: delta, areaExtras, discountPercent: opts.discountPercent, now });

    const roster = l.roster?.length ? l.roster : null;
    let unitPrice: number;
    let lineTotal: number;
    let weightGram: number;
    let variantId: string | null = null;
    let sku = "";
    let size = l.size ?? "";
    let color = l.color ?? "";

    if (roster) {
      // Đồng phục nhóm: mỗi dòng danh sách = 1 áo, size phải có trong phân loại của màu đã chọn
      if (l.quantity !== roster.length) throw badRequest(`Số lượng "${p.name}" không khớp danh sách (${roster.length} áo)`);
      const active = p.variants.filter((v) => v.isActive && (!color || v.color === color));
      const sizes = active.length ? active.map((v) => v.size) : p.sizes;
      const bad = sizes.length ? roster.find((r) => !sizes.includes(r.size)) : undefined;
      if (bad) throw badRequest(`Size ${bad.size} không có cho "${p.name}"`);
      unitPrice = unitOf(0);
      lineTotal = 0;
      weightGram = 0;
      for (const r of roster) {
        const v = active.find((x) => x.size === r.size);
        lineTotal += unitOf(v?.priceDelta ?? 0);
        weightGram += v?.weightGram ?? p.weightGram;
      }
    } else {
      const v = resolveVariant(p, l);
      if (v) {
        variantId = v.id;
        sku = v.sku;
        size = v.size;
        color = v.color;
      } else if (p.sizes.length && !p.sizes.includes(size)) {
        throw badRequest(`Size ${size} không có cho "${p.name}"`);
      }
      unitPrice = unitOf(v?.priceDelta ?? 0);
      lineTotal = unitPrice * l.quantity;
      weightGram = (v?.weightGram ?? p.weightGram) * l.quantity;
    }

    const firstFile = l.design?.files[0];
    return {
      product: p,
      weightGram,
      data: {
        productId: p.id,
        variantId,
        sku,
        productName: p.name,
        productImg: firstFile?.previewUrl ?? p.images[0] ?? "",
        size: size || "—",
        color,
        quantity: l.quantity,
        unitPrice,
        lineTotal,
        designUrl: firstFile?.printUrl ?? l.designUrl ?? "",
        printMode: l.printMode ?? "FILL",
        designNote: l.designNote ?? "",
        roster: roster ?? undefined,
        design: l.design ? (l.design as unknown as Prisma.InputJsonValue) : undefined,
      },
    };
  });

  return {
    lines: out,
    subtotal: out.reduce((s, l) => s + l.data.lineTotal, 0),
    weightGram: out.reduce((s, l) => s + l.weightGram, 0),
  };
}

export async function quoteShipping(province: string, weightGram: number, subtotal: number, method?: string): Promise<ShippingOption> {
  const settings = await getLanding();
  return pickShipping(settings.shipping, method, { province, weightGram, subtotal });
}

export function genOrderCode(prefix = "POD") {
  const d = new Date(Date.now() + 7 * 3600_000); // giờ VN
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "X");
  return `${prefix}${ymd}${rand}`;
}

/** Tạo bản ghi có mã ngẫu nhiên, thử lại khi trùng mã (P2002 trên cột code) */
export async function withUniqueCode<T>(prefix: string, create: (code: string) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return await create(genOrderCode(prefix));
    } catch (e) {
      const err = e as { code?: string; meta?: { target?: unknown } };
      if (err.code !== "P2002" || !String(err.meta?.target ?? "code").includes("code")) throw e;
    }
  }
  throw new Error("Không tạo được mã, vui lòng thử lại");
}
