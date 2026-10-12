# YALA – Đo phễu đơn nhóm (12/10/2026)

Mục tiêu: biết nhóm rơi ở bước nào **trước khi** chạy ads / mở rộng SEO.
Không gửi tên, SĐT hay nội dung danh sách lên GA4/Pixel – chỉ số đếm và nhãn.

## 1. Phễu
```
group_create ─► group_share ─► group_view (member) ─► group_join ─► group_close ─► group_checkout ─► purchase (order_type=group_link)
  Studio          trang nhóm      thành viên mở link     ghi danh       chốt DS         sang trang SP       đặt đơn
```
Luồng phụ (không qua link): `roster_upload` (tab "Đặt cho nhóm") ─► `add_to_cart` ─► `purchase (order_type=team_roster)`.

## 2. Sự kiện (code: `apps/web/src/lib/track.ts`)
| Event GA4 | Khi nào | Tham số | Pixel |
|---|---|---|---|
| `group_create` | Studio → Hoàn tất → "Tạo link gom đơn nhóm" thành công | `product_slug`, `personalized` (có ô tên/số) | `GroupCreate` (custom) |
| `group_share` | Trưởng nhóm bấm Chia sẻ / Sao chép link | `method` = share \| copy | – |
| `group_view` | Mở trang `/nhom/<mã>` (1 lần/mã/phiên) | `role` = leader \| member, `members_bucket` | – |
| `group_join` | Ghi danh thành công | `role`, `qty`, `members_bucket` | `GroupJoin` (chỉ member) |
| `group_close` | Trưởng nhóm chốt danh sách | `members`, `members_bucket` | – |
| `group_checkout` | Trưởng nhóm bấm đặt đơn cho cả nhóm | `members`, `members_bucket`, `value` | – |
| `roster_upload` | Nạp danh sách ở tab "Đặt cho nhóm" | `method` = xlsx \| csv \| paste, `rows`, `rows_bucket`, `has_errors` | – |
| `purchase` | Đặt đơn thành công (đã có) | **mới:** `order_type` = single \| team_roster \| group_link | `Purchase` + `content_category` |
| `resource_download` | Tải file mẫu danh sách | `file_name`, `page` | `ResourceDownload` |

`members_bucket` / `rows_bucket`: 0 · 1-9 · 10-29 · 30-49 · 50-99 · 100+ (khớp mốc giá 10/30/50/100).

**Lưu cùng đơn (không phụ thuộc trình chặn quảng cáo):** trường `utm` của đơn có thêm `order_type` và `group` (mã nhóm) → xem ở CMS › Đơn hàng › chi tiết. Telegram báo đơn mới có dòng "👥 Đặt từ link nhóm /nhom/<mã>".

**Đo lan truyền:** link gửi thành viên có `?utm_source=nhom&utm_medium=share&utm_campaign=gom-don-nhom`. Thành viên lần đầu vào web qua link nhóm, sau này tự đặt đơn khác → đơn đó ghi nguồn `nhom`. Link quản lý của trưởng nhóm không đổi.

## 3. Cấu hình GA4 (chủ shop làm 1 lần, ~15 phút)
1. **Admin › Custom definitions › Create custom dimension** (Event scope):
   `order_type`, `role`, `method`, `members_bucket`, `rows_bucket`, `personalized`, `has_errors`, `product_slug`.
   Custom metric (Event scope): `members`, `rows`, `qty`.
2. **Admin › Events → đánh dấu Key event:** `group_create`, `group_join`, `purchase`, `generate_lead` (đã có).
3. **Explore › Funnel exploration** – "Phễu đơn nhóm", mở (open funnel), các bước:
   `group_create` → `group_view` (role = member) → `group_join` (role = member) → `group_checkout` → `purchase` (order_type = group_link).
   Breakdown: `members_bucket` hoặc Session source/medium.
4. **Meta Events Manager:** tạo Custom Conversion từ `GroupCreate` (tối ưu quảng cáo cho trưởng nhóm khi chưa đủ Purchase).
5. GA4 chỉ hiện tham số mới sau khi tạo custom dimension; dữ liệu cũ trước đó không hồi tố.

## 4. Đọc số và ra quyết định (sau 4–6 tuần hoặc ≥ 30 nhóm)
| Tỷ lệ | Câu hỏi | Nếu thấp → thử |
|---|---|---|
| view(member) / create | Trưởng nhóm có gửi link không? | Nút chia sẻ Zalo nổi hơn; mẫu tin nhắn gửi nhóm |
| join / view(member) | Thành viên vào rồi có ghi danh không? | Rút gọn form; giải thích size; hạn chót hiển thị rõ |
| checkout / create | Nhóm có đi tới đặt đơn không? | Nhắc trưởng nhóm (Zalo) khi nhóm ≥ 10 người; hiện giá bậc tiếp theo |
| purchase(group_link) / checkout | Rơi ở thanh toán? | Xem lỗi checkout, phí ship, VietQR |
| `roster_upload` has_errors = true | File khách bị lỗi? | Sửa hướng dẫn / bộ đọc file |

Chưa có bậc giá trong CMS thì `price.next` ("Thêm N cái nữa → giá X") không hiện – đo trước/sau khi nhập bậc giá để thấy tác động.

## 5. Kiểm tra sau deploy
- GA4 › Admin › DebugView (bật Tag Assistant): tạo 1 nhóm thử → thấy `group_create`; mở link nhóm bằng tab ẩn danh → `group_view` role=member; ghi danh → `group_join`.
- Đặt 1 đơn thử từ nhóm (COD, rồi huỷ trong CMS) → CMS hiện `order_type: group_link`, `group: <mã>`; Telegram có dòng 👥.
