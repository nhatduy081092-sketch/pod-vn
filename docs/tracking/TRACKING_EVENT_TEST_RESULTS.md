# Kết quả thử từng sự kiện – 01/11/2026

Môi trường: https://yala.vn (bản e9fff27), trình duyệt trong ứng dụng, cờ máy nội bộ `yala_internal=1` (gắn `traffic_type: internal`).
Cách đo: đọc `window.dataLayer` sau mỗi thao tác. Vì bản thật không nạp GTM / GA4 / Pixel nào, **mức cao nhất đạt được là FIRING (vào dataLayer)**; không sự kiện nào RECEIVED.

## Bảng 14 sự kiện

| Sự kiện | Trạng thái | Đúng lúc | Dữ liệu | Nền tảng nhận | Trùng | Chuyển trang SPA | Consent |
|---|---|---|---|---|---|---|---|
| page_view | FIRING (chuyển trang) | ✔ `virtual_page_view` mỗi lần đổi path | page_path, page_location, page_title | Không có | Không | ✔ | Không có consent |
| view_item_list | FIRING | ✔ khi mở danh sách/tìm kiếm | 24 item, list "Tìm kiếm"; **24/24 giá 0** (SP báo giá) | Không có | Không | – | Không có consent |
| view_item | FIRING | ✔ khi mở trang SP | item_id, tên, giá 199000, qty 1, VND | Không có | Không (chặn 3 giây) | ✔ | Không có consent |
| search | FIRING | ✔ | search_term "binh giu nhiet", results 101 | Không có | Không | – | Không có consent |
| add_to_cart | FIRING | ✔ sau khi thêm thành công | 199000 VND, variant "Trắng / S", qty 1 | Không có | Không | – | Không có consent |
| remove_from_cart | FIRING | ✔ khi bấm Xoá | 199000 VND, qty 1 | Không có | Không | – | Không có consent |
| view_cart | FIRING | ✔ khi mở giỏ | 199000 VND, 1 item | Không có | Không | ✔ | Không có consent |
| begin_checkout | FIRING | ✔ khi mở trang thanh toán | 199000 VND (tạm tính, chưa ship) | Không có | Không | ✔ | Không có consent |
| add_shipping_info | INSTALLED · CHƯA KIỂM | Bắn lúc bấm Đặt hàng (cùng lúc với add_payment_info) | – | – | Bắn lại nếu API lỗi và khách bấm lại | – | – |
| add_payment_info | INSTALLED · CHƯA KIỂM | Như trên | – | – | Như trên | – | – |
| purchase | INSTALLED · CHƯA KIỂM | Sau khi API tạo đơn trả mã đơn (**chưa thanh toán**) | transaction_id = mã đơn, value = tổng server tính (gồm ship), tax 0 | – | Chặn bằng localStorage theo mã đơn | – | – |
| refund | NOT INSTALLED | – | – | – | – | – | – |
| generate_lead | INSTALLED · CHƯA KIỂM | Khi gửi form báo giá | topic | – | – | – | – |
| sign_up | INSTALLED · CHƯA KIỂM | Khi đăng ký | method | – | – | – | – |

Lý do CHƯA KIỂM: purchase / add_shipping_info / add_payment_info cần tạo đơn; generate_lead gửi yêu cầu báo giá thật tới shop; sign_up tạo tài khoản thật. Cả ba đều cần anh/chị cho phép hoặc môi trường staging.

## Ghi chú thêm

- Trang đầu tiên khi tải trang (không phải SPA) không đẩy `page_view` vào dataLayer – việc này do tag GA4 trong GTM (hoặc `gtag('config')`) tự gửi. Vì không có tag, lượt xem trang đầu hiện không được ghi ở đâu.
- Trên trang chủ, khối "Bán chạy" không đẩy `view_item_list` (dataLayer trống sau khi tải trang chủ).
- Khi chuyển trang SPA, `view_item` vào dataLayer **trước** `virtual_page_view` (effect của component con chạy trước component cha) → nếu GTM lấy `page_title` từ biến dataLayer thì sự kiện này có thể mang tiêu đề trang trước.
- Mobile: chưa thử riêng trên điện thoại thật. Mã không phân biệt thiết bị; giỏ hàng / thanh toán cùng một component.

## Tỷ lệ (có mẫu số)

- 14 sự kiện yêu cầu: **8/14 FIRING đúng dữ liệu vào dataLayer** trên web thật; 0/14 RECEIVED ở bất kỳ nền tảng nào; 5/14 chưa kiểm (cần quyền); 1/14 chưa có mã (refund).
- Không thể tính tỷ lệ RECEIVED/VALIDATED cao hơn 0 khi chưa có ID nền tảng.
