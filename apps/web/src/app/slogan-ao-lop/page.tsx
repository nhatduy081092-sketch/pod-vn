import type { Metadata } from "next";
import { CLASS_SLOGANS } from "@pod/shared";
import { PhrasePage } from "@/components/seo/PhrasePage";

export const revalidate = 86400;
const total = CLASS_SLOGANS.reduce((n, g) => n + g.items.length, 0);
const title = `${total} slogan áo lớp hay, ý nghĩa – áo kỷ yếu, họp lớp`;
const description = "Slogan áo lớp, áo kỷ yếu, áo họp lớp, câu tri ân thầy cô ngắn gọn, ý nghĩa. Bấm “Dùng câu này” để đưa câu chữ lên áo và thiết kế áo lớp online miễn phí.";
export const metadata: Metadata = { title: { absolute: `${title} | YALA` }, description, alternates: { canonical: "/slogan-ao-lop" }, openGraph: { title, description } };

export default function Page() {
  return (
    <PhrasePage
      path="/slogan-ao-lop"
      title="Slogan áo lớp hay"
      intro="Câu khẩu hiệu ngắn cho áo lớp cấp 3, áo kỷ yếu, áo họp lớp, áo sinh viên và lời tri ân thầy cô – do YALA biên soạn. Bấm “Dùng câu này” để mở ngay trên áo, sửa chữ, thêm tên lớp và tên từng bạn."
      groups={CLASS_SLOGANS}
      hub={{ href: "/mau-ao-lop", label: "Xem mẫu áo lớp có ô tên từng bạn" }}
      faq={[
        { q: "Slogan áo lớp nên dài bao nhiêu?", a: "Ngắn là dễ đọc: khoảng 3–6 chữ ở mặt trước. Câu dài hơn nên chia 2 dòng hoặc chuyển ra mặt sau." },
        { q: "Có được dùng slogan này miễn phí không?", a: "Được. Các câu trên trang do YALA biên soạn, bạn dùng thoải mái cho áo lớp của mình và sửa lại theo ý lớp." },
        { q: "In thêm tên từng bạn có được không?", a: "Được. Trong YALA Studio thêm ô tên – mỗi áo in đúng tên một bạn, không tính thêm phí, đặt chung một đơn." },
        { q: "Làm sao cả lớp chọn size?", a: "Thiết kế xong bấm Hoàn tất → “Tạo link gom đơn nhóm”, gửi vào nhóm lớp – mỗi bạn tự ghi tên và size, lớp trưởng chốt một đơn." },
      ]}
    />
  );
}
