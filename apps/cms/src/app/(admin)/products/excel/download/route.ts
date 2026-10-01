import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "@/lib/session";

const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

/** Tải file Excel bảng giá (chuyển tiếp từ API, token admin nằm trong cookie) */
export async function GET(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  const qs = new URLSearchParams();
  for (const k of ["categoryId", "nguon", "q"]) {
    const v = req.nextUrl.searchParams.get(k);
    if (v) qs.set(k, v);
  }
  const res = await fetch(`${API_URL}/api/admin/prices/export?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (res.status === 401) return NextResponse.redirect(new URL("/login?expired=1", req.url));
  if (!res.ok) return new NextResponse(`Không tạo được file: HTTP ${res.status}`, { status: 502 });
  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": res.headers.get("Content-Disposition") ?? 'attachment; filename="yala-bang-gia.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
