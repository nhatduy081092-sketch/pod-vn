# Cấu hình GA4 – YALA.vn

Property: **chưa có / chưa được cấp quyền**. Các bước dưới đây chủ shop (hoặc người được cấp quyền Editor) làm trong GA4 Admin.

## 1. Thiết lập cơ bản
| Mục | Giá trị khuyến nghị | Lý do |
|---|---|---|
| Múi giờ property | (GMT+07:00) Hồ Chí Minh | Khớp CMS khi đối chiếu theo ngày |
| Tiền tệ | VND | Web gửi `currency: VND` |
| Measurement ID | đặt vào biến build hoặc GTM | — |
| Enhanced Measurement | Bật: scroll, outbound click, site search (`q`), file download. **Tắt**: page changes based on browser history (web đã đẩy `virtual_page_view`), form interactions (đã có generate_lead) | Tránh đếm đôi |
| Cross-domain | **Không cần** – mua hàng chỉ trên yala.vn, không có cổng thanh toán ngoài | — |
| Unwanted referrals | Thêm domain ngân hàng/QR nếu sau này có cổng thanh toán chuyển hướng | Hiện chưa có |
| Internal traffic | Data filter "Internal Traffic" (`traffic_type = internal`) → Testing → Active | Web gắn sẵn khi bật `?yala_internal=1` |
| Developer traffic | Giữ filter mặc định | `debug_mode` chỉ bật cho máy nội bộ |
| Data retention | **14 tháng** | Mặc định 2 tháng quá ngắn để so cùng kỳ |
| Google Signals | **Tắt** đến khi có banner đồng ý | Nghị định 13/2023 |
| Liên kết | Google Ads, Search Console | Cần quyền admin cả hai bên |

## 2. Consent Mode v2
Web đã có chỗ gọi `gtag('consent','default',…)` trước khi nạp GA4/GTM (xem `Analytics.tsx`). Khi có banner: gọi `gtag('consent','update',{analytics_storage, ad_storage, ad_user_data, ad_personalization})` theo lựa chọn khách.

## 3. Custom dimensions (event scope)
| Tên hiển thị | Tham số | Dùng cho |
|---|---|---|
| Loại đơn | `order_type` | single / team / group_link |
| Hình thức thanh toán | `payment_type` | cod / bank_transfer |
| Chủ đề lead | `topic` | b2b_quote, add_to_quote… |
| Kênh liên hệ | `channel` | zalo / phone / messenger |
| Phương thức đăng nhập | `method` | phone |
| Event ID | `event_id` | Đối chiếu khi gỡ lỗi (cardinality cao – chỉ tạo nếu cần) |

Custom metrics: **không cần** – value/quantity đã là chỉ số chuẩn ecommerce.

## 4. Key events (chuyển đổi)
`purchase` (chính), `generate_lead` (chính cho B2B). `sign_up`, `begin_checkout`, `add_to_cart`: để là sự kiện thường, xem trong phễu.

## 5. Audiences gợi ý
- Thêm giỏ nhưng chưa mua (7 ngày): add_to_cart AND NOT purchase.
- Bắt đầu thanh toán chưa mua (3 ngày).
- Khách B2B: generate_lead `topic` chứa `b2b`.
- Đã mua (loại trừ khỏi quảng cáo thu hút).
Audience dùng cho Ads cần `ad_personalization` được đồng ý.

## 6. Báo cáo phục vụ
| Báo cáo | Nơi xem trong GA4 | Chiều/chỉ số |
|---|---|---|
| Acquisition | Reports → Acquisition → User / Traffic acquisition | First user source/medium; Session source/medium/campaign |
| Traffic Source | Traffic acquisition | Session source, medium, campaign, manual ad content (`utm_content`), manual term (`utm_term`) |
| Landing Page | Engagement → Landing page | Landing page + query string, Sessions, Key events |
| Ecommerce | Monetization → Ecommerce purchases | Item name, item revenue, items added to cart |
| Product Performance | Ecommerce purchases + item_category | Item views → add-to-cart rate → purchased |
| Checkout Funnel | Explore → Funnel: view_item → add_to_cart → begin_checkout → add_shipping_info → add_payment_info → purchase | Bật "open funnel" để xem rơi ở bước nào |
| Purchase Report | Explore → Free form: Transaction ID, Purchase revenue, Order type, Payment type | Đối chiếu từng đơn với CMS |
| Campaign Performance | Traffic acquisition lọc Session campaign | + Google Ads report khi đã liên kết |
| Device | Tech → Overview | Device category |
| New vs Returning | Explore → Free form: New / established | — |

## 7. Đối chiếu doanh thu với backend
- GA4 `transaction_id` = **mã đơn** trong CMS → khớp được từng đơn.
- GA4 thường **ít hơn** backend 10–30%: chặn quảng cáo, trình duyệt chặn cookie, máy nội bộ bị lọc. Đây là bình thường.
- GA4 có thể **nhiều hơn** doanh thu thật: đơn COD bị huỷ / bom hàng vẫn đã ghi purchase. Chưa có refund tự động (giai đoạn 2: Measurement Protocol cần API secret, đặt ở `.env` VPS).
- Cách đối chiếu hàng tuần: Explore liệt kê Transaction ID + Purchase revenue → so với danh sách đơn trong CMS cùng khoảng ngày (múi giờ GMT+7).

## 8. DebugView
Bật `?yala_internal=1` trên máy → mọi sự kiện có `debug_mode` → Admin → DebugView thấy theo thời gian thực.
