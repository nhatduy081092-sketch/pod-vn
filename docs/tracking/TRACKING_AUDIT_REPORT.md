# Kiểm toán tracking yala.vn – 01/11/2026

Phạm vi: web thật https://yala.vn (bản e9fff27), mã nguồn `apps/web`, `apps/api`, `Dockerfile`, `.github/workflows/images.yml`.
Không tạo đơn thật, không thanh toán, không gửi form báo giá, không tạo tài khoản, không đăng nhập công cụ quản trị (GA4, GTM, Ads, Meta, TikTok, Search Console) – các mục cần những việc đó ghi **CHƯA KIỂM** kèm lý do.

Thang trạng thái: **NOT INSTALLED** (chưa có mã) · **INSTALLED** (có mã) · **FIRING** (sự kiện đã bắn) · **RECEIVED** (nền tảng đã nhận) · **VALIDATED** (dữ liệu đúng) · **PRODUCTION VERIFIED** (đã xác minh trên web thật).
Thêm: **NOT CONFIGURED** = có mã nhưng bản build thật không có ID nên mã không chạy.

## Kết luận một dòng

Code tracking phía trình duyệt đã viết đủ và bắn đúng vào `dataLayer` trên web thật, nhưng **bản build đang chạy không có ID GTM / GA4 / Meta Pixel / TikTok Pixel nào**, nên **không nền tảng nào nhận được dữ liệu** (0 sự kiện được gửi đi). Chưa có server-side tracking, chưa có consent, Purchase đang tính lúc đặt hàng chứ không phải lúc đã thanh toán.

## Bằng chứng chính

1. Tải HTML trang chủ + 14 file JS trang chủ của yala.vn: không có `gtm.js?id=`, `gtag/js?id=`, `fbevents.js`, `analytics.tiktok.com`, không có mã `GTM-…`, `G-…`, `AW-…`. Chỉ có `__yalaGtm` (biến kiểm tra trong `track.ts`).
2. Trên trình duyệt (yala.vn): `window.google_tag_manager`, `gtag`, `fbq`, `ttq` đều `undefined`; `performance` không có request nào tới Google/Meta/TikTok.
3. `Analytics.tsx` chỉ nạp mã khi biến `NEXT_PUBLIC_*_ID` có giá trị lúc build. `Dockerfile` và `images.yml` đã truyền đủ 4 biến từ GitHub Variables → các Variables này đang **trống**.
4. `dataLayer` trên web thật ghi đúng 8 sự kiện khi thao tác (chi tiết ở `TRACKING_EVENT_TEST_RESULTS.md`).

## Bảng hệ thống (13 hạng mục)

| # | Hệ thống | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Google Tag Manager | INSTALLED · NOT CONFIGURED | Mã nạp GTM có trong `Analytics.tsx`; bản thật không có `NEXT_PUBLIC_GTM_ID` |
| 2 | Google Analytics 4 | INSTALLED · NOT CONFIGURED | Gửi qua GTM hoặc gtag trực tiếp; không có ID |
| 3 | Google Search Console | CHƯA XÁC MINH ĐƯỢC | sitemap 200 (870 URL), robots đúng, canonical SP đúng; không thấy TXT DNS / thẻ meta xác minh → cần chủ shop mở GSC |
| 4 | Google Ads Conversion | NOT INSTALLED | Không có Conversion ID/Label; thiết kế là cấu hình trong GTM |
| 5 | Meta Pixel | INSTALLED · NOT CONFIGURED | Có `eventID` để khử trùng; không có ID |
| 6 | Meta Conversions API | NOT INSTALLED | Không có mã server gửi Meta |
| 7 | TikTok Pixel | INSTALLED · NOT CONFIGURED | Có `event_id`; không có ID |
| 8 | TikTok Events API | NOT INSTALLED | Không có mã server gửi TikTok |
| 9 | Server-side tracking | NOT INSTALLED | API chỉ lưu UTM vào đơn, không chuyển tiếp sự kiện |
| 10 | Data Layer | PRODUCTION VERIFIED (8 sự kiện) | Đúng schema GA4 e-commerce, có `event_id`, xoá `ecommerce` trước mỗi lần đẩy |
| 11 | UTM / click ID | PRODUCTION VERIFIED (lưu trên trình duyệt) · lưu vào đơn: INSTALLED, CHƯA KIỂM | Cần 1 đơn test để xem `Order.utm` |
| 12 | Consent | NOT INSTALLED | Không có banner; `lib/consent.ts` chưa commit, còn `TODO(human)` |
| 13 | Khử trùng sự kiện | INSTALLED · một phần VALIDATED | 8 sự kiện không trùng khi thử; purchase chưa thử được; chưa có cặp browser–server để khử trùng |

## Bảng tổng hợp theo yêu cầu

| Hệ thống | Event | Trạng thái | Lỗi | Bằng chứng |
|---|---|---|---|---|
| GTM | Page View | NOT CONFIGURED | Không nạp container | Không có `gtm.js` trong HTML/JS; `google_tag_manager` undefined |
| GA4 | View Item | FIRING (dataLayer) · không RECEIVED | Không có tag GA4 | `view_item` 199000 VND, đúng item_id/tên/giá |
| GA4 | Add to Cart | FIRING (dataLayer) · không RECEIVED | Không có tag GA4 | `add_to_cart` 1 lần, variant "Trắng / S" |
| GA4 | Purchase | INSTALLED · CHƯA KIỂM | Tính lúc đặt hàng, không phải lúc thanh toán | Đọc `CheckoutForm.tsx`; chưa có quyền tạo đơn |
| Meta | Purchase | NOT CONFIGURED | Không có Pixel ID | `fbq` undefined |
| Meta CAPI | Purchase | NOT INSTALLED | Không có mã server | grep `apps/api` không có graph.facebook |
| TikTok | CompletePayment | NOT CONFIGURED | Không có Pixel ID; code gửi `PlaceAnOrder` chứ không phải `CompletePayment` | `ttq` undefined; `track.ts` |
| TikTok API | CompletePayment | NOT INSTALLED | Không có mã server | grep `apps/api` |
| Google Ads | Purchase | NOT INSTALLED | Không có Conversion ID/Label | Không có `AW-` trong bundle |
| Search Console | Indexing | CHƯA XÁC MINH ĐƯỢC | – | sitemap 200/870 URL; cần quyền GSC |

## Danh sách file

- `TRACKING_EVENT_TEST_RESULTS.md` – kết quả từng sự kiện
- `GOOGLE_TRACKING_AUDIT.md` – GTM, GA4, Search Console, Google Ads
- `META_TIKTOK_AUDIT.md` – Meta, TikTok
- `SERVER_TRACKING_AUDIT.md` – server, webhook, ảnh hưởng tới checkout
- `TRACKING_BUGS_AND_FIXES.md` – lỗi, nguyên nhân, cách sửa, trước/sau

## Ghi chú về dữ liệu thử

Lần mở đầu tiên `https://yala.vn/?utm_source=google&utm_medium=cpc&utm_campaign=test_campaign` diễn ra trước khi bật cờ máy nội bộ. Vì web không nạp mã nền tảng nào, **không có gì được gửi đi** – UTM thử chỉ nằm trong localStorage của trình duyệt kiểm thử. Sau đó đã bật `yala_internal=1`. Không có dữ liệu thử nào lọt vào báo cáo doanh thu.
