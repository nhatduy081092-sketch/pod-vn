import { prisma } from "@pod/db";
import { remoteUploadUrl } from "./upload";

/**
 * Gửi ảnh mẫu thiết kế của đơn / báo giá về Zalo của shop qua Zalo Official Account (tin tư vấn, API v3).
 *
 * Bật khi đủ 4 biến trong .env.production (chỉ trên VPS, không commit):
 *   ZALO_OA_APP_ID, ZALO_OA_SECRET_KEY  – của ứng dụng trên developers.zalo.me đã liên kết OA
 *   ZALO_OA_REFRESH_TOKEN               – refresh token lấy lần đầu khi cấp quyền OA cho ứng dụng
 *   ZALO_OA_NOTIFY_USER_IDS             – user_id (theo OA) của người nhận, cách nhau dấu phẩy
 * Thiếu biến -> bỏ qua, như Telegram.
 *
 * Zalo cấp access token ngắn hạn và đổi refresh token sau mỗi lần làm mới, nên cặp token mới được lưu
 * vào bảng Setting (khoá "zalo-oa:token"); biến môi trường chỉ là token khởi đầu. Đổi ZALO_OA_REFRESH_TOKEN
 * (cấp quyền lại) thì lần gửi sau tự dùng token mới.
 *
 * Chỉ gửi mã đơn, tên sản phẩm, số lượng, ảnh mẫu và link CMS – không gửi tên, SĐT, địa chỉ khách.
 * Không bao giờ làm hỏng luồng đặt hàng / báo giá: chạy nền, lỗi chỉ ghi log.
 * Lưu ý của Zalo: tin tư vấn chỉ tới được người đã quan tâm OA và nhắn OA trong khoảng thời gian cho phép
 * (thường 7 ngày) – người nhận nên nhắn OA định kỳ, nếu không Zalo từ chối và log ghi lỗi.
 */

const TOKEN_KEY = "zalo-oa:token";
const OAUTH_URL = "https://oauth.zaloapp.com/v4/oa/access_token";
const CS_URL = "https://openapi.zalo.me/v3.0/oa/message/cs";
const MAX_IMAGES = 8;
const TIMEOUT_MS = 8000;

type Stored = { accessToken: string; refreshToken: string; expiresAt: number; seed: string };

function config() {
  const appId = process.env.ZALO_OA_APP_ID?.trim();
  const secret = process.env.ZALO_OA_SECRET_KEY?.trim();
  const seed = process.env.ZALO_OA_REFRESH_TOKEN?.trim();
  const users = (process.env.ZALO_OA_NOTIFY_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!appId || !secret || !seed || !users.length) return null;
  return { appId, secret, seed, users };
}
type Config = NonNullable<ReturnType<typeof config>>;

async function fetchJson(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal });
    return (await r.json().catch(() => ({ error: r.status, message: `HTTP ${r.status}` }))) as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
}

async function loadStored(): Promise<Stored | null> {
  const row = await prisma.setting.findUnique({ where: { key: TOKEN_KEY } });
  const v = row?.value as Partial<Stored> | undefined;
  return v?.accessToken && v.refreshToken ? (v as Stored) : null;
}

/** Một lần làm mới tại một thời điểm: refresh token của Zalo chỉ dùng được một lần, gọi song song sẽ làm hỏng nó. */
let refreshing: Promise<string> | null = null;

function refresh(cfg: Config, stored: Stored | null): Promise<string> {
  refreshing ??= (async () => {
    // cấp quyền lại (biến môi trường đổi) -> dùng token mới; còn lại dùng token đã xoay vòng trong DB
    const refreshToken = stored && stored.seed === cfg.seed ? stored.refreshToken : cfg.seed;
    const res = await fetchJson(OAUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", secret_key: cfg.secret },
      body: new URLSearchParams({ refresh_token: refreshToken, app_id: cfg.appId, grant_type: "refresh_token" }),
    });
    const access = typeof res.access_token === "string" ? res.access_token : "";
    const next = typeof res.refresh_token === "string" ? res.refresh_token : "";
    if (!access || !next) throw new Error(`làm mới token thất bại: ${String(res.error_name ?? res.error_description ?? res.message ?? res.error)}`);
    const ttl = Number(res.expires_in) || 3600;
    const value: Stored = { accessToken: access, refreshToken: next, expiresAt: Date.now() + (ttl - 300) * 1000, seed: cfg.seed };
    await prisma.setting.upsert({ where: { key: TOKEN_KEY }, create: { key: TOKEN_KEY, value }, update: { value } });
    return access;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function accessToken(cfg: Config, force = false): Promise<string> {
  const stored = await loadStored();
  if (!force && stored && stored.seed === cfg.seed && stored.expiresAt > Date.now()) return stored.accessToken;
  return refresh(cfg, stored);
}

type CsMessage = { text?: string; attachment?: unknown };

/** Lỗi token của Zalo (hết hạn / không hợp lệ) -> làm mới một lần rồi gửi lại */
const isTokenError = (res: Record<string, unknown>) => res.error === -216 || res.error === -124 || /access.?token/i.test(String(res.message ?? ""));

async function sendCs(cfg: Config, userId: string, message: CsMessage): Promise<void> {
  const call = async (token: string) =>
    fetchJson(CS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: token },
      body: JSON.stringify({ recipient: { user_id: userId }, message }),
    });
  let res = await call(await accessToken(cfg));
  if (res.error !== 0 && isTokenError(res)) res = await call(await accessToken(cfg, true));
  if (res.error !== 0) throw new Error(`Zalo từ chối (${String(res.error)}): ${String(res.message ?? "")}`);
}

const imageMessage = (url: string, caption: string): CsMessage => ({
  text: caption.slice(0, 2000),
  attachment: { type: "template", payload: { template_type: "media", elements: [{ media_type: "image", url }] } },
});

/** "/uploads/<tên>" -> URL công khai trên R2 (Zalo tự tải ảnh về). Lưu local (dev) thì không có URL công khai. */
function publicImage(path: string): string | null {
  const m = /^\/uploads\/([\w.-]+)$/.exec(path);
  return m ? remoteUploadUrl(m[1]!) : null;
}

export type ZaloDesignNotice = {
  kind: "order" | "quote";
  code: string;
  items: { productName: string; quantity: number; variant?: string; previews: { area: string; url: string }[] }[];
  adminUrl?: string;
};

/** Gửi 1 tin tóm tắt + mỗi ảnh mẫu một tin (tối đa 8 ảnh/đơn). Gọi rồi để chạy nền, không await. */
export function notifyZaloDesigns(n: ZaloDesignNotice): void {
  const cfg = config();
  if (!cfg) return;
  void run(cfg, n).catch((e) => console.warn("[zalo-oa]", n.code, (e as Error).message));
}

async function run(cfg: Config, n: ZaloDesignNotice) {
  const images = n.items
    .flatMap((it) => it.previews.map((p) => ({ it, p, url: publicImage(p.url) })))
    .filter((x): x is typeof x & { url: string } => !!x.url)
    .slice(0, MAX_IMAGES);
  const head = n.kind === "order" ? `Đơn mới ${n.code}` : `Yêu cầu báo giá ${n.code}`;
  const summary = [
    `${head} – ${images.length ? `${images.length} ảnh mẫu thiết kế` : "chưa có ảnh mẫu"}`,
    ...n.items.slice(0, 15).map((it) => `• ${it.productName}${it.variant ? ` (${it.variant})` : ""} × ${it.quantity.toLocaleString("vi-VN")}`),
    n.items.length > 15 ? `… và ${n.items.length - 15} sản phẩm khác` : "",
    n.adminUrl ? `Xem đơn: ${n.adminUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  for (const userId of cfg.users) {
    try {
      await sendCs(cfg, userId, { text: summary });
      for (const { it, p, url } of images) await sendCs(cfg, userId, imageMessage(url, `${n.code} · ${it.productName} · ${p.area}`));
    } catch (e) {
      console.warn("[zalo-oa]", n.code, "->", userId.slice(-4), (e as Error).message);
    }
  }
}
