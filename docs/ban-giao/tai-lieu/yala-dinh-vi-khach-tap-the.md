# YALA – Định vị khách tập thể (11/10/2026)

## Quyết định (chủ shop chốt)
- **Khách chính**: tập thể – Doanh nghiệp, CLB & đội thể thao, Hội nhóm/lớp/gia đình, Team building & sự kiện.
- **Khách lẻ**: vẫn mua được (từ 1 sản phẩm) nhưng đưa xuống cuối trang chủ, không quảng bá.
- **Đơn nhóm**: từ **10 sản phẩm**. Ít hơn vẫn đặt được, tính như mua lẻ.
- **Cách mua**: cả hai – giá hiện ngay + đặt online cho đơn vừa; đơn lớn/đặc biệt gửi yêu cầu báo giá (Zalo).
- **Giá bậc thang**: chưa đặt – chủ shop tự nhập trong CMS (Sản phẩm → Giá theo số lượng). Web tự hiện bảng giá khi sản phẩm có bậc giá.

## Đã triển khai (commit 968de6e)
| Phần | Nội dung |
|---|---|
| Trang chủ | Hero áo nhóm (minh hoạ áo in tên/số) → 4 lối vào theo nhóm khách → 4 bước đặt áo nhóm → Doanh nghiệp → Từ ảnh thành áo → Đánh giá → Cam kết → Khu mua lẻ |
| Trang mới | `/dong-phuc-the-thao`, `/ao-nhom`, `/team-building` + `/doanh-nghiep` (giữ, thêm liên kết chéo) |
| Menu | Áo nhóm: CLB thể thao · Hội nhóm & lớp · Team building · Tự thiết kế · Mẫu có sẵn · Mua lẻ · Doanh nghiệp (mega menu) |
| Trang sản phẩm | Tab **Đặt cho nhóm** mở sẵn với áo; gợi ý tạo link gom đơn; nhắc "thêm X áo để thành đơn nhóm" |
| Studio | Nút **Tạo link gom đơn nhóm** hiện rõ trong bảng Hoàn tất |
| SEO | Tiêu đề/mô tả mới; sitemap có 4 trang nhóm khách; FAQ schema trên trang nhóm |
| Cài đặt live | Cập nhật 1 lần (flag `update:group-pivot:2026-10-11`): SEO, tiêu đề trang DN, điều kiện "Đơn nhóm từ 10" – chỉ thay câu chữ còn giống mặc định cũ |

Nội dung từng nhóm khách nằm trong `packages/shared/src/segments.ts` (chưa sửa được trong CMS).

## Việc tiếp theo nên làm
1. Nhập **bậc giá theo số lượng** cho dòng YALA Everyday (10 / 30 / 50 / 100).
2. Chụp **ảnh thật áo nhóm** (đội bóng, lớp, team building) thay ảnh minh hoạ.
3. Thêm **case thật** vào CMS (Doanh nghiệp → Dự án đã làm).
4. Cân nhắc **áo thi đấu thun lạnh/mè** – nhóm thể thao hỏi nhiều, hiện chỉ báo giá theo yêu cầu.
5. Quảng cáo: tách chiến dịch theo nhóm khách, landing về đúng trang nhóm (đo lead form + đơn nhóm).
