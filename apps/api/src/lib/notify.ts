import { formatVND, PAYMENT_METHOD_LABEL, type PaymentMethod } from "@pod/shared";

type NewOrder = {
  code: string;
  customerName: string;
  phone: string;
  province: string;
  total: number;
  paymentMethod: PaymentMethod;
  note: string;
  items: { productName: string; size: string; quantity: number; designUrl: string; roster?: unknown[] }[];
  utmSource?: string;
};

const esc = (s: string) => s.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch]!);

/**
 * Báo đơn mới qua Telegram. Không cấu hình token -> bỏ qua.
 * Không bao giờ làm hỏng luồng đặt hàng (lỗi chỉ ghi log).
 */
export function notifyNewOrder(o: NewOrder): void {

  const lines = [
    `🛒 <b>Đơn mới ${esc(o.code)}</b> – ${esc(formatVND(o.total))}`,
    `👤 ${esc(o.customerName)} · ${esc(o.phone)} · ${esc(o.province)}`,
    `💳 ${esc(PAYMENT_METHOD_LABEL[o.paymentMethod])}`,
    ...o.items.map(
      (i) =>
        `• ${esc(i.productName)} – ${i.roster?.length ? `👕 đồng phục ${i.roster.length} áo` : `size ${esc(i.size)}`} ×${i.quantity}${i.designUrl ? " 🎨" : " (chưa có file)"}`,
    ),
    o.note ? `📝 ${esc(o.note)}` : "",
    o.utmSource ? `📣 Nguồn: ${esc(o.utmSource)}` : "",
  ].filter(Boolean);

  send(lines.join("\n"));
}

type QuoteInfo = {
  code: string;
  customerName: string;
  phone: string;
  company: string;
  productName: string;
  quantity: number;
  hasDesign: boolean;
  note: string;
};

export function notifyQuote(q: QuoteInfo): void {
  const lines = [
    `🧾 <b>Yêu cầu báo giá ${esc(q.code)}</b>`,
    `👤 ${esc(q.customerName)} · ${esc(q.phone)}${q.company ? ` · ${esc(q.company)}` : ""}`,
    `📦 ${esc(q.productName)} × ${q.quantity}${q.hasDesign ? " 🎨 có file" : ""}`,
    q.note ? `📝 ${esc(q.note)}` : "",
  ].filter(Boolean);
  send(lines.join("\n"));
}

/** Yêu cầu báo giá nhiều sản phẩm (giỏ báo giá doanh nghiệp) */
export function notifyQuoteCart(q: {
  code: string;
  customerName: string;
  phone: string;
  company: string;
  occasion: string;
  budget: string;
  deadline: string;
  items: { name: string; quantity: number }[];
  note: string;
  link: string;
}): void {
  const total = q.items.reduce((s, i) => s + i.quantity, 0);
  const lines = [
    `🧾 <b>Yêu cầu báo giá ${esc(q.code)}</b> – ${q.items.length} sản phẩm · ${total.toLocaleString("vi-VN")} cái`,
    `👤 ${esc(q.customerName)} · ${esc(q.phone)}${q.company ? ` · ${esc(q.company)}` : ""}`,
    [q.occasion && `🎯 ${esc(q.occasion)}`, q.budget && `💰 ${esc(q.budget)}/phần`, q.deadline && `⏰ ${esc(q.deadline)}`].filter(Boolean).join(" · "),
    ...q.items.slice(0, 15).map((i) => `• ${esc(i.name)} × ${i.quantity.toLocaleString("vi-VN")}`),
    q.items.length > 15 ? `… và ${q.items.length - 15} sản phẩm khác` : "",
    q.note ? `📝 ${esc(q.note.slice(0, 400))}` : "",
    q.link ? `🔗 ${esc(q.link)}` : "",
  ].filter(Boolean);
  send(lines.join("\n"));
}

export function notifyLead(l: { name: string; phone: string; topic: string; message: string; pageUrl: string; ip?: string }): void {
  send(
    [
      `📞 <b>Khách để lại SĐT</b> – ${esc(l.topic)}`,
      `👤 ${esc(l.name)} · ${esc(l.phone)}`,
      l.message ? `💬 ${esc(l.message.slice(0, 500))}` : "",
      l.pageUrl ? `🔗 ${esc(l.pageUrl.slice(0, 200))}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

/** Thông báo ngắn cho admin (seller đăng ký, đơn dropship, thanh toán gộp...) */
export function notifyText(title: string, lines: string[] = []): void {
  send([`<b>${esc(title)}</b>`, ...lines.map(esc)].join("\n"));
}

function send(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    signal: ctrl.signal,
  })
    .then(async (r) => {
      if (!r.ok) console.warn("[telegram] gửi thất bại:", r.status, await r.text().catch(() => ""));
    })
    .catch((e) => console.warn("[telegram] lỗi:", (e as Error).message))
    .finally(() => clearTimeout(timer));
}
