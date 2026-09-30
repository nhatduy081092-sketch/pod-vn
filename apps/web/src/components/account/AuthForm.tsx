"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { customerLoginSchema, customerRegisterSchema } from "@pod/shared";
import { api, notifyAuthChanged, safeNext } from "@/lib/account";

/** Đăng nhập / đăng ký bằng số điện thoại + mật khẩu */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get("next"));
  const [f, setF] = useState({ name: "", phone: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = mode === "login" ? customerLoginSchema.safeParse(f) : customerRegisterSchema.safeParse(f);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Vui lòng kiểm tra thông tin");
    setBusy(true);
    try {
      await api(mode === "login" ? "/account/login" : "/account/register", { method: "POST", json: parsed.data });
      notifyAuthChanged();
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const other = mode === "login" ? `/dang-ky${next !== "/tai-khoan" ? `?next=${encodeURIComponent(next)}` : ""}` : `/dang-nhap${next !== "/tai-khoan" ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <form onSubmit={submit} noValidate className="mx-auto w-full max-w-sm space-y-3 rounded-xl border border-line bg-white p-5 shadow-hard">
      <h1 className="text-2xl font-black">{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h1>
      <p className="text-sm text-ink/70">{mode === "login" ? "Xem đơn hàng, thiết kế đã lưu và đặt lại nhanh." : "Lưu thiết kế, xem lại đơn, đặt lại chỉ với 1 lần bấm."}</p>
      {mode === "register" && (
        <label className="block">
          <span className="label">Họ và tên</span>
          <input className="input" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} />
        </label>
      )}
      <label className="block">
        <span className="label">Số điện thoại</span>
        <input className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxx" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
      </label>
      {mode === "register" && (
        <label className="block">
          <span className="label">Email (không bắt buộc)</span>
          <input className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
        </label>
      )}
      <label className="block">
        <span className="label">Mật khẩu{mode === "register" ? " (tối thiểu 8 ký tự)" : ""}</span>
        <span className="relative block">
          <input
            className="input pr-16"
            type={showPw ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={f.password}
            onChange={(e) => set("password", e.target.value)}
          />
          <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-ink/60">
            {showPw ? "Ẩn" : "Hiện"}
          </button>
        </span>
      </label>
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full py-3">
        {busy ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
      </button>
      <p className="text-center text-sm">
        {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
        <Link href={other} className="font-bold underline">
          {mode === "login" ? "Đăng ký" : "Đăng nhập"}
        </Link>
      </p>
      {mode === "login" && <p className="text-center text-xs text-ink/60">Quên mật khẩu? Nhắn Zalo/hotline ở cuối trang để được cấp lại.</p>}
    </form>
  );
}
