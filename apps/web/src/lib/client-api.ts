"use client";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // gọi cùng domain; next.config rewrites chuyển tiếp /api/* sang API server
  const res = await fetch(`/api${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? "Có lỗi xảy ra, vui lòng thử lại", res.status);
  return data as T;
}

export async function uploadDesign(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  return apiFetch<{ url: string }>("/uploads", { method: "POST", body: fd });
}
