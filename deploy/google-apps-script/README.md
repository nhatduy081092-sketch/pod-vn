# Nhận yêu cầu báo giá vào Google Sheets + Email

Mỗi yêu cầu báo giá / liên hệ doanh nghiệp trên website sẽ:
- ghi 1 dòng vào sheet **Báo giá** (cột Trạng thái để sales cập nhật),
- gửi email cho sales (có nút Nhắn Zalo khách, link mở trong CMS),
- vẫn lưu trong CMS (Đơn hàng → nhãn BÁO GIÁ) và báo Telegram như cũ.

## Cài đặt
1. Tạo Google Sheet mới (VD "YALA – Báo giá") bằng tài khoản Google của công ty.
2. **Tiện ích mở rộng → Apps Script** → xoá nội dung có sẵn, dán toàn bộ `yala-quotes.gs` → Lưu.
3. **Cài đặt dự án (⚙) → Thuộc tính tập lệnh** → thêm:
   - `SECRET` = một chuỗi ngẫu nhiên dài (VD tạo bằng `openssl rand -hex 24`)
   - `NOTIFY_EMAILS` = email sales, nhiều email cách nhau dấu phẩy
4. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**:
   - Thực thi dưới dạng: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai**
   - Bấm Triển khai, cấp quyền (Sheets + gửi email), copy **URL ứng dụng web** (đuôi `/exec`).
5. Trên VPS, thêm vào `/opt/yala/.env.production`:
   ```
   QUOTE_WEBHOOK_URL="https://script.google.com/macros/s/…/exec"
   QUOTE_WEBHOOK_SECRET="<chuỗi SECRET ở bước 3>"
   CMS_URL="https://admin.yala.vn"
   ```
   rồi chạy `cd /opt/yala && bash deploy/deploy.sh` (hoặc `docker compose … up -d api` để nạp lại biến).
6. CMS → Cài đặt → **Báo giá doanh nghiệp** → bấm **Gửi thử**: sheet có dòng `BG-TEST` và email về hộp thư là xong.

## Lưu ý
- Sửa script sau này: Triển khai → Quản lý triển khai → chỉnh sửa → Phiên bản mới (URL giữ nguyên).
- Hạn mức gửi email của Google: ~100 email/ngày (Gmail thường), ~1.500/ngày (Google Workspace).
- URL web app + SECRET là thông tin bí mật: không đưa lên GitHub, không dán vào CMS.
