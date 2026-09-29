import { Hono } from "hono";
import { prisma, type Prisma } from "@pod/db";
import { linePrice, parseTiers } from "@pod/shared";
import { notFound, pageParams } from "../lib/http";
import { rateLimit } from "../lib/rate-limit";
import { requireApiKey, type SellerVars } from "../lib/customer-auth";
import { cancelSellerOrder, createSellerOrder, sellerOrderSelect } from "../lib/seller-service";

/**
 * Open API cho seller – xác thực bằng API key: `Authorization: Bearer pk_live_...`
 * Tài liệu: trang Seller → API & Webhook trên website.
 */
export const v1Routes = new Hono<SellerVars>();
v1Routes.use("*", rateLimit({ key: "v1", limit: 300, windowMs: 60_000 }));
v1Routes.use("*", requireApiKey);

v1Routes.get("/me", (c) => {
  const s = c.get("seller");
  return c.json({ id: s.id, name: s.name, discountPercent: s.discountPercent });
});

/** Danh mục phôi có giá: biến thể (SKU), mặt in, giá sau chiết khấu seller (SL 1) */
v1Routes.get("/products", async (c) => {
  const { page, pageSize, skip, take } = pageParams(c, 50);
  const where: Prisma.ProductWhereInput = { isActive: true, basePrice: { gt: 0 }, category: { isActive: true } };
  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { id: "asc" }],
      skip,
      take,
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        salePrice: true,
        saleEndsAt: true,
        priceTiers: true,
        minQty: true,
        productionDays: true,
        images: true,
        category: { select: { name: true, slug: true } },
        variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { sku: true, color: true, colorHex: true, size: true, priceDelta: true, weightGram: true } },
        printAreas: { orderBy: { sortOrder: "asc" }, select: { key: true, name: true, widthMm: true, heightMm: true, dpi: true, extraPrice: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);
  const d = c.get("seller").discountPercent;
  const items = rows.map((p) => {
    const src = { basePrice: p.basePrice, salePrice: p.salePrice, saleEndsAt: p.saleEndsAt, priceTiers: parseTiers(p.priceTiers) };
    return { ...p, priceTiers: src.priceTiers, sellerPrice: linePrice({ product: src, totalQty: 1, discountPercent: d }) };
  });
  return c.json({ items, total, page, pageSize });
});

v1Routes.get("/templates", async (c) =>
  c.json(
    await prisma.sellerProduct.findMany({
      where: { sellerId: c.get("seller").id, isActive: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
      select: {
        code: true,
        title: true,
        previewUrl: true,
        retailPrice: true,
        product: { select: { id: true, name: true, variants: { where: { isActive: true }, select: { sku: true, color: true, size: true } } } },
      },
    }),
  ),
);

/**
 * Tạo đơn dropship. Gửi lại cùng externalId -> 200 + đơn cũ (idempotent), không tạo trùng.
 * Body: { externalId, recipient{name,phone,province,ward,addressLine}, items[{template,color,size,quantity}], shippingMethod, codAmount, whiteLabel, note }
 */
v1Routes.post("/orders", async (c) => {
  const r = await createSellerOrder(c.get("seller"), await c.req.json(), "api");
  return c.json(r, r.duplicate ? 200 : 201);
});

v1Routes.get("/orders", async (c) => {
  const { page, pageSize, skip, take } = pageParams(c, 50);
  const externalId = c.req.query("externalId");
  const where: Prisma.OrderWhereInput = { sellerId: c.get("seller").id, ...(externalId ? { externalId } : {}) };
  const [items, total] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: sellerOrderSelect }),
    prisma.order.count({ where }),
  ]);
  return c.json({ items, total, page, pageSize });
});

v1Routes.get("/orders/:code", async (c) => {
  const o = await prisma.order.findFirst({ where: { code: c.req.param("code").toUpperCase(), sellerId: c.get("seller").id }, select: sellerOrderSelect });
  if (!o) throw notFound("Không tìm thấy đơn");
  return c.json(o);
});

v1Routes.post("/orders/:code/cancel", async (c) => c.json(await cancelSellerOrder(c.get("seller").id, c.req.param("code"))));
