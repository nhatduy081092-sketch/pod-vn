import "server-only";
import { redirect } from "next/navigation";
import { requireToken } from "./session";

const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Gọi API admin phía server – token nằm trong cookie httpOnly, không lộ ra trình duyệt */
export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await requireToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const res = await fetch(`${API_URL}/api/admin${path}`, { ...init, headers, cache: "no-store" });
  if (res.status === 401) redirect("/login?expired=1");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Lỗi API ${res.status}`, res.status);
  return data as T;
}

export async function publicLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? "Đăng nhập thất bại", res.status);
  return data as { token: string; user: { id: string; email: string; name: string } };
}
