import type { Metadata } from "next";
import type { GroupView } from "@pod/shared";
import { API_URL, absoluteAssetUrl } from "@/lib/config";
import { GroupOrderView } from "@/components/group/GroupOrderView";

type Props = { params: Promise<{ code: string }> };

/** Ảnh xem trước thiết kế làm ảnh chia sẻ Zalo/Messenger (link gửi nhóm hiện đúng mẫu áo) */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  let g: GroupView | null = null;
  try {
    const res = await fetch(`${API_URL}/api/groups/${encodeURIComponent(code)}`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (res.ok) g = (await res.json()) as GroupView;
  } catch {
    /* API chậm: dùng tiêu đề mặc định */
  }
  const title = g ? `${g.title || "Đặt áo nhóm"} – ${g.product.name}` : "Đặt áo nhóm";
  const description = "Mở link, ghi tên và chọn size của bạn – trưởng nhóm đặt chung 1 đơn trên YALA.";
  const img = g?.previews[0]?.url ? absoluteAssetUrl(g.previews[0].url) : undefined;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, ...(img ? { images: [{ url: img, width: 1080, height: 1080 }] } : {}) },
  };
}

export default async function GroupPage({ params }: Props) {
  const { code } = await params;
  return (
    <div className="container-site py-5 md:py-10">
      <GroupOrderView code={code} />
    </div>
  );
}
