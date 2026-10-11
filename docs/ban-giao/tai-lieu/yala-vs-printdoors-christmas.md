# Printdoors /activity/customChristmas vs YALA – vấn đề cần giải quyết (05/10/2026)

## Printdoors làm gì (quan sát trực tiếp trang)
1. Banner chiến dịch toàn màn hình "Christmas SALE – Hot selling list is ready" (ảnh trang trí cỡ lớn).
2. Biểu đồ chi tiêu mùa lễ của người tiêu dùng 2014–2023 (nội dung cho seller – lý do nên bán mùa này).
3. 3–4 thẻ sản phẩm nổi bật khung "kẹo gậy" Noel (hoodie, pijama, tất…).
4. Dải chữ "MERRY CHRISTMAS" chạy chéo, tab danh mục (Clothing / Home & Living / …).
5. Lưới sản phẩm giá chiến dịch + giá gạch, giảm đồng loạt ~20% (VD $9.68 ~~$12.10~~), gồm áo, tất, mũ len, ornament acrylic/pha lê/kim loại.
6. Chat tự bật che 1/3 màn hình; trang Vue render phía client (không có chữ khi chưa chạy JS → SEO yếu); cao ~7.700px, sản phẩm nằm sau 3 khối trang trí.

## So với YALA hiện tại
| Hạng mục | Printdoors | YALA | Vấn đề |
|---|---|---|---|
| Trang chiến dịch theo dịp | Có (/activity/…) | Không – chỉ có bộ sưu tập mẫu chữ + sản phẩm rời | Thiếu nơi gom mẫu + sản phẩm + ưu đãi + hạn chót cho 1 dịp |
| Lịch dịp VN | – | Chỉ có bộ "Tết & lì xì" | Thiếu 20/10, Halloween, 20/11, Black Friday, Noel, Tết 2027 |
| Giá chiến dịch | Giảm đồng loạt, giá gạch | Chỉ giảm giá từng sản phẩm (salePrice/saleEndsAt) | Không có % giảm theo chiến dịch, không đếm ngược |
| Hạn chót đặt hàng | Không | Không | Khách không biết đặt trước ngày nào để kịp dịp |
| Quà nhỏ cá nhân hoá (ornament, cốc, tất…) | Có, từ 1 cái | Sản phẩm OEM chủ yếu dành cho DN (có số lượng tối thiểu) | Thiếu quà tặng cá nhân giá rẻ từ 1 cái |
| Ảnh sản phẩm theo mùa | Ảnh mockup sản phẩm theo chủ đề | Phôi YALA vẫn là hình vẽ | Cùng nút thắt: chưa có ảnh phôi thật |
| SEO trang chiến dịch | Yếu (SPA) | Next.js SSR – lợi thế | Cần tận dụng: trang /dip/... có nội dung chữ, schema |

## Đề xuất (chưa phê duyệt)
1. **Hệ thống chiến dịch theo dịp** – CMS cấu hình: slug, màu chủ đề, hero, thời gian chạy, **hạn chót đặt hàng**, % giảm, bộ mẫu chữ, tab sản phẩm, FAQ. Route /dip/[slug] (20-10, halloween, 20-11, noel, tet-2027). Tự hiện banner trang chủ trong thời gian chạy.
2. **Bộ mẫu chữ theo mùa**: 20/10, Halloween, 20/11, Noel, Tết 2027 (6 mẫu/bộ).
3. **Hạn chót + đếm ngược**: "Đặt trước 16/10 để nhận trước 20/10" (tính từ thời gian sản xuất + giao).
4. **Nhánh doanh nghiệp trong chiến dịch**: quà cuối năm/Tết cho nhân viên – nhắc thời gian sản xuất dài hơn.
5. **Không học theo**: chat tự bật che nội dung, khối trang trí dài trước sản phẩm, ảnh PNG 1920px nặng.

## Ưu tiên theo lịch
- 20/10 (Phụ nữ VN): còn ~15 ngày – gấp nhất.
- Halloween 31/10, 20/11, Black Friday 27/11, Noel 24–25/12.
- Quà Tết DN 2027: chốt đơn trước giữa tháng 1/2027.
