import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma, type Prisma } from "@pod/db";
import { hashPassword, verifyPassword } from "@pod/db/password";
import {
  addressesSaveSchema,
  claimOrderSchema,
  customerLoginSchema,
  customerProfileSchema,
  customerRegisterSchema,
  passwordChangeSchema,
  savedDesignSchema,
  sellerApplySchema,
} from "@pod/shared";
import { conflict, notFound, pageParams } from "../lib/http";
import { rateLimit } from "../lib/rate-limit";
import { clearSession, issueSession, requireCustomer, type CustomerVars } from "../lib/customer-auth";
import { notifyText } from "../lib/notify";
import { orderViewSelect } from "./checkout";

export const accountRoutes = new Hono<CustomerVars>();

let dummy: Promise<string> | null = null;
const dummyHash = () => (dummy ??= hashPassword("khong-ton-tai-" + Math.random()));

const meSelect = {
  id: true,
  phone: true,
  name: true,
  email: true,
  addresses: true,
  createdAt: true,
  seller: { select: { status: true, discountPercent: true, companyName: true, brandName: true } },
} satisfies Prisma.CustomerSelect;

/* ---------- Đăng ký / đăng nhập (không cần phiên) ---------- */
accountRoutes.post("/register", rateLimit({ key: "register", limit: 5, windowMs: 60 * 60_000 }), async (c) => {
  const input = customerRegisterSchema.parse(await c.req.json());
  const exists = await prisma.customer.findUnique({ where: { phone: input.phone }, select: { id: true } });
  if (exists) throw conflict("Số điện thoại này đã có tài khoản – vui lòng đăng nhập");
  const cu = await prisma.customer.create({
    data: { phone: input.phone, name: input.name, email: input.email, passwordHash: await hashPassword(input.password) },
    select: meSelect,
  });
  await issueSession(c, cu.id);
  return c.json(cu, 201);
});

accountRoutes.post("/login", rateLimit({ key: "clogin", limit: 10, windowMs: 15 * 60_000 }), async (c) => {
  const { phone, password } = customerLoginSchema.parse(await c.req.json());
  const cu = await prisma.customer.findUnique({ where: { phone }, select: { id: true, passwordHash: true, isActive: true } });
  // luôn chạy verify (hash giả khi SĐT không tồn tại) để thời gian phản hồi như nhau
  const ok = await verifyPassword(password, cu?.passwordHash ?? (await dummyHash()));
  if (!cu || !ok) throw new HTTPException(401, { message: "Số điện thoại hoặc mật khẩu không đúng" });
  if (!cu.isActive) throw new HTTPException(403, { message: "Tài khoản đang bị khoá – liên hệ hỗ trợ" });
  await issueSession(c, cu.id);
  return c.json(await prisma.customer.findUnique({ where: { id: cu.id }, select: meSelect }));
});

accountRoutes.post("/logout", (c) => {
  clearSession(c);
  return c.json({ ok: true });
});

/* ---------- Các route dưới đây cần đăng nhập ---------- */
accountRoutes.use("*", async (c, next) => {
  if (/\/(register|login|logout)$/.test(c.req.path)) return next();
  return requireCustomer(c, next);
});

accountRoutes.get("/me", async (c) => {
  const me = await prisma.customer.findUnique({ where: { id: c.get("customer").id }, select: meSelect });
  if (!me) throw notFound();
  return c.json(me);
});

accountRoutes.put("/profile", async (c) => {
  const input = customerProfileSchema.parse(await c.req.json());
  return c.json(await prisma.customer.update({ where: { id: c.get("customer").id }, data: input, select: meSelect }));
});

accountRoutes.put("/password", rateLimit({ key: "cpass", limit: 10, windowMs: 15 * 60_000 }), async (c) => {
  const { current, next } = passwordChangeSchema.parse(await c.req.json());
  const cu = await prisma.customer.findUnique({ where: { id: c.get("customer").id }, select: { passwordHash: true } });
  if (!cu || !(await verifyPassword(current, cu.passwordHash))) throw new HTTPException(400, { message: "Mật khẩu hiện tại không đúng" });
  await prisma.customer.update({ where: { id: c.get("customer").id }, data: { passwordHash: await hashPassword(next) } });
  return c.json({ ok: true });
});

accountRoutes.put("/addresses", async (c) => {
  const { addresses } = addressesSaveSchema.parse(await c.req.json());
  // đúng 1 địa chỉ mặc định
  const hasDefault = addresses.some((a) => a.isDefault);
  const list = addresses.map((a, i) => ({ ...a, isDefault: hasDefault ? a.isDefault && addresses.findIndex((x) => x.isDefault) === i : i === 0 }));
  return c.json(await prisma.customer.update({ where: { id: c.get("customer").id }, data: { addresses: list }, select: meSelect }));
});

/* ---------- Đơn hàng của tôi ---------- */
accountRoutes.get("/orders", async (c) => {
  const { page, pageSize, skip, take } = pageParams(c, 20);
  const where: Prisma.OrderWhereInput = { customerId: c.get("customer").id };
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: { code: true, status: true, paymentStatus: true, total: true, isQuote: true, createdAt: true, items: { select: { productName: true, productImg: true, quantity: true }, take: 3 } },
    }),
    prisma.order.count({ where }),
  ]);
  return c.json({ items, total, page, pageSize });
});

accountRoutes.get("/orders/:code", async (c) => {
  const order = await prisma.order.findFirst({ where: { code: c.req.param("code").toUpperCase(), customerId: c.get("customer").id }, select: orderViewSelect });
  if (!order) throw notFound("Không tìm thấy đơn hàng");
  return c.json(order);
});

/** Gắn đơn đã đặt khi chưa đăng nhập vào tài khoản (đơn phải cùng SĐT với tài khoản) */
accountRoutes.post("/orders/claim", rateLimit({ key: "claim", limit: 20, windowMs: 15 * 60_000 }), async (c) => {
  const { code } = claimOrderSchema.parse(await c.req.json());
  const me = c.get("customer");
  const r = await prisma.order.updateMany({ where: { code: code.toUpperCase(), phone: me.phone, customerId: null }, data: { customerId: me.id } });
  if (!r.count) throw notFound("Không tìm thấy đơn phù hợp (mã đơn phải đặt bằng SĐT của tài khoản này)");
  return c.json({ ok: true });
});

/* ---------- Thiết kế đã lưu ---------- */
const designListSelect = {
  id: true,
  name: true,
  previewUrl: true,
  updatedAt: true,
  product: { select: { id: true, name: true, slug: true, images: true, isActive: true } },
} satisfies Prisma.SavedDesignSelect;

accountRoutes.get("/designs", async (c) => {
  const productId = c.req.query("productId");
  return c.json(
    await prisma.savedDesign.findMany({
      where: { customerId: c.get("customer").id, ...(productId ? { productId } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: designListSelect,
    }),
  );
});

accountRoutes.get("/designs/:id", async (c) => {
  const d = await prisma.savedDesign.findFirst({ where: { id: c.req.param("id"), customerId: c.get("customer").id } });
  if (!d) throw notFound("Không tìm thấy thiết kế");
  return c.json(d);
});

accountRoutes.post("/designs", async (c) => {
  const input = savedDesignSchema.parse(await c.req.json());
  const me = c.get("customer").id;
  if (input.json.productId !== input.productId) throw new HTTPException(400, { message: "Thiết kế không khớp sản phẩm" });
  const count = await prisma.savedDesign.count({ where: { customerId: me } });
  if (count >= 200) throw new HTTPException(400, { message: "Tối đa 200 thiết kế – xoá bớt thiết kế cũ" });
  const product = await prisma.product.findUnique({ where: { id: input.productId }, select: { id: true } });
  if (!product) throw notFound("Sản phẩm không tồn tại");
  const d = await prisma.savedDesign.create({
    data: { customerId: me, productId: input.productId, name: input.name, json: input.json as unknown as Prisma.InputJsonValue, previewUrl: input.previewUrl },
    select: designListSelect,
  });
  return c.json(d, 201);
});

accountRoutes.put("/designs/:id", async (c) => {
  const input = savedDesignSchema.parse(await c.req.json());
  const r = await prisma.savedDesign.updateMany({
    where: { id: c.req.param("id"), customerId: c.get("customer").id, productId: input.productId },
    data: { name: input.name, json: input.json as unknown as Prisma.InputJsonValue, previewUrl: input.previewUrl },
  });
  if (!r.count) throw notFound("Không tìm thấy thiết kế");
  return c.json({ ok: true });
});

accountRoutes.delete("/designs/:id", async (c) => {
  const r = await prisma.savedDesign.deleteMany({ where: { id: c.req.param("id"), customerId: c.get("customer").id } });
  if (!r.count) throw notFound("Không tìm thấy thiết kế");
  return c.json({ ok: true });
});

/* ---------- Đăng ký làm seller ---------- */
accountRoutes.post("/seller/apply", rateLimit({ key: "sapply", limit: 5, windowMs: 60 * 60_000 }), async (c) => {
  const input = sellerApplySchema.parse(await c.req.json());
  const me = c.get("customer");
  const existing = await prisma.sellerProfile.findUnique({ where: { customerId: me.id }, select: { status: true } });
  if (existing && existing.status !== "REJECTED") throw conflict("Bạn đã gửi đăng ký seller");
  const data = { companyName: input.companyName, taxCode: input.taxCode, storeUrl: input.storeUrl, channels: input.channels.join(","), brandName: input.brandName, status: "PENDING" };
  await prisma.sellerProfile.upsert({ where: { customerId: me.id }, create: { customerId: me.id, ...data }, update: data });
  notifyText("🏪 Đăng ký seller mới", [`${me.name} · ${me.phone}`, input.companyName, input.storeUrl, `Kênh: ${input.channels.join(", ")}`].filter(Boolean));
  return c.json({ ok: true, status: "PENDING" }, 201);
});
