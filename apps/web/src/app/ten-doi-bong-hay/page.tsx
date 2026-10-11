import type { Metadata } from "next";
import { TEAM_NAMES } from "@pod/shared";
import { PhrasePage } from "@/components/seo/PhrasePage";

export const revalidate = 86400;
const total = TEAM_NAMES.reduce((n, g) => n + g.items.length, 0);
const title = `${total} tên đội bóng hay, tên CLB chạy bộ, cầu lông, đội công ty`;
const description = "Gợi ý tên đội bóng phong trào, tên CLB chạy bộ, cầu lông, pickleball, tên đội team building hay và dễ nhớ. Bấm “Dùng câu này” để in tên đội lên áo, thêm số và tên từng thành viên.";
export const metadata: Metadata = { title: { absolute: `${title} | YALA` }, description, alternates: { canonical: "/ten-doi-bong-hay" }, openGraph: { title, description } };

export default function Page() {
  return (
    <PhrasePage
      path="/ten-doi-bong-hay"
      title="Tên đội bóng, CLB hay"
      intro="Tên đội bóng phong trào, CLB chạy bộ, cầu lông – pickleball và đội công ty do YALA gợi ý. Bấm “Dùng câu này” để đưa tên đội lên áo, rồi thêm số áo và tên từng thành viên."
      groups={TEAM_NAMES}
      hub={{ href: "/mau-ao-doi-bong", label: "Xem mẫu áo đội có số & tên từng người" }}
      faq={[
        { q: "Đặt tên đội bóng thế nào cho dễ nhớ?", a: "Ngắn (2–3 chữ), đọc to lên nghe rõ, gắn với điều chung của đội: nơi đá, giờ đá, công ty, quê quán. Tránh dùng tên hoặc logo của CLB chuyên nghiệp có thương hiệu." },
        { q: "Có in số và tên từng cầu thủ được không?", a: "Được. Mẫu áo đội có ô số và ô tên – mỗi áo in riêng cho từng người, không tính thêm phí." },
        { q: "Áo in trên web có phải áo thi đấu không?", a: "Dòng YALA Everyday là áo cotton – hợp áo tập nhẹ, áo CLB, áo cổ động viên. Áo thi đấu vải thun lạnh/mè: gửi yêu cầu báo giá ở trang CLB thể thao." },
        { q: "Cả đội chọn size thế nào?", a: "Bấm Hoàn tất → “Tạo link gom đơn nhóm”, gửi vào nhóm chat của đội – mỗi người tự ghi tên, số, size; đội trưởng chốt một đơn." },
      ]}
    />
  );
}
