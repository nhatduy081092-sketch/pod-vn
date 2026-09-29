/** Health check cho Docker/Nginx: chỉ báo tiến trình web đang chạy, không gọi API/DB, không lộ thông tin. */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, service: "web", time: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
