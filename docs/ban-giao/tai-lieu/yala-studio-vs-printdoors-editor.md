# YALA Studio vs công cụ thiết kế Printdoors – kế hoạch & tiến độ (cập nhật 30/09/2026 tối)

Nguồn: mã giao diện công khai của Printdoors (`design.103e59af.js`, bộ từ điển giao diện `design.*` trong `app.98284444.js`), API công khai `basicProduct/5464`, `materialCategory`. Công cụ thiết kế phải đăng nhập mới xem được → **danh sách chức năng lấy từ các chữ hiển thị trong mã (FACT), còn bố cục là suy luận**.

## Quyết định của chủ dự án
- Sản phẩm: **mọi thứ in được**. Ngoài áo, làm cả 4 nhóm: tranh canvas/poster/lịch · cờ/banner/backdrop · cốc/bình/ốp điện thoại · gối/chăn/thảm/rèm.
- Mức giống: **chức năng + bố cục như Printdoors**, giữ phong cách YALA, dùng tốt trên điện thoại.
- Ưu tiên: lặp hoạ tiết, thư viện lớn, xử lý ảnh (seller đăng bán: **chưa làm**, tập trung khách lẻ).
- AI xử lý ảnh: **chạy trên máy khách (trình duyệt)**.
- Nội dung thư viện: tự thiết kế + mua gói có giấy phép in POD + tạo bằng AI rồi duyệt. **Không lấy hình của Printdoors.**
- Thông số thật từng loại sản phẩm: **chủ dự án bổ sung sau** (hiện dùng số tham khảo, sản phẩm tạo ra ở trạng thái ẩn).

## Chức năng Printdoors (FACT, theo chữ hiển thị trong mã)
- Tab trái: Product · Gallery · Text · Background · Layer. Full screen, Shortcut key (tự đặt), Design record, Recently designed products.
- Gallery: 60+ bộ, hơn 2.000 hình; lọc theo dáng ảnh; My gallery / Share gallery; nhãn; kiểm tra Tort + từ ngữ rủi ro; ≤50MB, ≤20.000px.
- Ảnh: Height/Width fill, Fill, Adapt, Center · Crop · Cut picture · Cut head · Clearly · Shade.
- Lặp: Foundation / Longitudinal / Transverse interleaving / Mirror / Random + X/Y spacing.
- Hướng dẫn in: safe area, stitching area, full-bleed. Kết thúc: Save product · Save and publish · Add to cart theo size.

## Giai đoạn 1 – ĐÃ DEPLOY (fac1464)
Vùng in theo size + viền tràn/vùng an toàn · lặp 5 kiểu · phủ ảnh 4 kiểu · cắt ảnh, 7 mặt nạ, xoá nền trên máy khách (BiRefNet lite MIT) · màu tự lưu/hút màu · tải ảnh 50MB + Kho ảnh của tôi + cảnh báo nhãn hiệu · phím tắt, toàn màn hình, lăn chuột · đổi sản phẩm trong editor, Đặt ngay theo size · gợi ý thiết kế từng mặt.

## Giai đoạn 2 – ĐÃ LÀM (1a484bf)
- Xem trước cốc/bình cuộn quanh thân (`PrintArea.warp = "cylinder"`), khung chỉnh "Bản phẳng" + ảnh xem trước nhỏ, tối đa 16 mặt in, chép lớp sang tất cả mặt.
- Công cụ Lịch: lịch tháng tiếng Việt + âm lịch + ngày lễ + can chi; "Cả năm" điền 12 mặt m01…m12.
- 12 mẫu loại sản phẩm (tranh canvas, poster, lịch 13 tờ, cờ, backdrop, cốc, bình, ốp, gối, chăn, thảm, rèm) + mockup SVG; CMS "Tạo theo loại" tạo sản phẩm ẨN.
- ⚠️ Thông số 12 mẫu là tham khảo – xưởng xác nhận, thay mockup bằng ảnh thật trước khi bán.

## Giai đoạn 3 – ĐÃ LÀM (4642374)
- DesignAsset: `source` (tự thiết kế / mua bản quyền / AI / đối tác), `license`, `status` (chờ duyệt / đã duyệt / từ chối) – migration `20260930160000_design_asset_source`. Khách chỉ thấy hình đã duyệt + đang hiện.
- CMS Thư viện: tải 100 hình/lần kèm nhóm, nguồn, giấy phép (bắt buộc với hình mua), từ khoá; hình AI mặc định chờ duyệt; lọc nhóm/nguồn/trạng thái/dáng; thao tác hàng loạt (duyệt, từ chối, ẩn/hiện, đổi nhóm, xoá); phân trang.
- Kế hoạch nội dung theo mùa: 14 dịp VN (Tết, Vu Lan, Trung thu quy đổi âm lịch), đếm hình mỗi nhóm, cảnh báo dịp trong 60 ngày còn < 20 hình; 11 nhóm quanh năm.
- Editor: lọc theo dáng ảnh (vuông/ngang/dọc/siêu ngang/siêu dọc), "Xem thêm" theo trang.
- Việc tiếp theo của chủ dự án: nạp nội dung (mục tiêu ≥ 20 hình mỗi dịp sắp tới; gần nhất 20/10, Halloween, 20/11, Giáng sinh, Tết 6/2/2027).

## Vận hành VPS
- Deploy: `cd /opt/yala && bash deploy/deploy.sh` (tự kiểm tra ổ đĩa ≥ 4GB, tự dọn cache build).
- Ổ cứng VPS 38GB dùng ~90% (nhiều web khác cùng máy) → nên nâng thêm ~20GB, hoặc chuyển sang build image trên GitHub Actions.
- SSL: yala.vn, www, admin.yala.vn (hết hạn 29/12/2026, tự gia hạn).

## Để sau
- Seller Lưu & đăng bán (Shopee/TikTok Shop), branding nhãn/bao bì, tách chân dung, làm nét AI, tự đặt phím tắt, tự host mô hình xoá nền (NEXT_PUBLIC_BG_MODEL_HOST), nhiều góc xem cho 1 mặt in, kho chia sẻ (share gallery).
