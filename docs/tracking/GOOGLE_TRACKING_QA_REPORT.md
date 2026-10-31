# Báo cáo kiểm thử Google stack – YALA.vn

Ngày: 31/10/2026. Nguyên tắc: chỉ ghi **Đạt** khi có bằng chứng. "Chưa thử được" ≠ lỗi, mà là thiếu điều kiện (ID, quyền).

## 1. Kiểm thử theo yêu cầu

| # | Hạng mục | Kết quả | Bằng chứng / lý do |
|---|---|---|---|
| 1 | Tag Assistant nhận diện GTM | **Chưa thử được** | Chưa có GTM container ID |
| 2 | Tag Assistant nhận diện Google Tag | **Chưa thử được** | Chưa có G-/AW- ID trên web |
| 3 | GA4 DebugView nhận event | **Chưa thử được** | Chưa có GA4 property. Thay thế: đã kiểm tra lệnh `gtag('event', …)` trên máy đủ tham số (TRACKING.md mục 7) |
| 4 | Search Console xác minh domain | **Không đạt / chưa có** | DNS không có TXT `google-site-verification`; không có thẻ meta |
| 5 | Sitemap được Google đọc | **Chưa kiểm được** (cần GSC). Phía web: sitemap 200, XML hợp lệ; **lỗi thiếu 669 SP đã sửa trên máy** (200 → 870 URL), chưa deploy |
| 6 | URL Inspection | **Chưa thử được** | Cần GSC |
| 7 | Google Ads nhận conversion test | **Chưa thử được** | Chưa có tài khoản / conversion action |
| 8 | Conversion Linker | **Chưa thử được** | Cần GTM. Phía web: gclid/gbraid/wbraid được lưu vào đơn (code; gbraid/wbraid chưa thử trên trình duyệt) |
| 9 | Enhanced Conversions | **Chưa bật – có chủ đích** | Cần banner đồng ý trước (Nghị định 13/2023) |
| 10 | Consent Mode theo lựa chọn người dùng | **Chưa đạt** | Có khung đặt trạng thái mặc định; chưa có banner để cập nhật theo lựa chọn |
| 11 | Chuyển route Next.js không gây trùng | **Đạt (trên máy)** | Mỗi lần chuyển trang 1 `virtual_page_view`; view_item / view_cart / begin_checkout 1 lần sau khi sửa (trước sửa: 2) |
| 12 | Purchase không ghi nhiều lần | **Đạt (trên máy)** | Đặt đơn giả lập: 1 purchase, 1 POST; tải lại trang xác nhận: 0; gọi lại cùng mã: 0 |

## 2. SEO kỹ thuật (kiểm từ bên ngoài, trên bản live)

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| robots.txt | Đạt | Chặn đúng giỏ/thanh toán/tài khoản, khai sitemap |
| HTTP → HTTPS, www → không www | Đạt | 301 |
| 404 cho URL lạ | Đạt | 404 |
| 200 URL sitemap trả 200 | Đạt | 200/200 |
| Canonical tự trỏ | Đạt | 200/200 |
| Noindex lọt vào sitemap | Đạt | 0 |
| Tiêu đề trùng | Đạt | 0 |
| Sitemap đủ sản phẩm | **Lỗi → đã sửa trên máy** | 101/770 → 770/770 |
| Canonical trang noindex trỏ trang chủ | Cảnh báo nhẹ | `/san-pham?q=`, `/gio-hang`; chưa sửa, chờ duyệt |
| JSON-LD trang chủ / danh mục | Thiếu | Đề xuất WebSite, Organization, BreadcrumbList; chưa làm |
| Core Web Vitals | **Chưa đo được** | PSI API hết hạn mức; trình duyệt ẩn không ghi LCP |

## 3. Tài khoản / property / container / API đã kết nối
| | Trạng thái |
|---|---|
| Tài khoản Google | Không kết nối (không đăng nhập hộ) |
| GSC property | Không |
| GA4 property | Không |
| GTM container | Không |
| Google Ads conversion action | Không tạo |
| Search Console API / Google Ads API | Không |

## 4. Quyền còn thiếu
1. GSC: xác minh domain (DNS TXT ở P.A Việt Nam) + thêm service account quyền Restricted nếu muốn lấy số tự động.
2. GA4: Measurement ID; quyền Editor nếu muốn Claude cấu hình hộ qua Admin API (không bắt buộc – có hướng dẫn tay).
3. GTM: Container ID; quyền Publish nếu muốn cấu hình hộ.
4. Google Ads: Customer ID, Conversion ID/Label; API: developer token + OAuth (GOOGLE_API_INTEGRATION.md).
5. Quyết định: banner đồng ý cookie (giao diện) và trạng thái Consent Mode mặc định.

## 5. Bước kiểm chứng khi đã có ID (để chuyển "Chưa thử được" → "Đạt")
1. Đặt Variables GitHub → build → deploy.
2. `curl https://yala.vn/ | grep GTM-` có kết quả.
3. Máy bật `?yala_internal=1` → GTM Preview → làm 1 lượt mua (đơn huỷ sau) → chụp DebugView, Tag Assistant.
4. GSC: Sitemap "Success", số URL phát hiện ≈ 870.
5. Ads: "Recording conversions" sau 24 giờ.
