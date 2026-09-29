"use client";
import { useEffect, useState } from "react";
import { formatDateTimeVN, WEBHOOK_EVENTS } from "@pod/shared";
import { api } from "@/lib/account";
import { assetUrl, SITE_URL } from "@/lib/config";
import { Box, useSeller } from "./SellerShell";

type Key = { id: string; name: string; prefix: string; lastUsedAt: string | null; revokedAt: string | null; createdAt: string };
type Delivery = { id: string; event: string; orderCode: string; status: number; ok: boolean; attempts: number; error: string; createdAt: string };

const Code = ({ children }: { children: string }) => <pre className="mt-1 overflow-x-auto rounded-lg bg-ink p-3 text-xs leading-relaxed text-white">{children}</pre>;

/* ================== API key + Webhook + tài liệu ================== */
export function SellerApi() {
  const { ov, reload } = useSeller();
  const [keys, setKeys] = useState<Key[] | null>(null);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [wh, setWh] = useState(ov.profile.webhookUrl);
  const [secret, setSecret] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [msg, setMsg] = useState("");

  const loadKeys = () => api<Key[]>("/seller/api-keys").then(setKeys).catch(() => setKeys([]));
  const loadDel = () => api<Delivery[]>("/seller/webhook/deliveries").then(setDeliveries).catch(() => undefined);
  useEffect(() => {
    void loadKeys();
    void loadDel();
  }, []);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await api<{ key: string }>("/seller/api-keys", { method: "POST", json: { name: name.trim() } });
      setFresh(r.key);
      setName("");
      void loadKeys();
    } catch (err) {
      alert((err as Error).message);
    }
  }
  async function revoke(k: Key) {
    if (!confirm(`Thu hồi key "${k.name}"? Hệ thống đang dùng key này sẽ ngừng kết nối.`)) return;
    await api(`/seller/api-keys/${k.id}`, { method: "DELETE" }).catch(() => undefined);
    void loadKeys();
  }
  async function saveWebhook() {
    setMsg("");
    try {
      const p = ov.profile;
      await api("/seller/settings", { method: "PUT", json: { companyName: p.companyName, taxCode: p.taxCode, storeUrl: p.storeUrl, brandName: p.brandName, labelImage: p.labelImage, webhookUrl: wh.trim() } });
      await reload();
      setMsg("✓ Đã lưu webhook");
    } catch (e) {
      setMsg((e as Error).message);
    }
  }
  async function test() {
    setMsg("Đang gửi ping…");
    try {
      const r = await api<{ ok: boolean; status: number; error?: string }>("/seller/webhook/test", { method: "POST" });
      setMsg(r.ok ? `✓ Ping thành công (HTTP ${r.status})` : `Ping lỗi: ${r.error || `HTTP ${r.status}`}`);
    } catch (e) {
      setMsg((e as Error).message);
    }
    void loadDel();
  }
  async function rotate() {
    if (!confirm("Tạo secret mới? Secret cũ hết hiệu lực ngay.")) return;
    const r = await api<{ webhookSecret: string }>("/seller/webhook/rotate", { method: "POST" });
    setSecret(r.webhookSecret);
    void reload();
  }

  const base = `${SITE_URL}/api/v1`;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black md:text-2xl">Open API & Webhook</h1>

      <Box>
        <h2 className="font-extrabold">API key</h2>
        <p className="text-sm text-ink/60">Dùng để hệ thống của bạn (website, phần mềm bán hàng) tự đẩy đơn. Tối đa 5 key đang hoạt động.</p>
        {fresh && (
          <div className="mt-3 rounded-lg border-2 border-green-600 bg-green-50 p-3 text-sm">
            <p className="font-bold">Key mới – chỉ hiện 1 lần, hãy lưu lại ngay:</p>
            <p className="mt-1 break-all font-mono">{fresh}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn-outline px-3 py-1 text-xs" onClick={() => navigator.clipboard?.writeText(fresh)}>
                Sao chép
              </button>
              <button type="button" className="text-xs underline" onClick={() => setFresh(null)}>
                Đã lưu, ẩn đi
              </button>
            </div>
          </div>
        )}
        <form onSubmit={createKey} className="mt-3 flex gap-2">
          <input className="input h-10 max-w-xs" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên key (VD: Website chính)" aria-label="Tên key" />
          <button className="btn-primary h-10 px-4" disabled={!name.trim()}>
            Tạo key
          </button>
        </form>
        {keys && keys.length > 0 && (
          <ul className="mt-3 divide-y divide-ink/10 text-sm">
            {keys.map((k) => (
              <li key={k.id} className={`flex flex-wrap items-center gap-2 py-2 ${k.revokedAt ? "opacity-50" : ""}`}>
                <span className="font-semibold">{k.name}</span>
                <code className="text-xs">{k.prefix}…</code>
                <span className="text-xs text-ink/60">
                  Tạo {formatDateTimeVN(k.createdAt)}
                  {k.lastUsedAt ? ` · Dùng gần nhất ${formatDateTimeVN(k.lastUsedAt)}` : " · Chưa dùng"}
                </span>
                {k.revokedAt ? (
                  <span className="ml-auto text-xs">Đã thu hồi</span>
                ) : (
                  <button type="button" className="ml-auto text-xs text-red-600 underline" onClick={() => revoke(k)}>
                    Thu hồi
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Box>

      <Box>
        <h2 className="font-extrabold">Webhook</h2>
        <p className="text-sm text-ink/60">Nhận thông báo khi đơn đổi trạng thái / có mã vận đơn. Sự kiện: {WEBHOOK_EVENTS.join(", ")}.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input className="input h-10 min-w-[240px] flex-1" value={wh} onChange={(e) => setWh(e.target.value)} placeholder="https://your-shop.vn/webhooks/pod" aria-label="Webhook URL" />
          <button type="button" className="btn-primary h-10 px-4" onClick={saveWebhook}>
            Lưu
          </button>
          <button type="button" className="btn-outline h-10 px-4" onClick={test} disabled={!ov.profile.webhookUrl}>
            Gửi thử
          </button>
        </div>
        {ov.profile.webhookSecret && (
          <p className="mt-2 text-sm">
            Secret ký: <code>{secret ?? ov.profile.webhookSecret}</code>{" "}
            {!secret && (
              <button type="button" className="ml-1 underline" onClick={rotate}>
                Tạo secret mới (hiện đầy đủ 1 lần)
              </button>
            )}
          </p>
        )}
        {msg && <p className="mt-2 text-sm">{msg}</p>}
        {deliveries.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-semibold">Lịch sử gửi ({deliveries.length})</summary>
            <ul className="mt-2 divide-y divide-ink/10">
              {deliveries.map((d) => (
                <li key={d.id} className="flex flex-wrap gap-2 py-1.5 text-xs">
                  <span className={d.ok ? "text-green-700" : "text-red-600"}>{d.ok ? "✓" : "✗"}</span>
                  <span className="font-mono">{d.event}</span>
                  <span>{d.orderCode}</span>
                  <span className="text-ink/60">
                    HTTP {d.status || "—"} · {d.attempts} lần · {formatDateTimeVN(d.createdAt)}
                  </span>
                  {d.error && <span className="text-red-600">{d.error}</span>}
                </li>
              ))}
            </ul>
          </details>
        )}
      </Box>

      <Box>
        <h2 className="font-extrabold">Tài liệu Open API</h2>
        <div className="mt-2 space-y-3 text-sm">
          <p>
            Base URL: <code>{base}</code> · Xác thực: header <code>Authorization: Bearer pk_live_…</code>. Dữ liệu JSON, tiền tệ VND (số nguyên).
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <code>GET /me</code> – thông tin seller, chiết khấu
            </li>
            <li>
              <code>GET /products</code> – phôi có thể dropship (biến thể, mặt in, giá)
            </li>
            <li>
              <code>GET /templates</code> – mẫu sản phẩm của bạn
            </li>
            <li>
              <code>POST /orders</code> – tạo đơn (gửi lại cùng <code>externalId</code> → trả đơn cũ, HTTP 200, không tạo trùng)
            </li>
            <li>
              <code>GET /orders?page=1</code> (lọc <code>externalId=…</code>) · <code>GET /orders/:code</code> · <code>POST /orders/:code/cancel</code> (chỉ khi chờ xác nhận)
            </li>
          </ul>
          <p className="font-semibold">Tạo đơn:</p>
          <Code>{`curl -X POST ${base}/orders \\
  -H "Authorization: Bearer pk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "externalId": "SHOPEE-240901ABC",
    "recipient": {
      "name": "Nguyễn Văn A", "phone": "0901234567",
      "province": "TP. Hồ Chí Minh", "ward": "Phường Bến Thành",
      "addressLine": "12 Lê Lợi"
    },
    "items": [{ "template": "AO-MEO-01", "color": "Trắng", "size": "L", "quantity": 2 }],
    "shippingMethod": "STANDARD",
    "codAmount": 0,
    "whiteLabel": true
  }'`}</Code>
          <p className="font-semibold">Xác thực webhook (Node.js):</p>
          <Code>{`import { createHmac, timingSafeEqual } from "node:crypto";
// rawBody: chuỗi body gốc (chưa parse JSON)
const sig = createHmac("sha256", process.env.POD_WEBHOOK_SECRET).update(rawBody).digest("hex");
const ok = timingSafeEqual(Buffer.from(sig), Buffer.from(req.headers["x-pod-signature"] ?? ""));
// Header kèm theo: X-POD-Event, X-POD-Delivery (id, dùng để chống xử lý trùng)`}</Code>
          <p className="text-ink/60">Endpoint trả HTTP 2xx trong 8 giây là thành công; lỗi mạng/5xx/429 được gửi lại tối đa 3 lần (sau 5s, 30s), lỗi 4xx không gửi lại. Tỉnh/thành dùng danh sách 34 tỉnh mới.</p>
        </div>
      </Box>
    </div>
  );
}

/* ================== Thương hiệu & hồ sơ ================== */
export function SellerSettings() {
  const { ov, reload } = useSeller();
  const p = ov.profile;
  const [f, setF] = useState({ companyName: p.companyName, taxCode: p.taxCode, storeUrl: p.storeUrl, brandName: p.brandName, labelImage: p.labelImage });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    if (file.size > 5_000_000) return setMsg({ ok: false, text: "Ảnh nhãn tối đa 5MB" });
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/uploads", { method: "POST", body: fd });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok || !j.url) throw new Error(j.error ?? "Tải ảnh thất bại");
      setF((x) => ({ ...x, labelImage: j.url! }));
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setUploading(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await api("/seller/settings", { method: "PUT", json: { ...f, webhookUrl: p.webhookUrl } });
      await reload();
      setMsg({ ok: true, text: "✓ Đã lưu" });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  }

  return (
    <Box className="max-w-3xl">
      <h1 className="text-xl font-black">Thương hiệu & hồ sơ</h1>
      <p className="text-sm text-ink/60">Đơn bật &quot;đóng gói thương hiệu của tôi&quot; sẽ dùng tên và nhãn này trên túi/phiếu gửi, không in tên xưởng.</p>
      <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Tên thương hiệu</span>
          <input className="input" value={f.brandName} onChange={(e) => setF({ ...f, brandName: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Link gian hàng</span>
          <input className="input" value={f.storeUrl} onChange={(e) => setF({ ...f, storeUrl: e.target.value })} placeholder="https://" />
        </label>
        <label className="block">
          <span className="label">Công ty</span>
          <input className="input" value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Mã số thuế</span>
          <input className="input" inputMode="numeric" value={f.taxCode} onChange={(e) => setF({ ...f, taxCode: e.target.value })} />
        </label>
        <div className="sm:col-span-2">
          <span className="label">Nhãn / logo đóng gói (PNG, JPG)</span>
          <div className="flex items-center gap-3">
            {f.labelImage ? <img src={assetUrl(f.labelImage)} alt="Nhãn" className="h-20 w-20 rounded border border-ink/10 bg-cream object-contain" /> : <div className="h-20 w-20 rounded border-2 border-dashed border-ink/20" />}
            <label className="btn-outline cursor-pointer px-4 py-2">
              {uploading ? "Đang tải…" : f.labelImage ? "Đổi ảnh" : "Tải ảnh"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            {f.labelImage && (
              <button type="button" className="text-sm text-red-600 underline" onClick={() => setF({ ...f, labelImage: "" })}>
                Bỏ
              </button>
            )}
          </div>
        </div>
        {msg && <p className={`text-sm sm:col-span-2 ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}
        <button className="btn-primary px-5 sm:justify-self-start">Lưu</button>
      </form>
    </Box>
  );
}
