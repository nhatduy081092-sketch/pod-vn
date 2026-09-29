import { Hono } from "hono";
import { randomBytes } from "node:crypto";
import { prisma, type Prisma } from "@pod/db";
import { ORDER_STATUSES, parseSellerCsv, sellerOrderCreateSchema, sellerProductUpsertSchema, sellerSettingsSchema, type OrderStatus } from "@pod/shared";
import { z } from "zod";
import { badRequest, conflict, notFound, pageParams } from "../lib/http";
import { rateLimit } from "../lib/rate-limit";
import { generateApiKey, requireSeller, type SellerVars } from "../lib/customer-auth";
import { assertDesign, loadProducts, withUniqueCode } from "../lib/order-service";
import { cancelSellerOrder, createSellerOrder, sellerOrderSelect } from "../lib/seller-service";
import { assertPublicHttpsUrl, sendPing } from "../lib/webhooks";
import { getLanding } from "../lib/settings";
import { notifyText } from "../lib/notify";

/** Khu làm việc của seller (web). Cần đăng nhập + hồ sơ seller đã duyệt. */
export const sellerRoutes = new Hono<SellerVars>();
sellerRoutes.use("*", requireSeller);

/* ---------- Tổng quan ---------- */
sellerRoutes.get("/overview", async (c) => {
  const s = c.get("seller");
  const since = new Date(Date.now() - 30 * 86400_000);
  const [profile, byStatus, unpaid, last30, templates] = await Promise.all([
    prisma.sellerProfile.findUnique({ where: { customerId: s.id } }),
    prisma.order.groupBy({ by: ["status"], where: { sellerId: s.id }, _count: { _all: true } }),
    prisma.order.aggregate({ where: { sellerId: s.id, paymentStatus: "UNPAID", status: { not: "CANCELLED" } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.order.aggregate({ where: { sellerId: s.id, createdAt: { gte: since }, status: { not: "CANCELLED" } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.sellerProduct.count({ where: { sellerId: s.id } }),
  ]);
  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((x) => [x, 0])) as Record<OrderStatus, number>;
  for (const r of byStatus) statusCounts[r.status] = r._count._all;
  return c.json({
    profile: profile && { ...profile, webhookSecret: profile.webhookSecret ? `${profile.webhookSecret.slice(0, 6)}…` : "" },
    statusCounts,
    unpaid: { count: unpaid._count._all, total: unpaid._sum.total ?? 0 },
    last30d: { count: last30._count._all, total: last30._sum.total ?? 0 },
    templates,
  });
});

/* ---------- Cài đặt: thương hiệu, webhook ---------- */
sellerRoutes.get("/settings", async (c) => c.json(await prisma.sellerProfile.findUnique({ where: { customerId: c.get("seller").id } })));

sellerRoutes.put("/settings", async (c) => {
  const input = sellerSettingsSchema.parse(await c.req.json());
  if (input.webhookUrl) {
    try {
      await assertPublicHttpsUrl(input.webhookUrl);
    } catch (e) {
      throw badRequest(`Webhook: ${(e as Error).message}`);
    }
  }
  const id = c.get("seller").id;
  const cur = await prisma.sellerProfile.findUnique({ where: { customerId: id }, select: { webhookSecret: true } });
  const secret = input.webhookUrl && !cur?.webhookSecret ? `whsec_${randomBytes(24).toString("hex")}` : undefined;
  return c.json(await prisma.sellerProfile.update({ where: { customerId: id }, data: { ...input, ...(secret ? { webhookSecret: secret } : {}) } }));
});

sellerRoutes.post("/webhook/rotate", async (c) => {
  const secret = `whsec_${randomBytes(24).toString("hex")}`;
  await prisma.sellerProfile.update({ where: { customerId: c.get("seller").id }, data: { webhookSecret: secret } });
  return c.json({ webhookSecret: secret });
});

sellerRoutes.post("/webhook/test", rateLimit({ key: "whtest", limit: 10, windowMs: 10 * 60_000 }), async (c) => {
  const p = await prisma.sellerProfile.findUnique({ where: { customerId: c.get("seller").id }, select: { webhookUrl: true, webhookSecret: true } });
  if (!p?.webhookUrl || !p.webhookSecret) throw badRequest("Chưa cấu hình webhook URL");
  return c.json(await sendPing(c.get("seller").id, p.webhookUrl, p.webhookSecret));
});

sellerRoutes.get("/webhook/deliveries", async (c) =>
  c.json(await prisma.webhookDelivery.findMany({ where: { sellerId: c.get("seller").id }, orderBy: { createdAt: "desc" }, take: 30 })),
);

/* ---------- API key ---------- */
sellerRoutes.get("/api-keys", async (c) =>
  c.json(
    await prisma.apiKey.findMany({
      where: { customerId: c.get("seller").id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, prefix: true, lastUsedAt: true, revokedAt: true, createdAt: true },
    }),
  ),
);

sellerRoutes.post("/api-keys", rateLimit({ key: "apikey", limit: 10, windowMs: 60 * 60_000 }), async (c) => {
  const { name } = z.object({ name: z.string().trim().min(1).max(40) }).parse(await c.req.json());
  const id = c.get("seller").id;
  const active = await prisma.apiKey.count({ where: { customerId: id, revokedAt: null } });
  if (active >= 5) throw badRequest("Tối đa 5 API key đang hoạt động – thu hồi bớt key cũ");
  const k = generateApiKey();
  const row = await prisma.apiKey.create({ data: { customerId: id, name, prefix: k.prefix, hash: k.hash }, select: { id: true, name: true, prefix: true, createdAt: true } });
  // key gốc chỉ trả về 1 lần duy nhất
  return c.json({ ...row, key: k.key }, 201);
});

sellerRoutes.delete("/api-keys/:id", async (c) => {
  const r = await prisma.apiKey.updateMany({ where: { id: c.req.param("id"), customerId: c.get("seller").id, revokedAt: null }, data: { revokedAt: new Date() } });
  if (!r.count) throw notFound("Không tìm thấy key");
  return c.json({ ok: true });
});

/* ---------- Mẫu sản phẩm (sản phẩm + thiết kế đã chốt) ---------- */
const templateSelect = {
  id: true,
  code: true,
  title: true,
  previewUrl: true,
  retailPrice: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      salePrice: true,
      saleEndsAt: true,
      priceTiers: true,
      isActive: true,
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, color: true, colorHex: true, size: true, sku: true, priceDelta: true } },
      printAreas: { select: { key: true, name: true, extraPrice: true } },
    },
  },
} satisfies Prisma.SellerProductSelect;

sellerRoutes.get("/templates", async (c) => {
  const q = c.req.query("q")?.trim();
  return c.json(
    await prisma.sellerProduct.findMany({
      where: { sellerId: c.get("seller").id, ...(q ? { OR: [{ code: { contains: q, mode: "insensitive" } }, { title: { contains: q, mode: "insensitive" } }] } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: { ...templateSelect, design: true },
    }),
  );
});

sellerRoutes.get("/templates/:id", async (c) => {
  const t = await prisma.sellerProduct.findFirst({ where: { id: c.req.param("id"), sellerId: c.get("seller").id }, select: { ...templateSelect, design: true } });
  if (!t) throw notFound("Không tìm thấy mẫu");
  return c.json(t);
});

async function validateTemplate(sellerId: string, raw: unknown) {
  const input = sellerProductUpsertSchema.parse(raw);
  const byId = await loadProducts([input.productId]);
  const p = byId.get(input.productId);
  if (!p) throw notFound("Sản phẩm không còn bán");
  if (p.basePrice <= 0) throw badRequest("Sản phẩm báo giá chưa hỗ trợ dropship – chọn sản phẩm có giá bán");
  assertDesign(p, input.design);
  return { input, preview: input.design.files[0]?.previewUrl ?? "", sellerId };
}

sellerRoutes.post("/templates", async (c) => {
  const id = c.get("seller").id;
  const { input, preview } = await validateTemplate(id, await c.req.json());
  const count = await prisma.sellerProduct.count({ where: { sellerId: id } });
  if (count >= 2000) throw badRequest("Tối đa 2000 mẫu");
  try {
    const t = await prisma.sellerProduct.create({
      data: { sellerId: id, productId: input.productId, code: input.code, title: input.title, design: input.design as unknown as Prisma.InputJsonValue, previewUrl: preview, retailPrice: input.retailPrice, isActive: input.isActive },
      select: templateSelect,
    });
    return c.json(t, 201);
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") throw conflict(`Mã mẫu "${input.code}" đã tồn tại`);
    throw e;
  }
});

sellerRoutes.put("/templates/:id", async (c) => {
  const id = c.get("seller").id;
  const { input, preview } = await validateTemplate(id, await c.req.json());
  try {
    const r = await prisma.sellerProduct.updateMany({
      where: { id: c.req.param("id"), sellerId: id },
      data: { productId: input.productId, code: input.code, title: input.title, design: input.design as unknown as Prisma.InputJsonValue, previewUrl: preview, retailPrice: input.retailPrice, isActive: input.isActive },
    });
    if (!r.count) throw notFound("Không tìm thấy mẫu");
    return c.json({ ok: true });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") throw conflict(`Mã mẫu "${input.code}" đã tồn tại`);
    throw e;
  }
});

sellerRoutes.patch("/templates/:id", async (c) => {
  const { isActive, retailPrice } = z.object({ isActive: z.boolean().optional(), retailPrice: z.number().int().min(0).nullable().optional() }).parse(await c.req.json());
  const r = await prisma.sellerProduct.updateMany({ where: { id: c.req.param("id"), sellerId: c.get("seller").id }, data: { isActive, retailPrice } });
  if (!r.count) throw notFound("Không tìm thấy mẫu");
  return c.json({ ok: true });
});

sellerRoutes.delete("/templates/:id", async (c) => {
  const r = await prisma.sellerProduct.deleteMany({ where: { id: c.req.param("id"), sellerId: c.get("seller").id } });
  if (!r.count) throw notFound("Không tìm thấy mẫu");
  return c.json({ ok: true });
});

/* ---------- Đơn dropship ---------- */
sellerRoutes.get("/orders", async (c) => {
  const { page, pageSize, skip, take } = pageParams(c, 30);
  const status = c.req.query("status") as OrderStatus | undefined;
  const pay = c.req.query("pay");
  const q = c.req.query("q")?.trim();
  const where: Prisma.OrderWhereInput = {
    sellerId: c.get("seller").id,
    ...(status && ORDER_STATUSES.includes(status) ? { status } : {}),
    ...(pay === "unpaid" ? { paymentStatus: "UNPAID", status: { not: "CANCELLED" } } : pay === "paid" ? { paymentStatus: "PAID" } : {}),
    ...(q ? { OR: [{ code: { contains: q.toUpperCase() } }, { externalId: { contains: q } }, { customerName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: sellerOrderSelect }),
    prisma.order.count({ where }),
  ]);
  return c.json({ items, total, page, pageSize });
});

sellerRoutes.get("/orders/:code", async (c) => {
  const o = await prisma.order.findFirst({ where: { code: c.req.param("code").toUpperCase(), sellerId: c.get("seller").id }, select: sellerOrderSelect });
  if (!o) throw notFound("Không tìm thấy đơn");
  return c.json(o);
});

sellerRoutes.post("/orders", rateLimit({ key: "sorder", limit: 120, windowMs: 10 * 60_000 }), async (c) => {
  const r = await createSellerOrder(c.get("seller"), await c.req.json(), "web");
  if (r.duplicate) throw conflict(`Mã đơn "${r.externalId}" đã được tạo trước đó (${r.code})`);
  return c.json(r, 201);
});

sellerRoutes.post("/orders/:code/cancel", async (c) => c.json(await cancelSellerOrder(c.get("seller").id, c.req.param("code"))));

/** Nhập CSV: dryRun=true chỉ kiểm tra; false thì tạo đơn, bỏ qua đơn trùng mã, báo lỗi từng đơn */
sellerRoutes.post("/orders/import", rateLimit({ key: "scsv", limit: 20, windowMs: 10 * 60_000 }), async (c) => {
  const { csv, dryRun } = z.object({ csv: z.string().min(1).max(2_000_000), dryRun: z.boolean().default(true) }).parse(await c.req.json());
  const { orders, issues } = parseSellerCsv(csv);
  if (!orders.length) return c.json({ created: [], duplicates: [], errors: issues, total: 0 });
  const seller = c.get("seller");
  const created: { line: number; code: string; externalId: string | null; total: number }[] = [];
  const duplicates: { line: number; code: string; externalId: string | null }[] = [];
  const errors = [...issues];

  if (dryRun) {
    // Kiểm tra mã mẫu + định dạng mà không tạo đơn
    const codes = await prisma.sellerProduct.findMany({ where: { sellerId: seller.id, isActive: true }, select: { code: true } });
    const have = new Set(codes.map((x) => x.code));
    for (const o of orders) {
      const r = sellerOrderCreateSchema.safeParse(o.input);
      if (!r.success) errors.push({ line: o.line, message: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)[0] ?? "Dữ liệu không hợp lệ" });
      else for (const it of r.data.items) if (!have.has(it.template)) errors.push({ line: o.line, message: `Không có mẫu "${it.template}"` });
    }
    return c.json({ created, duplicates, errors, total: orders.length, dryRun: true });
  }

  for (const o of orders) {
    try {
      const r = await createSellerOrder(seller, o.input, "csv");
      if (r.duplicate) duplicates.push({ line: o.line, code: r.code, externalId: r.externalId });
      else created.push({ line: o.line, code: r.code, externalId: r.externalId, total: r.total });
    } catch (e) {
      const err = e as { issues?: { path: (string | number)[]; message: string }[]; message: string };
      errors.push({ line: o.line, message: err.issues?.[0] ? `${err.issues[0].path.join(".")}: ${err.issues[0].message}` : err.message });
    }
  }
  return c.json({ created, duplicates, errors, total: orders.length, dryRun: false });
});

/* ---------- Thanh toán gộp ---------- */
sellerRoutes.get("/batches", async (c) => {
  const [items, settings] = await Promise.all([
    prisma.paymentBatch.findMany({
      where: { sellerId: c.get("seller").id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, code: true, total: true, status: true, createdAt: true, paidAt: true, _count: { select: { orders: true } } },
    }),
    getLanding(),
  ]);
  return c.json({ items, bank: settings.bank });
});

sellerRoutes.post("/batches", rateLimit({ key: "sbatch", limit: 30, windowMs: 10 * 60_000 }), async (c) => {
  const { codes } = z.object({ codes: z.array(z.string().min(4).max(30)).min(1).max(500) }).parse(await c.req.json());
  const sellerId = c.get("seller").id;
  const orders = await prisma.order.findMany({
    where: { sellerId, code: { in: codes.map((x) => x.toUpperCase()) } },
    select: { id: true, code: true, total: true, status: true, paymentStatus: true, batch: { select: { status: true } } },
  });
  if (orders.length !== new Set(codes).size) throw badRequest("Có mã đơn không thuộc tài khoản của bạn");
  const bad = orders.find((o) => o.status === "CANCELLED" || o.paymentStatus !== "UNPAID" || o.batch?.status === "UNPAID" || o.batch?.status === "PAID");
  if (bad) throw badRequest(`Đơn ${bad.code} đã thanh toán, đã huỷ hoặc đang nằm trong 1 lần thanh toán khác`);
  const total = orders.reduce((s, o) => s + o.total, 0);
  const batch = await withUniqueCode("TT", (code) =>
    prisma.$transaction(async (tx) => {
      const b = await tx.paymentBatch.create({ data: { code, sellerId, total }, select: { id: true, code: true, total: true, status: true, createdAt: true } });
      await tx.order.updateMany({ where: { id: { in: orders.map((o) => o.id) } }, data: { batchId: b.id } });
      return b;
    }),
  );
  notifyText(`💳 Seller tạo thanh toán gộp ${batch.code}`, [`${c.get("seller").name} · ${orders.length} đơn · ${batch.total.toLocaleString("vi-VN")}đ`]);
  return c.json({ ...batch, bank: (await getLanding()).bank }, 201);
});

sellerRoutes.post("/batches/:code/cancel", async (c) => {
  const b = await prisma.paymentBatch.findFirst({ where: { code: c.req.param("code"), sellerId: c.get("seller").id, status: "UNPAID" }, select: { id: true } });
  if (!b) throw notFound("Không tìm thấy lần thanh toán chưa trả");
  await prisma.$transaction([
    prisma.order.updateMany({ where: { batchId: b.id }, data: { batchId: null } }),
    prisma.paymentBatch.update({ where: { id: b.id }, data: { status: "CANCELLED" } }),
  ]);
  return c.json({ ok: true });
});
