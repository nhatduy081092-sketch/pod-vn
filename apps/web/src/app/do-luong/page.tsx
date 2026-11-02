import type { Metadata } from "next";
import Link from "next/link";
import { OptOutToggle } from "@/components/layout/OptOutToggle";

export const metadata: Metadata = { title: "Đo lường & quyền chọn của bạn", robots: { index: false, follow: true } };

/**
 * Thông báo đo lường – mỗi câu phải khớp điều code đang làm (apps/web/src/lib/track.ts, Analytics.tsx,
 * apps/api/src/lib/attribution.ts, apps/api/src/scripts/prune-sources.ts). Đổi code thì sửa trang này.
 */
export default function MeasurementPage() {
  return (
    <div className="container-site max-w-3xl py-6 md:py-12">
      <nav className="text-sm text-ink/60" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Trang chủ
        </Link>{" "}
        / <span className="text-ink">Đo lường</span>
      </nav>
      <h1 className="mb-6 mt-2 font-display text-[clamp(26px,3.2vw,38px)] font-extrabold leading-[1.15] tracking-[-0.02em] [font-stretch:88%]">Đo lường &amp; quyền chọn của bạn</h1>

      <div className="space-y-6 text-base leading-relaxed text-ink">
        <section>
          <h2 className="mb-2 text-lg font-extrabold">YALA đo những gì</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Lượt xem trang và các bước mua hàng: xem sản phẩm, thêm vào giỏ, vào thanh toán, đặt hàng, tạo và tham gia đơn nhóm, nạp danh sách in tên (chỉ đếm số dòng), gửi yêu cầu báo giá, bấm liên hệ Zalo/điện thoại.</li>
            <li>Từ khoá bạn gõ vào ô tìm kiếm của YALA.</li>
            <li>Khi đặt hàng: mã đơn, giá trị đơn, mã và số lượng sản phẩm.</li>
            <li>
              <b>Không gửi</b> tên, số điện thoại, email, địa chỉ hay nội dung thiết kế của bạn vào công cụ đo lường.
            </li>
          </ul>
          <p className="mt-2">
            Công cụ: Google Tag Manager và các thẻ YALA cấu hình trong đó (Google Analytics; công cụ đo quảng cáo của Google, Facebook, TikTok khi YALA chạy quảng cáo trên các kênh này).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold">Nguồn bạn đến từ đâu</h2>
          <p>
            Khi bạn vào YALA từ quảng cáo, đường link có mã chiến dịch hoặc từ một trang khác, trình duyệt của bạn ghi lại nguồn đó: mã chiến dịch, mã click quảng cáo, trang YALA bạn vào đầu tiên và <b>chỉ tên miền</b> của trang dẫn tới (ví dụ google.com, không lưu từ khoá hay đường dẫn của trang đó).
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Lưu trên trình duyệt của bạn tối đa 90 ngày.</li>
            <li>Gửi kèm khi bạn đặt hàng hoặc gửi yêu cầu báo giá, để YALA biết kênh nào đưa khách tới.</li>
            <li>Chi tiết này được xoá khỏi đơn sau 90 ngày; YALA chỉ giữ nhóm nguồn (ví dụ &quot;Google&quot;, &quot;Zalo&quot;) và tên miền dẫn tới.</li>
          </ul>
        </section>

        <section className="rounded-xl border-2 border-ink/10 bg-white p-4 md:p-5">
          <h2 className="mb-2 text-lg font-extrabold">Tắt đo lường trên trình duyệt này</h2>
          <p className="mb-3">
            Khi tắt: YALA không nạp công cụ đo lường, không gửi sự kiện nào và xoá nguồn đã lưu trên trình duyệt này. Mua hàng, giỏ hàng và đặt đơn vẫn hoạt động bình thường. Lựa chọn chỉ áp dụng cho trình duyệt và thiết bị bạn đang dùng.
          </p>
          <OptOutToggle />
        </section>

        <p className="text-sm text-ink/60">
          Câu hỏi về dữ liệu của bạn: liên hệ YALA qua <Link href="/ho-tro" className="underline hover:text-ink">trang hỗ trợ</Link>.
        </p>
      </div>
    </div>
  );
}
