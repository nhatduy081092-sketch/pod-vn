# Kiểm toán Google – 01/11/2026

Không có quyền vào GTM, GA4, Google Ads, Search Console → chỉ kiểm được những gì nhìn thấy công khai trên yala.vn và trong mã nguồn.

## Google Tag Manager

| Câu hỏi | Kết quả | Bằng chứng |
|---|---|---|
| Container có tải không? | **Không** | HTML + 14 file JS trang chủ không có `gtm.js?id=`; `window.google_tag_manager` undefined |
| Có container trùng? | Không (vì không có container nào) | Code chỉ nạp GTM **hoặc** gtag/pixel trực tiếp, không bao giờ cả hai (`Analytics.tsx`) |
| Tag firing đúng? / Trigger? | CHƯA KIỂM ĐƯỢC | Cần GTM Preview + container |
| Lỗi SPA navigation? | Code đúng | `virtual_page_view` được đẩy mỗi lần đổi path (đã thấy trên web thật); container cần trigger cho sự kiện này |
| Event bị kích hoạt 2 lần? | Không thấy trong dataLayer | 8 sự kiện, mỗi thao tác 1 lần |

Nguyên nhân không tải: GitHub Variable `NEXT_PUBLIC_GTM_ID` trống lúc build (Dockerfile dòng 73, images.yml dòng 92/114 đã truyền biến).

## GA4

| Câu hỏi | Kết quả |
|---|---|
| Measurement ID | **Không có** trong bản build (`NEXT_PUBLIC_GA4_ID` trống, cũng không có tag GA4 qua GTM) |
| DebugView | CHƯA KIỂM ĐƯỢC – không có dữ liệu để xuất hiện |
| Schema e-commerce | ✔ Đúng tên tham số GA4 (`items[].item_id/item_name/price/quantity/item_variant/item_category`, `value`, `currency`, `transaction_id`, `shipping`, `tax`) – đã đọc trong dataLayer thật |
| Purchase revenue | Code lấy `value` = tổng đơn do server tính (gồm phí ship). Chưa kiểm với đơn thật |
| Transaction ID trùng | Chặn bằng `localStorage` theo mã đơn trên cùng máy. Khác máy / xoá dữ liệu trình duyệt → không chặn được, nhưng purchase chỉ bắn trong form thanh toán, không bắn ở trang đơn hàng |
| UTM được lưu? | GA4 tự đọc UTM khi có tag. Riêng web lưu first + last touch vào localStorage (đã kiểm) |
| Lọc internal traffic | Code gắn `traffic_type: internal` cho máy có `yala_internal=1`. GA4 cần bật bộ lọc "Internal traffic" ở trạng thái **Active** – chưa kiểm được |

## Google Search Console

| Câu hỏi | Kết quả | Bằng chứng |
|---|---|---|
| Domain đã xác minh? | CHƯA XÁC MINH ĐƯỢC | Không có bản ghi TXT DNS, không có thẻ meta `google-site-verification` trên trang chủ. Có thể xác minh bằng cách khác (file HTML, GA) → cần chủ shop mở GSC |
| Sitemap | ✔ `https://yala.vn/sitemap.xml` trả 200, 870 `<loc>`; khai báo trong robots.txt | curl |
| URL có thể index? | ✔ Trang SP có canonical đúng, không noindex. robots chặn đúng giỏ, thanh toán, đơn hàng, tài khoản, studio thiết kế | curl |
| Lỗi lập chỉ mục / Search Performance | CHƯA KIỂM ĐƯỢC | Cần quyền GSC |
| Canonical | Trang chủ `https://yala.vn`, SP đúng URL. Trang tìm kiếm `/san-pham?q=` có `noindex, follow` + canonical về trang chủ – không gây hại (đã noindex), **không sửa** theo quy tắc không đổi SEO/canonical khi chưa đánh giá | curl |

## Google Ads

| Câu hỏi | Kết quả |
|---|---|
| Conversion ID / Label | **Không có** (không có `AW-` trong bundle; thiết kế là cấu hình trong GTM) |
| Conversion Linker | Không có (cần GTM) |
| GCLID / GBRAID / WBRAID | ✔ Lưu vào localStorage cùng UTM (30 ngày) và gửi kèm đơn trong `utm` (code đã đọc; lưu vào trình duyệt đã kiểm với ttclid, cùng cơ chế) |
| Purchase conversion | Không hoạt động |
| Enhanced Conversions | Không có. Code cố ý không gửi email/SĐT lên trình duyệt; nếu bật cần băm SHA-256 phía server và có consent |
| Conversion trùng | Không áp dụng (chưa có conversion) |

## Việc chủ shop cần làm (không ai làm thay được)

1. Tạo/chọn container GTM và property GA4 → đặt GitHub Variable `NEXT_PUBLIC_GTM_ID` (chỉ GTM, **không** đặt thêm `NEXT_PUBLIC_GA4_ID` để tránh cài trùng) → build lại.
2. Trong GTM: tag GA4 Configuration + tag sự kiện đọc dataLayer theo `GTM_CONTAINER_SPECIFICATION.md`, trigger cho `virtual_page_view`.
3. GA4: bật bộ lọc Internal traffic (`traffic_type = internal`) sang Active.
4. Mở Search Console xác nhận domain đã xác minh và sitemap đã gửi.
5. Google Ads: tạo conversion "Purchase", gắn ID/Label vào GTM, thêm Conversion Linker.
