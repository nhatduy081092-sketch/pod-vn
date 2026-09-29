"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importOemAction } from "@/lib/actions";

/** Đồng bộ toàn bộ sản phẩm từ oemgroup.vn (chạy lại bao nhiêu lần cũng được) */
export function ImportOemButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [armed, setArmed] = useState(false);
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        className="btn-ghost"
        disabled={pending}
        onClick={() => {
          if (!armed) {
            setArmed(true);
            setMsg({ ok: true, text: "Mất khoảng 1–2 phút; giá/nhãn đã chỉnh trong CMS được giữ nguyên. Bấm lần nữa để bắt đầu." });
            return;
          }
          setArmed(false);
          setMsg(null);
          start(async () => {
            const r = await importOemAction();
            if (!r.ok) return setMsg({ ok: false, text: r.error });
            const x = r.report;
            setMsg({
              ok: true,
              text: `✓ ${x.total} sản phẩm: thêm ${x.created}, cập nhật ${x.updated}, bỏ qua ${x.skipped}${x.errors.length ? `, lỗi ${x.errors.length}` : ""} · ${x.categories} danh mục · ${Math.round(x.ms / 1000)}s`,
            });
            router.refresh();
          });
        }}
      >
        {pending ? "Đang đồng bộ từ oemgroup.vn..." : armed ? "Xác nhận đồng bộ" : "⟳ Đồng bộ từ oemgroup.vn"}
      </button>
      {msg && <p className={`max-w-md text-right text-xs ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  );
}
