import { prisma, type Prisma } from "@pod/db";
import { formatVND, orderDesignSchema, sellerOrderCreateSchema, type SellerOrderInput } from "@pod/shared";
import { HTTPException } from "hono/http-exception";
import { badRequest } from "./http";
import { priceLines, quoteShipping, withUniqueCode, type LineInput } from "./order-service";
import { emitOrderEvent } from "./webhooks";
import { notifyText } from "./notify";
import type { SellerCtx } from "./customer-auth";

export type SellerOrderResult = { code: string; externalId: string | null; total: number; status: string; duplicate: boolean };

const SOURCE_LABEL = { web: "Web seller", csv: "Nhập CSV", api: "Open API" } as const;

/**
 * Tạo đơn dropship cho seller – dùng chung cho form web, CSV và Open API.
 * - Idempotent theo externalId: gửi lại cùng mã đơn -> trả đơn cũ (duplicate=true), không tạo trùng
 * - Giá = giá bán lẻ (KM, giá sỉ theo tổng SL) + phụ phí mặt in, trừ % chiết khấu seller
 * - Seller thanh toán trước (chuyển khoản, có thể gộp nhiều đơn); codAmount là tiền thu hộ khách cuối
 */
export async function createSellerOrder(seller: SellerCtx, raw: unknown, source: keyof typeof SOURCE_LABEL): Promise<SellerOrderResult> {
  const input: SellerOrderInput = sellerOrderCreateSchema.parse(raw);

  if (input.externalId) {
    const dup = await prisma.order.findUnique({
      where: { sellerId_externalId: { sellerId: seller.id, externalId: input.externalId } },
      select: { code: true, externalId: true, total: true, status: true },
    });
    if (dup) return { ...dup, duplicate: true };
  }

  const codes = [...new Set(input.items.map((i) => i.template))];
  const templates = await prisma.sellerProduct.findMany({
    where: { sellerId: seller.id, code: { in: codes }, isActive: true },
    select: { code: true, productId: true, design: true, title: true },
  });
  const byCode = new Map(templates.map((t) => [t.code, t]));
  const lines: LineInput[] = input.items.map((it) => {
    const t = byCode.get(it.template);
    if (!t) throw badRequest(`Không tìm thấy mẫu "${it.template}" (hoặc mẫu đang tắt)`);
    const design = orderDesignSchema.safeParse(t.design);
    if (!design.success) throw badRequest(`Mẫu "${it.template}" có dữ liệu thiết kế lỗi – mở lại và lưu mẫu`);
    return { productId: t.productId, color: it.color, size: it.size, quantity: it.quantity, design: design.data, designNote: `Mẫu ${t.code}` };
  });

  const priced = await priceLines(lines, { discountPercent: seller.discountPercent });
  const r = input.recipient;
  const ship = await quoteShipping(r.province, priced.weightGram, priced.subtotal, input.shippingMethod);
  // Đơn dropship không áp miễn phí ship theo ngưỡng (seller trả phí ship thực)
  const shippingFee = ship.baseFee;
  const total = priced.subtotal + shippingFee;
  const note = [`[${SOURCE_LABEL[source]}]`, input.externalId ? `Mã seller: ${input.externalId}` : "", input.note].filter(Boolean).join(" · ");

  let order;
  try {
    order = await withUniqueCode("DS", (code) =>
      prisma.order.create({
        data: {
          code,
          customerName: r.name,
          phone: r.phone,
          province: r.province,
          ward: r.ward,
          addressLine: r.addressLine,
          note,
          paymentMethod: "BANK_TRANSFER",
          subtotal: priced.subtotal,
          shippingFee,
          shippingMethod: ship.method,
          weightGram: priced.weightGram,
          total,
          sellerId: seller.id,
          externalId: input.externalId ?? null,
          codAmount: input.codAmount,
          whiteLabel: input.whiteLabel,
          items: { create: priced.lines.map((l) => l.data) },
        },
        select: { id: true, code: true, externalId: true, total: true, status: true },
      }),
    );
  } catch (e) {
    // 2 request cùng externalId chạy song song -> unique (sellerId, externalId)
    if ((e as { code?: string }).code === "P2002" && input.externalId) {
      const dup = await prisma.order.findUnique({
        where: { sellerId_externalId: { sellerId: seller.id, externalId: input.externalId } },
        select: { code: true, externalId: true, total: true, status: true },
      });
      if (dup) return { ...dup, duplicate: true };
    }
    throw e;
  }

  void emitOrderEvent(order.id, "order.created").catch(() => undefined);
  notifyText(`📦 Đơn dropship ${order.code} – ${formatVND(order.total)}`, [
    `Seller: ${seller.name} · ${seller.phone} (${SOURCE_LABEL[source]})`,
    `Giao: ${r.name} · ${r.province}`,
    input.codAmount ? `Thu hộ: ${formatVND(input.codAmount)}` : "",
  ].filter(Boolean));
  return { code: order.code, externalId: order.externalId, total: order.total, status: order.status, duplicate: false };
}

/** Seller huỷ đơn: chỉ khi chưa xác nhận và chưa thanh toán */
export async function cancelSellerOrder(sellerId: string, code: string) {
  const o = await prisma.order.findFirst({
    where: { code: code.toUpperCase(), sellerId },
    select: { id: true, status: true, paymentStatus: true, batch: { select: { status: true } } },
  });
  if (!o) throw new HTTPException(404, { message: "Không tìm thấy đơn" });
  if (o.status !== "PENDING" || o.paymentStatus !== "UNPAID") throw badRequest("Đơn đã được xác nhận/thanh toán – liên hệ hỗ trợ để huỷ");
  await prisma.order.update({ where: { id: o.id }, data: { status: "CANCELLED", batchId: null, adminNote: "Seller tự huỷ" } });
  void emitOrderEvent(o.id, "order.cancelled").catch(() => undefined);
  return { ok: true };
}

export const sellerOrderSelect = {
  code: true,
  externalId: true,
  status: true,
  paymentStatus: true,
  customerName: true,
  phone: true,
  province: true,
  ward: true,
  addressLine: true,
  subtotal: true,
  shippingFee: true,
  shippingMethod: true,
  total: true,
  codAmount: true,
  trackingCode: true,
  whiteLabel: true,
  createdAt: true,
  batch: { select: { code: true, status: true } },
  items: { select: { productName: true, productImg: true, sku: true, color: true, size: true, quantity: true, unitPrice: true, lineTotal: true, designNote: true } },
} satisfies Prisma.OrderSelect;
