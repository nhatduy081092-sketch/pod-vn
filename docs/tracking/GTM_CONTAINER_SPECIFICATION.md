# Đặc tả GTM container – YALA.vn

Áp dụng khi đặt `NEXT_PUBLIC_GTM_ID`. Container hiện có: **chưa thấy** trên yala.vn → tạo mới (Web container, tên `yala.vn`).

## A. Container
- Snippet: `components/layout/Analytics.tsx`, nạp 1 lần trong layout gốc, `strategy="afterInteractive"`, kèm `window.__yalaGtm=true` để web tắt gửi thẳng.
- Phần `<noscript>` iframe **không** cài (khách không chạy JS thì cũng không chạy được thương mại điện tử) – giảm HTML.
- Không cài GA4/Pixel ở chỗ khác (theme, plugin…) – web chỉ có 1 điểm nạp.

## B. Data Layer (web đẩy)

Mỗi sự kiện thương mại: `{ecommerce: null}` rồi
```js
{ event: "add_to_cart", event_id: "uuid", traffic_type?: "internal",
  ecommerce: { currency: "VND", value: 199000,
    items: [{ item_id, item_name, item_category?, item_variant?, item_list_name?, index?, price, quantity }] } }
```
`purchase` thêm: `ecommerce.transaction_id`, `shipping`, `tax`, `payment_type`; ngoài ecommerce: `order_type`, `event_id` = mã đơn.
Chuyển trang: `{ event: "virtual_page_view", page_path, page_location, page_title }`.
Sự kiện không thương mại: `search {search_term, results}`, `sign_up/login {method}`, `generate_lead {topic}`, `contact {channel}`.

## E. Variables

| Tên biến GTM | Loại | Giá trị |
|---|---|---|
| DLV – event_id | Data Layer Variable | `event_id` |
| DLV – transaction_id | DLV | `ecommerce.transaction_id` |
| DLV – value | DLV | `ecommerce.value` |
| DLV – currency | DLV | `ecommerce.currency` |
| DLV – items | DLV | `ecommerce.items` |
| DLV – ecommerce | DLV | `ecommerce` |
| DLV – order_type | DLV | `order_type` |
| DLV – traffic_type | DLV | `traffic_type` |
| DLV – page_path / page_location / page_title | DLV | cùng tên |
| DLV – search_term, method, topic | DLV | cùng tên |
| Page Location / Page Referrer / Page Path | Built-in | bật |
| item_id, item_name, item_category, quantity, price | — | nằm trong `items[]`; GA4 tự đọc khi bật *Send Ecommerce data*. Chỉ tạo DLV riêng (`ecommerce.items.0.item_id`…) nếu thẻ khác cần |
| Traffic source | — | GA4 tự lấy từ URL/referrer; **không** tự dựng |

## D. Triggers

| Trigger | Loại | Điều kiện |
|---|---|---|
| Consent Init | Consent Initialization – All Pages | — |
| All Pages | Page View | — |
| SPA Page View | Custom Event | `virtual_page_view` |
| Ecommerce events | Custom Event, regex | `^(view_item_list|select_item|search|view_item|add_to_cart|remove_from_cart|view_cart|begin_checkout|add_shipping_info|add_payment_info|purchase|sign_up|login|generate_lead)$` |
| Purchase | Custom Event | `purchase` |
| Lead | Custom Event | `generate_lead` |
| Add to Cart / Begin Checkout / Sign Up | Custom Event | tên tương ứng |
| *Ngoại trừ nội bộ* (exception) | Custom Event regex `.*` | `DLV – traffic_type` equals `internal` |

## C. Tags

| Tag | Loại | Trigger | Ghi chú |
|---|---|---|---|
| Consent – default | Consent Mode (template "Consent Mode (Google tags)") | Consent Init | Trạng thái mặc định; sau này banner gọi `gtag('consent','update',…)` |
| Google tag – G-XXXX | Google Tag | All Pages | Config param `traffic_type = {{DLV – traffic_type}}`; *send_page_view* bật |
| GA4 – page_view SPA | GA4 Event `page_view` | SPA Page View | Tham số `page_location`, `page_title` |
| GA4 – ecommerce | GA4 Event, Event name `{{Event}}` | Ecommerce events | *Send Ecommerce data: Data Layer*; tham số `event_id`, `order_type`, `search_term`, `method`, `topic` |
| Conversion Linker | Conversion Linker | All Pages | Bắt buộc cho Ads (đọc gclid/gbraid/wbraid lưu cookie) |
| Ads – Purchase (đặt hàng) | Google Ads Conversion | Purchase, *trừ nội bộ* | value `{{DLV – value}}`, currency `{{DLV – currency}}`, transaction ID `{{DLV – transaction_id}}` |
| Ads – Lead | Google Ads Conversion | Lead, *trừ nội bộ* | Không giá trị hoặc giá trị ước tính cố định |
| Ads – Remarketing | Google Ads Remarketing | All Pages + SPA Page View, *trừ nội bộ* | Chỉ khi chạy remarketing; cần consent `ad_personalization` |
| Meta Pixel / TikTok Pixel | Template Gallery | tuỳ | Map `event_id` → Event ID; *trừ nội bộ* |

## Bảng ánh xạ Data Layer → GTM → GA4 / Ads

| dataLayer event | Tag GTM | GA4 event | Ads conversion |
|---|---|---|---|
| gtm.js | Google tag | page_view (lần đầu) | — |
| virtual_page_view | GA4 – page_view SPA | page_view | — |
| view_item_list, select_item, search, view_item | GA4 – ecommerce | cùng tên | — |
| add_to_cart | GA4 – ecommerce | add_to_cart | (phụ, import từ GA4 nếu muốn) |
| remove_from_cart, view_cart | GA4 – ecommerce | cùng tên | — |
| begin_checkout | GA4 – ecommerce | begin_checkout | (phụ) |
| add_shipping_info, add_payment_info | GA4 – ecommerce | cùng tên | — |
| purchase | GA4 – ecommerce + Ads – Purchase | purchase | "Đặt hàng web" (phụ) |
| generate_lead | GA4 – ecommerce + Ads – Lead | generate_lead | "Lead" (phụ) |
| sign_up | GA4 – ecommerce | sign_up | (phụ) |

## Chống trùng
- Web: có GTM → không gửi thẳng (đã thử).
- GA4: chỉ **một** Google tag G-XXXX trong container. Tắt *Enhanced Measurement → Page changes based on browser history* (đã có SPA trigger).
- Ads: transaction ID = mã đơn → Ads tự bỏ trùng; web cũng chỉ gửi purchase 1 lần / mã (đã thử).

## F. QA (làm trong GTM Preview)
1. Preview → mở yala.vn → Tag Assistant thấy `GTM-XXXX` và `G-XXXX`.
2. Chuyển 3 trang bằng menu → mỗi lần đúng 1 `virtual_page_view` và 1 page_view GA4.
3. Thêm giỏ → thanh toán → đặt đơn thử (máy đã bật `?yala_internal=1` thì Ads/Meta **không** bắn – đúng thiết kế; muốn thấy Ads bắn dùng máy khác rồi huỷ đơn).
4. GA4 DebugView thấy đủ chuỗi sự kiện, `purchase` có `transaction_id`.
5. Tải lại trang xác nhận đơn → không có purchase thứ 2.
6. Mục *Tags Fired*: không thẻ nào bắn 2 lần cho 1 sự kiện.
7. Publish kèm ghi chú phiên bản.
