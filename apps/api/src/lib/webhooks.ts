import { createHmac } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { prisma } from "@pod/db";

/**
 * Webhook trạng thái đơn cho seller (Open API).
 * - Ký HMAC-SHA256: header X-POD-Signature = hex(hmac(secret, body)), X-POD-Event, X-POD-Delivery
 * - Chỉ https, chặn địa chỉ nội bộ (SSRF), không theo redirect, timeout 8s
 * - Thử lại 3 lần (0s, 5s, 30s), lưu lịch sử vào WebhookDelivery để seller xem
 */
export type WebhookEvent = "order.created" | "order.updated" | "order.shipped" | "order.cancelled" | "ping";

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number) as [number, number];
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") || v.startsWith("::ffff:192.168.");
}

export async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("URL không hợp lệ");
  }
  if (url.protocol !== "https:") throw new Error("Webhook phải dùng https://");
  if (url.username || url.password) throw new Error("URL không được chứa tài khoản/mật khẩu");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("Không cho phép địa chỉ nội bộ");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("Không cho phép địa chỉ nội bộ");
  return url;
}

export function signBody(secret: string, body: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

async function deliver(deliveryId: string, url: string, secret: string, event: string, body: string, maxAttempts = 3) {
  const delays = [0, 5_000, 30_000].slice(0, maxAttempts);
  let lastStatus = 0;
  let lastError = "";
  for (let i = 0; i < delays.length; i++) {
    if (delays[i]) await new Promise((r) => setTimeout(r, delays[i]));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8_000);
    try {
      await assertPublicHttpsUrl(url);
      const res = await fetch(url, {
        method: "POST",
        redirect: "manual",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "POD-VN-Webhook/1.0",
          "X-POD-Event": event,
          "X-POD-Delivery": deliveryId,
          "X-POD-Signature": signBody(secret, body),
        },
        body,
      });
      lastStatus = res.status;
      if (res.ok) {
        await prisma.webhookDelivery.update({ where: { id: deliveryId }, data: { status: res.status, ok: true, attempts: i + 1, error: "" } });
        return;
      }
      lastError = `HTTP ${res.status}`;
      if (res.status >= 400 && res.status < 500 && res.status !== 429) break; // lỗi phía seller, không thử lại
    } catch (e) {
      lastError = (e as Error).name === "AbortError" ? "Hết thời gian chờ (8s)" : (e as Error).message;
      if (/nội bộ|https|không hợp lệ/.test(lastError)) break;
    } finally {
      clearTimeout(timer);
    }
    await prisma.webhookDelivery.update({ where: { id: deliveryId }, data: { status: lastStatus, attempts: i + 1, error: lastError.slice(0, 300) } }).catch(() => undefined);
  }
  await prisma.webhookDelivery
    .update({ where: { id: deliveryId }, data: { status: lastStatus, ok: false, error: lastError.slice(0, 300) } })
    .catch(() => undefined);
}

/** Gửi webhook sự kiện đơn cho seller sở hữu đơn (chạy nền, không chặn request) */
export async function emitOrderEvent(orderId: string, event: WebhookEvent): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      code: true,
      externalId: true,
      status: true,
      paymentStatus: true,
      trackingCode: true,
      total: true,
      shippingFee: true,
      updatedAt: true,
      sellerId: true,
      seller: { select: { seller: { select: { webhookUrl: true, webhookSecret: true, status: true } } } },
    },
  });
  const cfg = order?.seller?.seller;
  if (!order?.sellerId || !cfg?.webhookUrl || !cfg.webhookSecret || cfg.status !== "APPROVED") return;
  const body = JSON.stringify({
    event,
    sentAt: new Date().toISOString(),
    order: {
      code: order.code,
      externalId: order.externalId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      trackingCode: order.trackingCode,
      total: order.total,
      shippingFee: order.shippingFee,
      updatedAt: order.updatedAt,
    },
  });
  const d = await prisma.webhookDelivery.create({ data: { sellerId: order.sellerId, event, orderCode: order.code, url: cfg.webhookUrl } });
  void deliver(d.id, cfg.webhookUrl, cfg.webhookSecret, event, body).catch((e) => console.warn("[webhook]", (e as Error).message));
}

export async function sendPing(sellerId: string, url: string, secret: string) {
  const body = JSON.stringify({ event: "ping", sentAt: new Date().toISOString() });
  const d = await prisma.webhookDelivery.create({ data: { sellerId, event: "ping", orderCode: "-", url } });
  await deliver(d.id, url, secret, "ping", body, 1);
  return prisma.webhookDelivery.findUnique({ where: { id: d.id } });
}
