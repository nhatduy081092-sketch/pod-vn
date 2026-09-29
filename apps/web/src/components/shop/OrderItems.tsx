import { formatVND } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import type { OrderView } from "@/lib/types";

/** Danh sách hàng trong đơn: phân loại, đồng phục nhóm, ảnh xem trước thiết kế từng mặt */
export function OrderItems({ items }: { items: OrderView["items"] }) {
  return (
    <ul className="mt-4 divide-y divide-ink/10">
      {items.map((it, idx) => (
        <li key={idx} className="flex gap-3 py-2">
          <img src={assetUrl(it.productImg)} alt="" className="h-14 w-14 shrink-0 rounded border border-ink/15 object-contain" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold">{it.productName}</p>
            <p className="text-xs text-ink/60">
              {it.roster?.length ? `Đồng phục ${it.roster.length} áo` : [it.color && it.color !== "Theo thiết kế" ? it.color : "", `Size ${it.size}`].filter(Boolean).join(" · ")} ×{" "}
              {it.quantity} · {formatVND(it.unitPrice)}/cái
            </p>
            {it.design?.files?.length ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {it.design.files.map((f) => (
                  <a key={f.area} href={assetUrl(f.previewUrl)} target="_blank" rel="noreferrer" title={f.name}>
                    <img src={assetUrl(f.previewUrl)} alt={`Thiết kế ${f.name}`} className="h-10 w-10 rounded border border-ink/15 object-contain" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <p className="text-sm font-bold">{formatVND(it.lineTotal)}</p>
        </li>
      ))}
    </ul>
  );
}
