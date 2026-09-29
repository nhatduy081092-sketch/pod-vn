"use client";
import { useEffect, useState } from "react";
import type { DesignJson } from "@pod/shared";
import type { ProductDetail } from "@/lib/types";
import { DesignEditor } from "./DesignEditor";
import { readAttached } from "./storage";

type Props = { product: ProductDetail; mode: "customer" | "seller"; savedId: string | null; templateId: string | null; initialColor?: string | null; returnTo: string };

/** Nạp thiết kế ban đầu: thiết kế đã lưu (tài khoản) / mẫu seller / thiết kế đang gắn ở trang sản phẩm */
export function EditorLoader({ product, mode, savedId, templateId, initialColor, returnTo }: Props) {
  const [state, setState] = useState<{ ready: boolean; initial: DesignJson | null; name?: string; error?: string }>({ ready: false, initial: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (savedId) {
          const r = await fetch(`/api/account/designs/${encodeURIComponent(savedId)}`);
          if (r.status === 401) throw new Error("Đăng nhập để mở thiết kế đã lưu");
          if (!r.ok) throw new Error("Không mở được thiết kế đã lưu");
          const d = (await r.json()) as { json: DesignJson; name: string };
          if (alive) setState({ ready: true, initial: d.json, name: d.name });
          return;
        }
        if (templateId && mode === "seller") {
          const r = await fetch(`/api/seller/templates/${encodeURIComponent(templateId)}`);
          if (!r.ok) throw new Error("Không mở được mẫu");
          const t = (await r.json()) as { design: { json: DesignJson }; title: string };
          if (alive) setState({ ready: true, initial: t.design.json, name: t.title });
          return;
        }
        // sửa lại thiết kế đang gắn ở trang sản phẩm
        const att = mode === "customer" ? readAttached(product.id) : null;
        if (alive) setState({ ready: true, initial: att?.json ?? null });
      } catch (e) {
        if (alive) setState({ ready: true, initial: null, error: (e as Error).message });
      }
    })();
    return () => {
      alive = false;
    };
  }, [product.id, savedId, templateId, mode]);

  return (
    // phủ toàn màn hình, che header/footer của website để có chỗ thiết kế
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#fafafa]">
      {!state.ready ? (
        <div className="flex h-full items-center justify-center gap-3 text-sm font-semibold">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink border-t-transparent" /> Đang mở công cụ thiết kế…
        </div>
      ) : (
        <>
          {state.error && <p className="mx-auto mt-3 max-w-xl rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">{state.error} – đang mở thiết kế mới.</p>}
          <DesignEditor product={product} mode={mode} initial={state.initial} savedId={state.error ? null : savedId} savedName={state.name} templateId={templateId} initialColor={initialColor ?? readAttached(product.id)?.color} returnTo={returnTo} />
        </>
      )}
    </div>
  );
}
