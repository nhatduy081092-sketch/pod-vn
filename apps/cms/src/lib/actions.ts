"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type {
  CategoryUpsertInput,
  HelpArticleInput,
  NoticeInput,
  LandingSettings,
  PageUpsertInput,
  PrintAreaInput,
  ProductPriceBulkInput,
  ProductUpsertInput,
  VariantInput,
  TestimonialUpsertInput,
} from "@pod/shared";
import { adminFetch, publicLogin } from "./api";
import { COOKIE } from "./session";
import type { ActionResult } from "./types";

/** Báo web xoá cache để nội dung mới hiện ngay (bỏ qua nếu chưa cấu hình) */
async function revalidateWeb() {
  const secret = process.env.REVALIDATE_SECRET;
  const web = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  if (!secret) return;
  try {
    await fetch(`${web}/revalidate`, { method: "POST", headers: { "x-revalidate-secret": secret }, cache: "no-store" });
  } catch {
    /* web tắt -> bỏ qua, ISR 60s vẫn cập nhật */
  }
}

async function run(fn: () => Promise<{ id?: string } | void>, paths: string[] = [], web = true): Promise<ActionResult> {
  try {
    const r = await fn();
    for (const p of paths) revalidatePath(p);
    if (web) await revalidateWeb();
    return { ok: true, id: r && "id" in r ? r.id : undefined };
  } catch (e) {
    // redirect() của Next ném lỗi đặc biệt – phải ném lại
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: (e as Error).message };
  }
}

/* ---------- Auth ---------- */
export async function loginAction(_: unknown, fd: FormData): Promise<{ error: string } | undefined> {
  try {
    const { token } = await publicLogin(String(fd.get("email") ?? ""), String(fd.get("password") ?? ""));
    (await cookies()).set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect("/");
}

export async function logoutAction() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}

/* ---------- Upload ---------- */
export async function uploadImageAction(fd: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const file = fd.get("file");
    if (!(file instanceof File)) return { ok: false, error: "Thiếu file" };
    const body = new FormData();
    body.append("file", file);
    const r = await adminFetch<{ url: string }>("/uploads", { method: "POST", body });
    return { ok: true, url: r.url };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ---------- Products ---------- */
export async function saveProductAction(id: string | null, data: ProductUpsertInput) {
  return run(async () => {
    const p = await adminFetch<{ id: string }>(id ? `/products/${id}` : "/products", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(data),
    });
    return { id: p.id };
  }, ["/products"]);
}

export async function savePricesAction(data: ProductPriceBulkInput) {
  return run(() => adminFetch("/products/prices", { method: "PATCH", body: JSON.stringify(data) }).then(() => undefined), ["/products", "/products/prices"]);
}

export async function saveVariantsAction(id: string, variants: VariantInput[]) {
  return run(() => adminFetch(`/products/${id}/variants`, { method: "PUT", body: JSON.stringify({ variants }) }).then(() => undefined), [`/products/${id}`]);
}

export async function savePrintAreasAction(id: string, areas: PrintAreaInput[]) {
  return run(() => adminFetch(`/products/${id}/print-areas`, { method: "PUT", body: JSON.stringify({ areas }) }).then(() => undefined), [`/products/${id}`]);
}

export async function deleteProductAction(id: string) {
  return run(() => adminFetch(`/products/${id}`, { method: "DELETE" }).then(() => undefined), ["/products"]);
}

/* ---------- Categories ---------- */
export async function saveCategoryAction(id: string | null, data: CategoryUpsertInput) {
  return run(async () => {
    const c = await adminFetch<{ id: string }>(id ? `/categories/${id}` : "/categories", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(data),
    });
    return { id: c.id };
  }, ["/categories"]);
}

export async function deleteCategoryAction(id: string) {
  return run(() => adminFetch(`/categories/${id}`, { method: "DELETE" }).then(() => undefined), ["/categories"]);
}

/* ---------- Orders ---------- */
export async function updateOrderAction(id: string, data: { status?: string; paymentStatus?: string; adminNote?: string; trackingCode?: string }) {
  return run(() => adminFetch(`/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then(() => undefined), [`/orders/${id}`, "/orders", "/"], false);
}

/* ---------- Settings ---------- */
export async function saveLandingAction(data: LandingSettings) {
  return run(() => adminFetch("/settings/landing", { method: "PUT", body: JSON.stringify(data) }).then(() => undefined), ["/settings"]);
}

/* ---------- Testimonials ---------- */
export async function saveTestimonialAction(id: string | null, data: TestimonialUpsertInput) {
  return run(async () => {
    const t = await adminFetch<{ id: string }>(id ? `/testimonials/${id}` : "/testimonials", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(data),
    });
    return { id: t.id };
  }, ["/testimonials"]);
}

export async function deleteTestimonialAction(id: string) {
  return run(() => adminFetch(`/testimonials/${id}`, { method: "DELETE" }).then(() => undefined), ["/testimonials"]);
}

/* ---------- Trang nội dung ---------- */
export async function savePageAction(slug: string, data: PageUpsertInput) {
  return run(() => adminFetch(`/pages/${encodeURIComponent(slug)}`, { method: "PUT", body: JSON.stringify(data) }).then(() => undefined), ["/pages"]);
}

export async function deletePageAction(slug: string) {
  return run(() => adminFetch(`/pages/${encodeURIComponent(slug)}`, { method: "DELETE" }).then(() => undefined), ["/pages"]);
}

/* ---------- Đồng bộ sản phẩm OEM ---------- */
type ImportReport = { categories: number; created: number; updated: number; skipped: number; total: number; errors: string[]; ms: number };
export async function importOemAction(): Promise<{ ok: true; report: ImportReport } | { ok: false; error: string }> {
  try {
    const report = await adminFetch<ImportReport>("/import/oem", { method: "POST" });
    revalidatePath("/products");
    await revalidateWeb();
    return { ok: true, report };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: (e as Error).message };
  }
}

/* ---------- Thông báo ---------- */
export async function saveNoticeAction(id: string | null, data: NoticeInput) {
  return run(async () => {
    const r = await adminFetch<{ id: string }>(id ? `/notices/${id}` : "/notices", { method: id ? "PUT" : "POST", body: JSON.stringify(data) });
    return { id: r.id };
  }, ["/notices"]);
}
export async function deleteNoticeAction(id: string) {
  return run(() => adminFetch(`/notices/${id}`, { method: "DELETE" }).then(() => undefined), ["/notices"]);
}

/* ---------- Help Center ---------- */
export async function saveHelpAction(id: string | null, data: HelpArticleInput) {
  return run(async () => {
    const r = await adminFetch<{ id: string }>(id ? `/help/${id}` : "/help", { method: id ? "PUT" : "POST", body: JSON.stringify(data) });
    return { id: r.id };
  }, ["/help"]);
}
export async function deleteHelpAction(id: string) {
  return run(() => adminFetch(`/help/${id}`, { method: "DELETE" }).then(() => undefined), ["/help"]);
}

/* ---------- Lead ---------- */
export async function updateLeadAction(id: string, data: { status: string; adminNote: string }) {
  return run(() => adminFetch(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then(() => undefined), ["/leads", "/"], false);
}

/* ---------- Khách hàng ---------- */
export async function setCustomerActiveAction(id: string, isActive: boolean) {
  return run(() => adminFetch(`/customers/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) }).then(() => undefined), ["/customers"], false);
}
export async function resetCustomerPasswordAction(id: string): Promise<{ ok: true; tempPassword: string } | { ok: false; error: string }> {
  try {
    const r = await adminFetch<{ tempPassword: string }>(`/customers/${id}/reset-password`, { method: "POST" });
    return { ok: true, tempPassword: r.tempPassword };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ---------- Seller & thanh toán gộp ---------- */
export async function updateSellerAction(customerId: string, data: { status: string; discountPercent: number; adminNote: string }) {
  return run(() => adminFetch(`/sellers/${customerId}`, { method: "PUT", body: JSON.stringify(data) }).then(() => undefined), ["/sellers", "/"], false);
}
export async function markBatchPaidAction(id: string) {
  return run(() => adminFetch(`/batches/${id}/paid`, { method: "POST" }).then(() => undefined), ["/batches", "/orders", "/"], false);
}
export async function cancelBatchAction(id: string) {
  return run(() => adminFetch(`/batches/${id}/cancel`, { method: "POST" }).then(() => undefined), ["/batches"], false);
}
