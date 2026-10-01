import { Hono } from "hono";
import { prisma, type Prisma } from "@pod/db";
import { orderCreateSchema, orderLookupSchema, quoteCartSchema, quoteCreateSchema, shippingOptions } from "@pod/shared";
import { z } from "zod";
import { getLanding } from "../lib/settings";
import { badRequest, clientIp, notFound } from "../lib/http";
import { rateLimit } from "../lib/rate-limit";
import { saveUpload } from "../lib/upload";
import { notifyNewOrder, notifyQuote, notifyQuoteCart } from "../lib/notify";
import { cmsLink, dispatchQuote, sourceOf } from "../lib/quote-dispatch";
import { assertDesign, loadProducts, priceLines, quoteShipping, withUniqueCode } from "../lib/order-service";
import { currentCustomer } from "../lib/customer-auth";

export const checkoutRoutes = new Hono();

/** Upload file của khách: ảnh thiết kế (≤50MB) hoặc file in xuất từ editor (kind=print, ≤60MB) */
checkoutRoutes.post("/uploads", rateLimit({ key: "upload", limit: 80, windowMs: 10 * 60_000 }), async (c) => {
  const body = await c.req.parseBody();
  const kind = body["kind"] === "print" ? "print" : "design";
  return c.json(await saveUpload(body["file"], { kind }), 201);
});

/** Báo phí ship trước khi đặt: tính cân nặng từ biến thể, áp miễn phí theo tạm tính */
const shippingQuoteSchema = z.object({
  province: z.string().min(2).max(40),
  items: z
    .array(z.object({ productId: z.string().min(1).max(40), variantId: z.string().max(40).optional(), quantity: z.number().int().min(1).max(10000) }))
    .min(1)
    .max(50),
  subtotal: z.number().int().min(0).max(10_000_000_000),
});
checkoutRoutes.post("/shipping/quote", rateLimit({ key: "shipq", limit: 120, windowMs: 60_000 }), async (c) => {
  const input = shippingQuoteSchema.parse(await c.req.json());
  const byId = await loadProducts(input.items.map((i) => i.productId));
  let weightGram = 0;
  for (const it of input.items) {
    const p = byId.get(it.productId);
    if (!p) continue;
    const v = it.variantId ? p.variants.find((x) => x.id === it.variantId) : undefined;
    weightGram += (v?.weightGram ?? p.weightGram) * it.quantity;
  }
  const settings = await getLanding();
  return c.json({ weightGram, options: shippingOptions(settings.shipping, { province: input.province, weightGram, subtotal: input.subtotal }) });
});

/**
 * "Đơn nhỏ mua online, đơn lớn báo giá": khi bật bắt buộc trong CMS, sản phẩm nhập từ nguồn (quà tặng doanh nghiệp)
 * có số lượng từ ngưỡng trở lên phải gửi yêu cầu báo giá thay vì đặt online.
 */
async function assertBelowQuoteThreshold(items: { productId: string; quantity: number }[]) {
  const { b2bQuote } = await getLanding();
  if (!b2bQuote.enforce) return;
  const qty = new Map<string, number>();
  for (const i of items) qty.set(i.productId, (qty.get(i.productId) ?? 0) + i.quantity);
  const big = [...qty].filter(([, q]) => q >= b2bQuote.threshold).map(([id]) => id);
  if (!big.length) return;
  const hit = await prisma.product.findFirst({ where: { id: { in: big }, externalId: { startsWith: "oem:" } }, select: { name: true } });
  if (hit) throw badRequest(`"${hit.name}" từ ${b2bQuote.threshold} sản phẩm vui lòng gửi yêu cầu báo giá để nhận giá số lượng lớn`);
}

/** Tạo đơn – giá & phí ship luôn tính lại phía server */
checkoutRoutes.post("/orders", rateLimit({ key: "order", limit: 10, windowMs: 10 * 60_000 }), async (c) => {
  const input = orderCreateSchema.parse(await c.req.json());
  const customer = await currentCustomer(c);
  await assertBelowQuoteThreshold(input.items);
  const priced = await priceLines(input.items);
  const ship = await quoteShipping(input.province, priced.weightGram, priced.subtotal, input.shippingMethod);
  const total = priced.subtotal + ship.fee;

  const order = await withUniqueCode("POD", (code) =>
    prisma.order.create({
      data: {
        code,
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        province: input.province,
        ward: input.ward,
        addressLine: input.addressLine,
        note: input.note,
        paymentMethod: input.paymentMethod,
        subtotal: priced.subtotal,
        shippingFee: ship.fee,
        shippingMethod: ship.method,
        weightGram: priced.weightGram,
        total,
        customerId: customer?.id,
        utm: input.utm ?? undefined,
        ip: clientIp(c),
        items: { create: priced.lines.map((l) => l.data) },
      },
      select: { code: true, total: true, paymentMethod: true },
    }),
  );

  notifyNewOrder({
    code: order.code,
    customerName: input.customerName,
    phone: input.phone,
    province: input.province,
    total: order.total,
    paymentMethod: input.paymentMethod,
    note: input.note,
    items: priced.lines.map((l) => ({
      productName: l.data.productName,
      size: [l.data.color, l.data.size].filter(Boolean).join(" / "),
      quantity: l.data.quantity,
      designUrl: l.data.designUrl ?? "",
      roster: (l.data.roster as unknown[] | undefined) ?? undefined,
    })),
    utmSource: input.utm?.utm_source ?? (input.utm?.fbclid ? "facebook" : input.utm?.gclid ? "google" : undefined),
  });
  return c.json(order, 201);
});

/** Yêu cầu báo giá / cá nhân hoá (sản phẩm chưa có giá) – lưu như đơn loại "báo giá" */
checkoutRoutes.post("/quotes", rateLimit({ key: "quote", limit: 10, windowMs: 10 * 60_000 }), async (c) => {
  const input = quoteCreateSchema.parse(await c.req.json());
  const customer = await currentCustomer(c);
  const byId = await loadProducts([input.productId]);
  const p = byId.get(input.productId);
  if (!p) throw notFound("Sản phẩm không còn hiển thị");
  if (input.design) assertDesign(p, input.design);
  const variant = input.variantId ? p.variants.find((v) => v.id === input.variantId && v.isActive) : undefined;
  if (input.variantId && !variant) throw badRequest("Phân loại đã chọn không còn");
  const firstFile = input.design?.files[0];

  const order = await withUniqueCode("BG", (code) =>
    prisma.order.create({
      data: {
        code,
        isQuote: true,
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        company: input.company,
        province: "",
        ward: "",
        addressLine: "",
        note: input.note,
        paymentMethod: "BANK_TRANSFER",
        subtotal: 0,
        shippingFee: 0,
        total: 0,
        customerId: customer?.id,
        utm: input.utm ?? undefined,
        ip: clientIp(c),
        items: {
          create: [
            {
              productId: p.id,
              variantId: variant?.id,
              sku: variant?.sku ?? "",
              productName: p.name,
              productImg: firstFile?.previewUrl ?? p.images[0] ?? "",
              size: variant?.size || input.size || "—",
              color: variant?.color ?? "",
              quantity: input.quantity,
              unitPrice: 0,
              lineTotal: 0,
              designUrl: firstFile?.printUrl ?? input.designUrl,
              designNote: input.note,
              design: input.design ? (input.design as unknown as Prisma.InputJsonValue) : undefined,
            },
          ],
        },
      },
      select: { code: true, id: true },
    }),
  );
  dispatchQuote({
    kind: "quote",
    code: order.code,
    createdAt: new Date().toISOString(),
    name: input.customerName,
    phone: input.phone,
    email: input.email,
    company: input.company,
    occasion: "",
    budget: "",
    deadline: "",
    items: [{ name: p.name, quantity: input.quantity, note: variant ? [variant.color, variant.size].filter(Boolean).join(" / ") : input.size }],
    note: input.note,
    pageUrl: `/san-pham/${p.slug}`,
    source: sourceOf(input.utm),
    adminUrl: cmsLink(`/orders/${order.id}`),
  });
  notifyQuote({
    code: order.code,
    customerName: input.customerName,
    phone: input.phone,
    company: input.company,
    productName: p.name,
    quantity: input.quantity,
    hasDesign: !!(input.designUrl || input.design),
    note: input.note,
  });
  return c.json({ code: order.code }, 201);
});

/** Danh sách báo giá nhiều sản phẩm (doanh nghiệp) – lưu như đơn "báo giá", đẩy Telegram + Sheets/Email */
checkoutRoutes.post("/quotes/cart", rateLimit({ key: "quote-cart", limit: 6, windowMs: 10 * 60_000 }), async (c) => {
  const input = quoteCartSchema.parse(await c.req.json());
  const customer = await currentCustomer(c);
  const byId = await loadProducts(input.items.map((i) => i.productId));
  const lines = input.items.map((i) => ({ ...i, p: byId.get(i.productId) })).filter((x) => x.p);
  if (!lines.length) throw notFound("Các sản phẩm trong danh sách không còn hiển thị");
  const deadline = input.deadline ? input.deadline.split("-").reverse().join("/") : "";
  const header = [
    input.occasion && `Dịp: ${input.occasion}`,
    input.budget && `Ngân sách/phần: ${input.budget}`,
    deadline && `Cần hàng trước: ${deadline}`,
    lines.length < input.items.length ? `(${input.items.length - lines.length} sản phẩm đã ngừng hiển thị nên bị bỏ qua)` : "",
  ].filter(Boolean);
  const note = [...header, input.note].filter(Boolean).join("\n").slice(0, 2000);

  const order = await withUniqueCode("BG", (code) =>
    prisma.order.create({
      data: {
        code,
        isQuote: true,
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        company: input.company,
        province: "",
        ward: "",
        addressLine: "",
        note,
        paymentMethod: "BANK_TRANSFER",
        subtotal: 0,
        shippingFee: 0,
        total: 0,
        customerId: customer?.id,
        utm: input.utm ?? undefined,
        ip: clientIp(c),
        items: {
          create: lines.map(({ p, quantity, note: n }) => ({
            productId: p!.id,
            sku: "",
            productName: p!.name,
            productImg: p!.images[0] ?? "",
            size: "—",
            color: "",
            quantity,
            unitPrice: 0,
            lineTotal: 0,
            designUrl: "",
            designNote: n,
          })),
        },
      },
      select: { code: true, id: true },
    }),
  );
  const items = lines.map(({ p, quantity, note: n }) => ({ name: p!.name, quantity, note: n, url: `/san-pham/${p!.slug}` }));
  const adminUrl = cmsLink(`/orders/${order.id}`);
  notifyQuoteCart({ code: order.code, customerName: input.customerName, phone: input.phone, company: input.company, occasion: input.occasion, budget: input.budget, deadline, items, note: input.note, link: adminUrl });
  dispatchQuote({
    kind: "quote",
    code: order.code,
    createdAt: new Date().toISOString(),
    name: input.customerName,
    phone: input.phone,
    email: input.email,
    company: input.company,
    occasion: input.occasion,
    budget: input.budget,
    deadline,
    items,
    note: input.note,
    pageUrl: input.pageUrl,
    source: sourceOf(input.utm),
    adminUrl,
  });
  return c.json({ code: order.code, items: items.length }, 201);
});

const orderViewSelect = {
  code: true,
  customerName: true,
  province: true,
  ward: true,
  addressLine: true,
  paymentMethod: true,
  paymentStatus: true,
  status: true,
  subtotal: true,
  shippingFee: true,
  shippingMethod: true,
  total: true,
  trackingCode: true,
  isQuote: true,
  createdAt: true,
  items: {
    select: {
      productId: true,
      variantId: true,
      productName: true,
      productImg: true,
      size: true,
      color: true,
      quantity: true,
      unitPrice: true,
      lineTotal: true,
      designUrl: true,
      roster: true,
      design: true,
      printMode: true,
      designNote: true,
      product: { select: { slug: true, isActive: true } },
    },
  },
} satisfies Prisma.OrderSelect;
export type OrderView = Prisma.OrderGetPayload<{ select: typeof orderViewSelect }>;
export { orderViewSelect };

/** Tra cứu đơn: cần đúng mã đơn + SĐT */
checkoutRoutes.get("/orders/lookup", rateLimit({ key: "lookup", limit: 30, windowMs: 10 * 60_000 }), async (c) => {
  const { code, phone } = orderLookupSchema.parse({ code: c.req.query("code"), phone: c.req.query("phone") });
  const order = await prisma.order.findFirst({ where: { code: code.toUpperCase(), phone }, select: orderViewSelect });
  if (!order) throw notFound("Không tìm thấy đơn hàng. Kiểm tra lại mã đơn và số điện thoại.");
  const settings = await getLanding();
  return c.json({ ...order, bank: order.paymentMethod === "BANK_TRANSFER" && !order.isQuote ? settings.bank : null });
});
