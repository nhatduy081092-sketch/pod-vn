"use client";
import { formatVND, PROVINCES, shippingOptions, ZONE_LABEL, type ShippingConfig, type ShippingZone } from "@pod/shared";

const ZONES: ShippingZone[] = ["NOI_TINH", "NOI_VUNG", "LIEN_VUNG"];
const n = (v: string) => Math.max(0, Math.round(Number(v.replace(/\D/g, "")) || 0));

/** Cấu hình phí ship: đồng giá hoặc theo vùng (nội tỉnh / cùng miền / khác miền) × cân nặng; giao nhanh tuỳ chọn */
export function ShippingSettings({ value, onChange }: { value: ShippingConfig; onChange: (v: ShippingConfig) => void }) {
  const set = (p: Partial<ShippingConfig>) => onChange({ ...value, ...p });
  const setRate = (z: ShippingZone, p: Partial<ShippingConfig["rates"][ShippingZone]>) => set({ rates: { ...value.rates, [z]: { ...value.rates[z], ...p } } });
  const sample = (province: string, w: number) => shippingOptions(value, { province, weightGram: w, subtotal: 0 })[0]!.baseFee;

  return (
    <section className="card space-y-3">
      <h2 className="font-bold">Vận chuyển</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block">
          <span className="label">Cách tính phí</span>
          <select className="input" value={value.mode} onChange={(e) => set({ mode: e.target.value === "weight" ? "weight" : "flat" })}>
            <option value="flat">Đồng giá mọi đơn</option>
            <option value="weight">Theo vùng × cân nặng</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Miễn phí giao tiêu chuẩn từ (₫, 0 = tắt)</span>
          <input className="input" inputMode="numeric" value={value.freeThreshold} onChange={(e) => set({ freeThreshold: n(e.target.value) })} />
        </label>
        <label className="block">
          <span className="label">Thời gian sản xuất mặc định</span>
          <input className="input" value={value.productionDays} onChange={(e) => set({ productionDays: e.target.value })} />
        </label>
      </div>

      {value.mode === "flat" ? (
        <label className="block max-w-xs">
          <span className="label">Phí ship đồng giá (₫)</span>
          <input className="input" inputMode="numeric" value={value.flatFee} onChange={(e) => set({ flatFee: n(e.target.value) })} />
        </label>
      ) : (
        <div className="space-y-3 rounded-lg bg-neutral-50 p-3">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block">
              <span className="label">Xưởng gửi hàng tại</span>
              <select className="input" value={value.origin} onChange={(e) => set({ origin: e.target.value as ShippingConfig["origin"] })}>
                {PROVINCES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Giá đầu áp dụng cho (gram)</span>
              <input className="input" inputMode="numeric" value={value.firstGram} onChange={(e) => set({ firstGram: Math.max(1, n(e.target.value)) })} />
            </label>
            <label className="block">
              <span className="label">Mỗi bước thêm (gram)</span>
              <input className="input" inputMode="numeric" value={value.stepGram} onChange={(e) => set({ stepGram: Math.max(1, n(e.target.value)) })} />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="table min-w-[520px] text-sm">
              <thead>
                <tr>
                  <th>Vùng</th>
                  <th>Giá {value.firstGram}g đầu (₫)</th>
                  <th>+ mỗi {value.stepGram}g (₫)</th>
                  <th>Thời gian giao</th>
                </tr>
              </thead>
              <tbody>
                {ZONES.map((z) => (
                  <tr key={z}>
                    <td className="font-semibold">{ZONE_LABEL[z]}</td>
                    <td>
                      <input className="input h-8 w-28 px-2" inputMode="numeric" value={value.rates[z].first} onChange={(e) => setRate(z, { first: n(e.target.value) })} />
                    </td>
                    <td>
                      <input className="input h-8 w-24 px-2" inputMode="numeric" value={value.rates[z].step} onChange={(e) => setRate(z, { step: n(e.target.value) })} />
                    </td>
                    <td>
                      <input className="input h-8 w-28 px-2" value={value.rates[z].days} onChange={(e) => setRate(z, { days: e.target.value })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-600">
            Ví dụ 1,2kg: nội tỉnh {formatVND(sample(value.origin, 1200))} · Hà Nội {formatVND(sample("Hà Nội", 1200))} · Cần Thơ {formatVND(sample("Cần Thơ", 1200))}. Giá mẫu ban đầu chỉ để tham khảo – nhập theo hợp đồng
            với đơn vị vận chuyển.
          </p>
        </div>
      )}

      <div className="grid gap-3 rounded-lg border p-3 md:grid-cols-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={value.express.enabled} onChange={(e) => set({ express: { ...value.express, enabled: e.target.checked } })} className="h-4 w-4 accent-[#F08A00]" />
          Cho chọn giao nhanh
        </label>
        <label className="block">
          <span className="label">Phụ thu giao nhanh (₫)</span>
          <input className="input" inputMode="numeric" value={value.express.surcharge} onChange={(e) => set({ express: { ...value.express, surcharge: n(e.target.value) } })} />
        </label>
        <label className="block">
          <span className="label">Thời gian giao nhanh</span>
          <input className="input" value={value.express.days} onChange={(e) => set({ express: { ...value.express, days: e.target.value } })} />
        </label>
      </div>
    </section>
  );
}
