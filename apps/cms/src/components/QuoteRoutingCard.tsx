"use client";
import { useEffect, useState, useTransition } from "react";
import type { LandingSettings } from "@pod/shared";
import { integrationStatusAction, testWebhookAction, type IntegrationStatus } from "@/lib/actions";

type V = LandingSettings["b2bQuote"];

/** Ngưỡng đơn online / báo giá + kênh nhận yêu cầu (Zalo sales, Telegram, Google Sheets + Email) */
export function QuoteRoutingCard({ value, onChange, brandZalo }: { value: V; onChange: (v: Partial<V>) => void; brandZalo: string }) {
  const [st, setSt] = useState<IntegrationStatus | null>(null);
  const [test, setTest] = useState<{ ok: boolean; error: string } | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    void integrationStatusAction().then(setSt);
  }, []);
  const Dot = ({ on }: { on?: boolean }) => <span className={`inline-block h-2 w-2 rounded-full ${on ? "bg-green-600" : "bg-neutral-300"}`} />;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        <label className="block">
          <span className="label">Ngưỡng báo giá (số lượng / sản phẩm)</span>
          <input type="number" min={2} className="input" value={value.threshold} onChange={(e) => onChange({ threshold: Math.max(2, Math.round(Number(e.target.value) || 2)) })} />
          <span className="mt-0.5 block text-xs text-neutral-500">Từ số lượng này: trang sản phẩm & giỏ hàng gợi ý gửi yêu cầu báo giá.</span>
        </label>
        <label className="flex items-start gap-2 pt-6 text-sm">
          <input type="checkbox" className="mt-0.5" checked={value.enforce} onChange={(e) => onChange({ enforce: e.target.checked })} />
          <span>
            <b>Bắt buộc báo giá</b> với sản phẩm nhập từ nguồn khi đạt ngưỡng (không cho đặt online).
            <span className="block text-xs text-neutral-500">Áo tự thiết kế, đồng phục nhóm vẫn đặt online bình thường.</span>
          </span>
        </label>
        <label className="block">
          <span className="label">Zalo sales nhận báo giá</span>
          <input className="input" value={value.salesZalo} placeholder={`Trống = Zalo thương hiệu (${brandZalo})`} onChange={(e) => onChange({ salesZalo: e.target.value.replace(/[^\d+]/g, "") })} />
        </label>
        <label className="block">
          <span className="label">Tên sales / bộ phận (hiện sau khi khách gửi)</span>
          <input className="input" value={value.salesName} placeholder="VD: Phòng kinh doanh YALA" onChange={(e) => onChange({ salesName: e.target.value })} />
        </label>
        <label className="block md:col-span-2">
          <span className="label">Cam kết thời gian phản hồi</span>
          <input className="input" value={value.responseTime} onChange={(e) => onChange({ responseTime: e.target.value })} />
        </label>
      </div>

      <div className="rounded-lg border border-dashed p-3 text-sm">
        <p className="font-semibold">Kênh nhận yêu cầu báo giá</p>
        <ul className="mt-2 space-y-1.5">
          <li className="flex items-center gap-2"><Dot on /> CMS → Đơn hàng (nhãn BÁO GIÁ) – luôn bật</li>
          <li className="flex items-center gap-2"><Dot on={st?.telegram} /> Telegram {st && !st.telegram && <span className="text-xs text-neutral-500">– thêm TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID</span>}</li>
          <li className="flex items-center gap-2">
            <Dot on={st?.quoteWebhook} /> Google Sheets + Email sales
            {st && !st.quoteWebhook && <span className="text-xs text-neutral-500">– chưa cấu hình QUOTE_WEBHOOK_URL (xem deploy/google-apps-script/README.md)</span>}
          </li>
          <li className="flex items-center gap-2"><Dot on /> Zalo: khách được mời sao chép nội dung & nhắn Zalo sales sau khi gửi</li>
        </ul>
        {st?.quoteWebhook && (
          <div className="mt-3 flex items-center gap-3">
            <button type="button" className="btn-ghost" disabled={pending} onClick={() => start(async () => setTest(await testWebhookAction()))}>
              {pending ? "Đang gửi thử…" : "Gửi thử sang Sheets/Email"}
            </button>
            {test && <span className={`text-xs ${test.ok ? "text-green-700" : "text-red-600"}`}>{test.ok ? "✓ Đã ghi dòng BG-TEST vào sheet và gửi email" : test.error}</span>}
          </div>
        )}
        {st && !st.cmsUrl && <p className="mt-2 text-xs text-neutral-500">Gợi ý: thêm CMS_URL để thông báo kèm link mở yêu cầu trong CMS.</p>}
      </div>
    </div>
  );
}
