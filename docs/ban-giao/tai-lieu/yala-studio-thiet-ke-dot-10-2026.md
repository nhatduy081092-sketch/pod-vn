# YALA Studio – đợt nâng cấp thiết kế (05/10/2026)

Commit: a5fe378 → c942143. Build GitHub Actions: success. Deploy: `cd /opt/yala && bash deploy/deploy.sh`. Migration `20261005120000_group_order` chỉ **thêm** bảng GroupOrder, GroupMember.

## Đã làm
| Hạng mục | Chi tiết |
|---|---|
| Sửa lỗi test | Chữ tự thu nhỏ / xuống dòng vừa vùng in; cảnh báo + nút đổi màu chữ khi trùng màu áo (kể cả lúc đổi màu áo); mẫu tự đổi màu chữ theo áo; hình bộ dựng sẵn (emoji, icon) lưu về YALA dạng PNG 2000px (trước đây link CDN → đặt hàng bị từ chối), đặt vào chỗ trống; tìm theo từ (hoa ≠ hoạt động); dịp lễ đang tới lên đầu; bảng đặt hàng ảnh lớn + Mua ngay |
| Khung ghép ảnh | 8 bố cục: Cặp đôi, Tim đôi, Polaroid, Polaroid đôi, Lưới 4, 1 lớn + 3 nhỏ, Dải phim, Ảnh tròn. Tự cắt ảnh vừa ô, thêm tên/ngày. Ảnh đang chọn → "Thay ảnh" giữ khung |
| Ảnh thành tranh vẽ | 5 kiểu chạy trên máy khách, miễn phí: Nét vẽ, Phác chì, Pop-art, Chấm in, Hoạt hình. Có "Ảnh gốc" để trả lại |
| Gom đơn nhóm | Studio → Hoàn tất → "Tạo link gom đơn nhóm" → `/nhom/<mã>`. Thành viên ghi tên, tên/số in, size, số lượng. Trưởng nhóm: chia sẻ, hạn chót, chốt, xoá dòng, "Đặt đơn cho cả nhóm" (danh sách vào đơn đồng phục). Ảnh chia sẻ Zalo = mẫu áo |
| Xem trên người mẫu | Nút "Người mẫu" trong Studio (mặt in đầu). Mặc định dùng ảnh lookbook áo thun trắng, hoodie đen/kem. CMS → Ảnh thật → Người mẫu: tải ảnh, kéo khung vùng in, chép lệnh ChatGPT |
| Cốc/bình | "In 2 bên" (2 mặt cầm tay trái/phải); "Xem" có 3 góc xoay |

## Còn chờ
- Ảnh phôi thật: tạo bằng ChatGPT, tải lên CMS → Ảnh thật → Phôi trơn (ưu tiên 6 ô màu Trắng).
- Ảnh người mẫu cho sweater, áo dài tay, túi tote, áo thun đen.
- AI "ảnh thành hoạt hình" bản trả phí: chỉ làm khi có OPENAI_API_KEY.
