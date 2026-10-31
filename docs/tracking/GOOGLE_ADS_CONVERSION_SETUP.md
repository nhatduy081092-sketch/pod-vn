# Thiết lập chuyển đổi Google Ads – YALA.vn

Tài khoản Ads: **chưa được cấp quyền / chưa biết có hay chưa**. Chưa tạo conversion action nào.

## 1. Vấn đề cốt lõi: đơn COD
Đặt hàng ≠ thu tiền. Nếu tối ưu theo "đặt hàng web", Google sẽ tìm thêm người *đặt* (kể cả bom hàng). Vì vậy:

| Conversion action | Nguồn | Loại | Primary? | Đếm | Giá trị |
|---|---|---|---|---|---|
| **Đơn đã thu tiền** | Import offline (CSV/API) từ CMS khi đơn chuyển `PAID` | Import → Clicks | **Primary** | One | Tổng tiền thực thu, VND |
| Đặt hàng web | Thẻ GTM trên `purchase` | Website | Secondary | One (transaction ID = mã đơn) | `value` |
| Lead B2B | Thẻ GTM trên `generate_lead` | Website | Secondary (Primary cho chiến dịch B2B riêng nếu có) | One | Không / ước tính cố định |
| Thêm giỏ, Bắt đầu thanh toán, Đăng ký | Import từ GA4 | GA4 | Secondary | Many/One | — |

> Giai đoạn đầu chưa có import offline: tạm để **Đặt hàng web là Primary**, chuyển sang Secondary khi đơn offline đã chạy ổn 2–4 tuần.

## 2. Import offline (đề xuất – chưa làm)
Web đã lưu `gclid`, `gbraid`, `wbraid` cùng thời điểm vào đơn (`Order.utm`). Cần thêm:
1. CMS: nút **"Xuất chuyển đổi Google Ads"** → CSV các đơn `paymentStatus = PAID` trong khoảng ngày, có gclid/gbraid/wbraid, theo mẫu Google:
   `Google Click ID, Conversion Name, Conversion Time (yyyy-MM-dd HH:mm:ss+0700), Conversion Value, Conversion Currency, Order ID`
2. Chủ shop tải CSV lên Ads → Goals → Uploads (hằng tuần). Hoặc tự động qua Google Ads API (cần developer token – xem GOOGLE_API_INTEGRATION.md).
3. Đơn hoàn tiền: dùng "Conversion adjustments" (retract/restate) cùng Order ID.
Giới hạn: Google chỉ nhận click trong 90 ngày.

## 3. Cấu hình kỹ thuật
| Mục | Cách làm | Trạng thái |
|---|---|---|
| Conversion ID `AW-…` + Label | Ads → Goals → Conversions → tạo action "Đặt hàng web" → Google tag → *Use GTM* | Thiếu quyền |
| Conversion Linker | Tag GTM, All Pages | Đặc tả trong GTM_CONTAINER_SPECIFICATION.md |
| Auto-tagging | Ads → Admin → Account settings → Auto-tagging **Bật** | Chủ shop kiểm |
| GCLID / GBRAID / WBRAID | Web lưu vào đơn (đầu + cuối 30 ngày) | **Code xong**, gbraid/wbraid thêm hôm nay |
| Transaction ID | = mã đơn | Code xong |
| Value / Currency | `value` từ server, VND | Code xong |
| Enhanced Conversions | Cần gửi email/SĐT đã băm SHA-256. **Chưa bật** – cần banner đồng ý + điều khoản ghi rõ. Khi có: GTM user-provided data từ dataLayer (web sẽ đẩy `user_data` đã chuẩn hoá chỉ ở bước purchase) | Chờ quyết định pháp lý |
| Remarketing | Tag GTM, cần `ad_personalization` | Tuỳ chọn |
| Counting | Đặt hàng/Đã thu tiền: **One**; Lead: One | — |
| Attribution | Data-driven (mặc định) | — |
| Conversion window | Click 30 ngày (sản phẩm in theo yêu cầu, cân nhắc 2–14 ngày; B2B dài hơn → 60 ngày cho Lead) | Chủ shop chọn |
| Không làm | Đặt mọi event là Primary | — |

## 4. Phân biệt nguồn Google
| Kênh | Nhận biết |
|---|---|
| Google Organic | GA4: `google / organic`; GSC |
| Google Paid Search | GA4: `google / cpc`, campaign type Search (khi đã liên kết Ads) |
| Shopping / Performance Max / Display | GA4 "Session Google Ads campaign type" (cần liên kết Ads) |
| Đơn trong CMS | `utm.gclid` có → quảng cáo Google; `utm_source/medium` khi có UTM tay |

**Search term trả phí chỉ lấy từ Google Ads** (Search terms report / API), không suy từ GA4.

## 5. Kiểm tra sau khi bật
1. Tag Assistant: Ads conversion bắn 1 lần ở purchase, Conversion Linker bắn All Pages.
2. Ads → Conversions → trạng thái "Recording conversions" (có thể mất 3–24 giờ).
3. Enhanced Conversions → Diagnostics (khi bật).
4. Đơn thử: dùng máy *không* bật cờ nội bộ, bấm vào quảng cáo của chính mình **không** nên – dùng Tag Assistant preview thay vì click thật.
