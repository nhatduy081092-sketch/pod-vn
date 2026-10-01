import { notifyText } from "./notify";

/**
 * Đẩy yêu cầu báo giá / liên hệ doanh nghiệp sang Google Sheets + Email qua 1 webhook (Google Apps Script,
 * xem deploy/google-apps-script/yala-quotes.gs). Cấu hình bằng biến môi trường:
 *   QUOTE_WEBHOOK_URL    – URL web app Apps Script (…/exec)
 *   QUOTE_WEBHOOK_SECRET – chuỗi bí mật, khớp SECRET trong script
 *   CMS_URL              – (tuỳ chọn) để kèm link mở yêu cầu trong CMS
 * Không cấu hình -> bỏ qua. Không bao giờ làm hỏng luồng gửi của khách (lỗi chỉ ghi log + báo Telegram).
 */
export type QuotePayload = {
  kind: "quote" | "lead";
  code: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  occasion: string;
  budget: string;
  deadline: string;
  items: { name: string; quantity: number; note?: string; url?: string }[];
  note: string;
  pageUrl: string;
  source: string;
  adminUrl: string;
};

export function webhookConfigured() {
  return !!process.env.QUOTE_WEBHOOK_URL;
}

export function cmsLink(path: string) {
  const base = (process.env.CMS_URL ?? "").replace(/\/$/, "");
  return base ? `${base}${path}` : "";
}

/** Gửi 1 lần, trả kết quả (dùng cho nút "Gửi thử" trong CMS) */
export async function postWebhook(p: QuotePayload): Promise<{ ok: boolean; error: string; retry: boolean }> {
  const url = process.env.QUOTE_WEBHOOK_URL;
  if (!url) return { ok: false, error: "Chưa cấu hình QUOTE_WEBHOOK_URL", retry: false };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: process.env.QUOTE_WEBHOOK_SECRET ?? "", ...p }),
      redirect: "follow",
      signal: ctrl.signal,
    });
    const text = await res.text();
    // Apps Script trả 200 kèm JSON {ok:true}; sai secret -> {ok:false,error}
    if (res.ok && /"ok"\s*:\s*true/.test(text)) return { ok: true, error: "", retry: false };
    return { ok: false, error: `HTTP ${res.status} ${text.replace(/\s+/g, " ").slice(0, 200)}`, retry: res.status >= 500 };
  } catch (e) {
    return { ok: false, error: (e as Error).message, retry: true };
  } finally {
    clearTimeout(timer);
  }
}

/** Đẩy nền, thử lại tối đa 3 lần; thất bại -> log + báo Telegram */
export function dispatchQuote(p: QuotePayload): void {
  if (!webhookConfigured()) return;
  void (async () => {
    let r = { ok: false, error: "", retry: true };
    for (let attempt = 1; attempt <= 3 && r.retry; attempt++) {
      r = await postWebhook(p);
      if (r.ok) return;
      if (r.retry) await new Promise((res) => setTimeout(res, attempt * 2000));
    }
    console.error(`[quote-webhook] ${p.code}: ${r.error}`);
    notifyText(`⚠️ Không đẩy được ${p.code} sang Google Sheets/Email`, [r.error]);
  })();
}

export const sourceOf = (utm?: Record<string, string> | null) =>
  utm ? [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join(" / ") || (utm.gclid ? "google ads" : utm.fbclid ? "facebook" : "") : "";
