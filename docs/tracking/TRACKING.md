# Hệ thống đo lường YALA.vn – tài liệu bàn giao

Cập nhật: 31/10/2026 · Phạm vi: `apps/web` (Next.js), `apps/api` (lưu UTM vào đơn) · Trạng thái: **code xong và đã thử trên máy; CHƯA chạy thật vì chưa có ID nền tảng.**

---

## 1. Kiểm tra hiện trạng (audit)

| Hạng mục | Trước khi làm | Ghi chú |
|---|---|---|
| Mã đo lường trên yala.vn | **Không có** | `curl https://yala.vn/` không thấy googletagmanager / fbevents / analytics.tiktok. Các biến `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID` có trong code nhưng chưa đặt giá trị khi build. |
| GTM | Không hỗ trợ | Chưa có chỗ nạp GTM. |
| TikTok Pixel | Không hỗ trợ | — |
| Sự kiện thương mại | Thiếu nhiều | Có add_to_cart, purchase (gửi trước khi chắc chắn tạo đơn, dễ trùng khi tải lại), thiếu danh sách / giỏ / bước thanh toán / tìm kiếm / đăng nhập. |
| Chuyển trang trong web | Không đo | Next.js chuyển trang không tải lại → GA4/Pixel chỉ thấy trang đầu. |
| UTM | Chỉ lần chạm đầu | Lưu `pod_utm_v1` 30 ngày, gửi kèm đơn/báo giá. |
| Lưu lượng nội bộ | Không lọc | Chủ shop thử đơn sẽ lẫn vào doanh thu. |

## 2. Kiến trúc

```
                 ┌──────────────────────── trình duyệt khách ────────────────────────┐
  Giao diện ───► │ lib/track.ts  ──push──►  window.dataLayer  (luôn luôn, có event_id)│
 (giỏ, thanh     │      │                        │                                    │
  toán, SP…)     │      │ không có GTM            │ có GTM                             │
                 │      ▼                        ▼                                    │
                 │ gtag / fbq / ttq        GTM (GTM-XXXX) đọc dataLayer ──► GA4,      │
                 │ (gửi thẳng)             Meta Pixel, TikTok Pixel, Google Ads       │
                 └────────────────────────────────────────────────────────────────────┘
  Đơn hàng ──► API /orders ──► DB: lưu utm_* (đầu + cuối), gclid/fbclid/ttclid
                                   (đọc được kể cả khi khách chặn quảng cáo)
  Giai đoạn 2 (chưa làm): API ──► Meta CAPI / TikTok Events API / GA4 Measurement Protocol
                                   với event_id = mã đơn để khử trùng.
```

**Chọn chế độ bằng biến môi trường (đặt lúc build):**

| Có `NEXT_PUBLIC_GTM_ID`? | Web nạp gì | Ai gửi sự kiện tới GA4/Meta/TikTok |
|---|---|---|
| Có | **Chỉ GTM** (bỏ qua 3 ID còn lại) | Các thẻ cấu hình trong GTM |
| Không | GA4, Meta Pixel, TikTok Pixel – cái nào có ID thì nạp | Code gọi thẳng `gtag` / `fbq` / `ttq` |
| Không ID nào | Không nạp gì | Chỉ dataLayer (vô hại) |

Hai chế độ loại trừ nhau → **không bao giờ cài trùng**. Khuyến nghị dùng GTM nếu có người quản lý quảng cáo; nếu không, đặt thẳng 3 ID là đủ.

## 3. Danh sách sự kiện

| Sự kiện GA4 | Khi nào | Meta | TikTok | Chống trùng |
|---|---|---|---|---|
| page_view | Tải trang đầu (do mã nạp) | PageView | page | — |
| virtual_page_view | Chuyển trang trong web | PageView | page | — |
| view_item_list | Mở danh mục / tất cả SP / kết quả tìm | — | — | 1 lần / bộ lọc |
| search | Có từ khoá tìm | Search | Search | 1 lần / từ khoá |
| select_item | Bấm vào 1 sản phẩm trong lưới | — | — | — |
| view_item | Mở trang sản phẩm | ViewContent | ViewContent | 3 giây |
| add_to_cart | Thêm vào giỏ | AddToCart | AddToCart | — |
| remove_from_cart | Xoá khỏi giỏ | — | — | — |
| view_cart | Mở giỏ | — | — | 3 giây |
| begin_checkout | Mở trang thanh toán | InitiateCheckout | InitiateCheckout | 3 giây |
| add_shipping_info | Bấm Đặt hàng (gửi kèm hạng giao: standard/express) | — | — | — |
| add_payment_info | Bấm Đặt hàng (cod / bank_transfer) | AddPaymentInfo | AddPaymentInfo | — |
| **purchase** | **Sau khi API trả mã đơn** | Purchase | PlaceAnOrder | **1 lần / mã đơn / máy** (localStorage) |
| sign_up / login | Đăng ký / đăng nhập thành công | CompleteRegistration / — | CompleteRegistration / — | — |
| generate_lead | Gửi form tư vấn, báo giá B2B, giỏ báo giá | Lead | SubmitForm | — |
| contact | Bấm Zalo / gọi / Messenger | Contact | Contact | — |
| refund | **Chưa làm** – xem mục 8 | — | — | — |

**purchase** gửi: `transaction_id` = mã đơn, `value` = tổng tiền server tính (đã gồm phí ship), `currency` = VND, `shipping`, `tax: 0`, `payment_type`, `items[]` (item_id, item_name, item_variant, price/đơn vị, quantity), `order_type` (single / team / group_link). `event_id` = mã đơn.

Mọi sự kiện có `event_id` (UUID; riêng purchase là mã đơn) để sau này khử trùng với API phía server.

## 4. Dữ liệu cá nhân & bảo mật

- **Không** gửi tên, số điện thoại, email, địa chỉ, nội dung ghi chú, mật khẩu hay thông tin chuyển khoản vào bất kỳ nền tảng nào. Chỉ gửi mã sản phẩm, giá, số lượng, mã đơn.
- Không có secret nào trong code. Các ID Pixel/GA4/GTM là công khai theo bản chất (nằm trong HTML).
- Token Conversions API / Events API / API secret của GA4 (giai đoạn 2) phải đặt trong `.env` trên VPS, **không** đặt trong biến `NEXT_PUBLIC_*`.
- **Khuyến nghị pháp lý:** theo Nghị định 13/2023/NĐ-CP, nên có banner đồng ý cookie trước khi nạp Pixel quảng cáo. Đây là thay đổi giao diện nên chưa làm – cần chủ shop quyết.

## 5. Lọc đơn thử / lưu lượng nội bộ

Trên máy của chủ shop và nhân viên, mở **một lần**: `https://yala.vn/?yala_internal=1` (tắt: `?yala_internal=0`). Cờ lưu vĩnh viễn trên trình duyệt đó.

Khi bật:
- GA4 nhận `traffic_type=internal` + `debug_mode` → hiện trong DebugView, bị lọc khỏi báo cáo (sau khi bật bộ lọc ở mục 6.2).
- **Meta và TikTok không nhận gì** → đơn thử không làm bẩn tối ưu quảng cáo.

## 6. Hướng dẫn cài đặt (chủ shop làm)

### 6.1 Đặt ID và build lại
GitHub → repo → **Settings → Secrets and variables → Actions → tab Variables** → *New repository variable*:

| Tên biến | Ví dụ | Bắt buộc? |
|---|---|---|
| `NEXT_PUBLIC_GTM_ID` | `GTM-ABC1234` | Chỉ khi dùng GTM |
| `NEXT_PUBLIC_GA4_ID` | `G-XXXXXXXXXX` | Nếu không dùng GTM |
| `NEXT_PUBLIC_META_PIXEL_ID` | `123456789012345` | Nếu không dùng GTM |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | `CXXXXXXXXXXXXXXXXXXX` | Nếu không dùng GTM |

Sau đó chạy lại workflow build ảnh (hoặc push một commit). ID được "đóng băng" vào bản build – đổi ID thì phải build lại.

### 6.2 GA4
1. Admin → Data streams → Web → lấy Measurement ID `G-…`.
2. Admin → Data collection → **Data filters** → bộ lọc *Internal traffic* sẵn có lọc theo `traffic_type = internal` → chuyển từ *Testing* sang **Active** sau khi đã thử xong.
3. Admin → Events → đánh dấu `purchase`, `generate_lead` là **Key event**.
4. Kiểm tra: Admin → **DebugView** (bật `?yala_internal=1` trước).

### 6.3 GTM (nếu dùng)
1. Variables → *Data Layer Variable*: `event_id`, `ecommerce.value`, `ecommerce.transaction_id`, `ecommerce.items`, `order_type`, `traffic_type`.
2. Thẻ **GA4 Configuration/Google tag** `G-…`, trigger All Pages + Custom Event `virtual_page_view` (gửi page_view). Thêm tham số `traffic_type = {{traffic_type}}`.
3. Thẻ **GA4 Event**, Event name `{{Event}}`, tích *Send Ecommerce data → Data Layer*, trigger Custom Event regex `^(view_item_list|select_item|search|view_item|add_to_cart|remove_from_cart|view_cart|begin_checkout|add_shipping_info|add_payment_info|purchase|sign_up|login|generate_lead)$`.
4. Meta / TikTok: dùng template trong Community Gallery; map `event_id` vào *Event ID*; thêm điều kiện trigger `traffic_type` **không bằng** `internal`.
5. Google Ads: thẻ *Conversion Tracking* `AW-…` trên `purchase`, value = `{{ecommerce.value}}`, transaction ID = `{{ecommerce.transaction_id}}`, currency VND. Bật *Enhanced conversions* chỉ khi đã có banner đồng ý.
6. **Preview** (Tag Assistant) trước khi **Publish**.

### 6.4 Meta Pixel
Events Manager → Data sources → Pixel → **Test events** → nhập yala.vn → làm một lượt xem SP / thêm giỏ. Đơn thử thật: dùng máy **chưa** bật cờ nội bộ, rồi huỷ đơn trong CMS.

### 6.5 TikTok Pixel
TikTok Ads Manager → Assets → Events → Web events → Pixel → **Test events**. Cài thêm tiện ích *TikTok Pixel Helper* trên Chrome.

## 7. Kết quả kiểm thử

Môi trường: `localhost:3000`, API thật nhưng **POST /orders bị giả lập** (không tạo đơn thật). `gtag`/`fbq`/`ttq` được thay bằng hàm ghi lại lệnh gọi để đọc tham số.

| # | Tình huống | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Tìm "áo thun" | Đạt | `search` (53 kết quả) + `view_item_list` 24 SP, giá & danh mục thật |
| 2 | Bấm SP đầu lưới | Đạt | `select_item` index 0 |
| 3 | Chuyển trang trong web | Đạt | `virtual_page_view` + fbq PageView + ttq.page |
| 4 | Mở trang SP | Đạt (sau sửa) | `view_item` 1 lần (trước sửa: 2) |
| 5 | Thêm giỏ Trắng / S | Đạt | gtag + fbq AddToCart + ttq AddToCart, value 199000 |
| 6 | Xem giỏ | Đạt | `view_cart` 1 lần |
| 7 | Vào thanh toán | Đạt (sau sửa) | `begin_checkout` 1 lần (trước sửa: 2) |
| 8 | Đặt hàng COD | Đạt | `add_shipping_info` standard → `add_payment_info` cod → `purchase` TEST-TRK-001, value 229000, shipping 30000, item price 199000 × 1, event_id = mã đơn; fbq Purchase eventID = mã đơn; ttq PlaceAnOrder; **1** lần POST /orders |
| 9 | Tải lại trang xác nhận đơn | Đạt | 0 purchase sau reload |
| 10 | Gọi purchase lại cùng mã | Đạt | cùng mã: 0 lần thêm; mã mới gọi 2 lần: 1 lần |
| 11 | Xoá khỏi giỏ | Đạt | `remove_from_cart` value 398000 (199000 × 2) |
| 12 | Cờ nội bộ | Đạt | GA4 nhận `traffic_type=internal`, `debug_mode`; fbq/ttq 0 lệnh |
| 13 | Chế độ GTM | Đạt | chỉ push dataLayer, 0 lệnh gửi thẳng |
| 14 | generate_lead | Đạt (gọi hàm) | push `generate_lead`; form thật không gửi để tránh tạo lead giả |
| 15 | Đăng nhập / đăng ký | Chưa thử | cần tài khoản thử; code gọi sau khi API trả thành công |
| 16 | Lỗi JS console | Đạt | không lỗi JS (chỉ 401 `/me` khi chưa đăng nhập, 404 đơn thử) |
| 17 | TypeScript web | Đạt | `tsc --noEmit` không lỗi |

## 8. Bảng trạng thái

| Hạng mục | Trạng thái | Bằng chứng | Ghi chú |
|---|---|---|---|
| GTM | Code sẵn, **chưa chạy thật** | Thử #13 | Cần `GTM-…` + cấu hình thẻ (6.3) |
| GA4 | Code sẵn, **chưa chạy thật** | Thử #1–14 (lệnh gtag đúng tham số) | Cần `G-…`; kiểm tra lại bằng DebugView sau khi deploy |
| Meta Pixel | Code sẵn, **chưa chạy thật** | Lệnh fbq đúng tên sự kiện + eventID | Cần Pixel ID; kiểm tra Test events |
| TikTok Pixel | Code sẵn, **chưa chạy thật** | Lệnh ttq đúng tên sự kiện + event_id | Cần Pixel ID |
| Purchase | Đạt trên máy | Thử #8–10 | Giá trị từ server; chưa có dữ liệu thật trên GA4 |
| Add to Cart | Đạt trên máy | Thử #5 | — |
| Checkout | Đạt trên máy | Thử #7–8 | — |
| UTM | Đạt trên máy | Lưu đầu + cuối, gửi kèm đơn | Thêm `ttclid → tiktok` ở API |
| Deduplication | Phía trình duyệt: đạt | Thử #4, 7, 9, 10 | Khử trùng với server (CAPI) chưa có vì chưa làm CAPI |
| Refund | **Chưa làm** | — | Không có cổng thanh toán; hoàn tiền ghi tay trong CMS. Cần GA4 Measurement Protocol (API secret) – giai đoạn 2 |
| Google Ads | Chưa làm | — | Cấu hình trong GTM (6.3 bước 5) |
| CAPI / Events API / Enhanced Conversions | Giai đoạn 2 | — | Cần token để trong `.env` VPS; `event_id` = mã đơn đã sẵn sàng |
| Banner đồng ý cookie | Chưa làm | — | Cần chủ shop duyệt (đổi giao diện) |

**Chưa tuyên bố hoàn thành**: chỉ coi là xong khi đã có ID, deploy, và thấy sự kiện trong GA4 DebugView, Meta Test events, TikTok Test events.

## 9. Quyền / thông tin còn thiếu

- GA4: Measurement ID (và quyền *Editor* trên property nếu muốn tôi bật bộ lọc nội bộ).
- Meta: Pixel ID (Business Manager → Events Manager). Giai đoạn 2: Access Token CAPI.
- TikTok: Pixel ID. Giai đoạn 2: Events API access token.
- GTM (tuỳ chọn): Container ID + quyền *Publish*.
- Google Ads (tuỳ chọn): Conversion ID `AW-…` + label.
- Quyền đặt *Variables* trong GitHub Actions (chủ repo tự đặt; không cần gửi mật khẩu).

## 10. Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Không thấy gì trên GA4 | ID chưa vào bản build | Xem nguồn trang yala.vn, tìm `G-`/`GTM-`. Không có → đặt Variables rồi build lại |
| Sự kiện bị đếm đôi | Vừa đặt GTM vừa cài GA4 trong GTM **và** đặt `NEXT_PUBLIC_GA4_ID` | Không sao: có GTM thì web bỏ qua GA4 ID. Đếm đôi chỉ xảy ra nếu trong GTM có 2 thẻ GA4 |
| Purchase không lên Meta | Đang bật cờ nội bộ | Mở `?yala_internal=0` hoặc dùng máy khác |
| Purchase thiếu trên GA4 | Khách chặn quảng cáo | Bình thường; đối chiếu bằng đơn trong CMS (có UTM) |
| Doanh thu GA4 lệch CMS | Đơn huỷ / chưa thanh toán vẫn tính | GA4 tính lúc đặt; cần refund (giai đoạn 2) |
| Trang không đo khi chuyển trong web | Trong GTM chưa có trigger `virtual_page_view` | Thêm như 6.3 bước 2 |

## 11. Tệp liên quan

- `apps/web/src/lib/track.ts` – toàn bộ sự kiện, chống trùng, UTM, cờ nội bộ
- `apps/web/src/components/layout/Analytics.tsx` – nạp GTM hoặc GA4/Meta/TikTok
- `apps/web/src/components/shop/ListTracker.tsx` – view_item_list / select_item / search
- `apps/web/src/lib/cart.tsx`, `components/shop/CartView.tsx`, `components/shop/CheckoutForm.tsx`, `components/product/ProductConfigurator.tsx`, `components/account/AuthForm.tsx`
- `apps/api/src/routes/checkout.ts` – trả `shippingFee`, nhận `ttclid`
- `Dockerfile`, `.github/workflows/images.yml`, `docker-compose.production.yml`, `.env.example` – truyền 2 biến mới
