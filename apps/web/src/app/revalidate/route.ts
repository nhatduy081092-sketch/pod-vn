import { revalidatePath } from "next/cache";

/**
 * CMS gọi sau khi lưu nội dung -> web cập nhật ngay, không chờ ISR 60s.
 * POST /revalidate  header: x-revalidate-secret: <REVALIDATE_SECRET>
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidatePath("/", "layout");
  return Response.json({ ok: true, at: new Date().toISOString() });
}
