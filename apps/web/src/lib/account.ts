"use client";
import { useCallback, useEffect, useState } from "react";
import type { Address } from "@pod/shared";

export type Me = {
  id: string;
  phone: string;
  name: string;
  email: string;
  addresses: Address[];
  createdAt: string;
  seller: { status: string; discountPercent: number; companyName: string; brandName: string } | null;
};

/** Gọi API cùng origin (cookie phiên httpOnly tự gửi kèm) */
export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(`/api${path}`, {
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...(rest.headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    const err = new Error(data.error ?? "Có lỗi xảy ra, vui lòng thử lại") as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

/** Thông tin khách đang đăng nhập (null = chưa đăng nhập) */
export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    try {
      setMe(await api<Me>("/account/me"));
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
    const on = () => void reload();
    window.addEventListener("pod:auth", on);
    return () => window.removeEventListener("pod:auth", on);
  }, [reload]);
  return { me, loading, reload, setMe };
}

export function notifyAuthChanged() {
  window.dispatchEvent(new Event("pod:auth"));
}

/** Chỉ cho phép quay lại đường dẫn nội bộ (chặn open redirect) */
export function safeNext(next: string | null | undefined, fallback = "/tai-khoan"): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
