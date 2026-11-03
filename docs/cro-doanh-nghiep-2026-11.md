# Rà soát chuyển đổi trang yala.vn/doanh-nghiep – 02/11/2026

Skill: marketing-suite / cro (+ references/form.md). Bối cảnh: `.agents/product-marketing.md`.
Nguồn: trang production (chụp 1440 và 390), mã `apps/web/src/app/doanh-nghiep/page.tsx`, `components/b2b/B2BQuoteForm.tsx`.
Chưa sửa gì trên web. Mọi thay đổi cần chủ shop duyệt trước khi push.

## Tóm tắt

- **Loại trang:** trang đích dịch vụ B2B.
- **Hành động chính:** gửi form "Nhận báo giá". Hành động phụ: chat Zalo.
- **Khách mục tiêu:** leader, HR, chủ doanh nghiệp đặt cho tổ đội.
- **Đánh giá chung:** trang đã tốt.
  - Điều kiện đặt hàng nói rõ ngay đầu trang.
  - Có bảng so sánh với cách đặt merch thông thường, có hỏi đáp.
  - Có 6 nút "Nhận báo giá" theo dịp, tự điền sẵn dịp vào form.
  - Form chỉ bắt buộc 2 trường, có bẫy chống spam.
  - Có sự kiện đo lường `lead` (b2b_quote). Sau khi gửi có nút chuyển sang Zalo.
- **Ba chỗ yếu nhất:**
  1. Trang thiếu bằng chứng uy tín.
  2. Form nằm rất sâu trên điện thoại.
  3. Cụm nút nổi che nội dung trên điện thoại.

## Số đo

| | Máy tính 1440 | Điện thoại 390 |
|---|---|---|
| Chiều cao trang | 8.363 px (khoảng 9 màn hình) | 13.616 px (khoảng 16 màn hình) |
| Form báo giá bắt đầu ở | 6.345 px (màn hình thứ 8) | 9.846 px (màn hình thứ 12) |
| Số trường form | 9 trường, 9 nút chọn ngành, 1 ô mô tả; chỉ 2 trường bắt buộc | như máy tính, xếp một cột |
| Nút nổi góc phải | 3 nút (Gọi lại, Messenger, Zalo) | 4 nút, cao khoảng 230 px, che chữ và ô chọn |

## Làm ngay (dễ, tác động rõ)

1. **Đưa 4 con số uy tín lên trang.**
   - Hiện trạng: 15+ năm, 500+ thương hiệu, tiết kiệm 20%, lưu kho 60 ngày chỉ có ở trang chủ. Trên /doanh-nghiep, phần đầu trang dùng "điều kiện đặt hàng" (`hub.terms`) thay cho các con số này (page.tsx dòng 96).
   - Đề xuất: thêm một dải 4 con số ngay dưới phần đầu trang hoặc cạnh form.
   - Lý do: người duyệt ngân sách cần lý do để tin trước khi để lại số điện thoại.
2. **Điền "Khách hàng tiêu biểu" trong CMS** (Cài đặt → Khối giải pháp doanh nghiệp).
   - Khối "Đã đồng hành cùng" đã có sẵn trong mã, chỉ hiện khi mục này có dữ liệu. Hiện mục đang trống.
   - Chỉ điền khách đã đồng ý cho nêu tên. Việc này không cần sửa mã.
3. **Ghi rõ thời gian phản hồi** cạnh nút gửi và trong thông báo gửi thành công.
   - Hiện chỉ ghi "trong giờ làm việc".
   - Cần chủ shop chốt con số thật, ví dụ "trong 2 giờ làm việc".
4. **Sửa chỗ nói và làm không khớp về file logo.**
   - Bước 1 trong quy trình ghi "Gửi nhu cầu: … file logo", nhưng form không có ô tải logo.
   - Cách nhanh: thêm dòng "Gửi logo qua Zalo sau khi gửi form để nhận mockup nhanh hơn". Màn hình gửi thành công đã có sẵn nút Zalo.
   - Cách đầy đủ: thêm ô tải logo (xem mục 8).
5. **Gọn nút nổi trên điện thoại.**
   - Hiện 4 nút tròn chồng nhau, che chữ ở đầu trang ("Xem ngay, miễn phí") và che ô chọn trong form.
   - Đề xuất trên điện thoại: chỉ giữ Zalo, hoặc thay cả cụm bằng một thanh dưới đáy (mục 6). Ẩn cụm nút khi form đang hiện trên màn hình.
6. **Sửa nhãn số liệu ở đầu trang cho dễ đọc.**
   - Ô "Hiện ngay trên web / Giá" và "Xem ngay, miễn phí / Mockup" đặt chữ to là một câu, chữ nhỏ là tên mục, nên đọc bị ngược.
   - Đề xuất: "Giá hiện ngay" / "trên web, đơn lớn báo riêng"; "Mockup miễn phí" / "xem trước khi đặt".

## Thay đổi lớn hơn (ưu tiên)

7. **Thanh "Nhận báo giá | Zalo" dính đáy màn hình trên điện thoại.**
   - Thanh hiện sau khi khách cuộn qua phần đầu trang và ẩn khi tới form.
   - Lý do: form ở màn hình thứ 12. Nút "Nhận báo giá" ở đầu trang đã cuộn mất, các nút theo dịp nằm rải rác.
   - Thanh này thay cho cụm nút nổi ở mục 5.
8. **Form hai bước.**
   - Bước 1: họ tên, SĐT/Zalo, dịp, số lượng dự kiến. Nút: "Nhận báo giá & mockup".
   - Bước 2, không bắt buộc, có thể bỏ qua: công ty, email, ngày cần hàng, ngân sách, ngành hàng, mô tả, tải logo.
   - Lý do: hiện chỉ 2 trường bắt buộc nhưng form trông như 10 câu hỏi. Trên điện thoại form dài khoảng 3 màn hình. Gửi bước 1 là đã có lead; bước 2 chỉ làm hồ sơ đầy đủ hơn.
   - Cách làm nhẹ hơn: giữ một bước, gom các trường không bắt buộc vào mục "Thêm chi tiết (không bắt buộc)" thu gọn sẵn.
9. **Báo lỗi ngay tại ô nhập.**
   - Hiện có một câu lỗi chung "Nhập họ tên và số điện thoại hợp lệ" nằm cuối form. Trên điện thoại câu này nằm ngoài màn hình khi khách bấm gửi.
   - Đề xuất: báo lỗi riêng dưới từng ô, tự chuyển con trỏ về ô sai đầu tiên, nói rõ cách sửa. Ví dụ: "Số điện thoại cần 10 số, bắt đầu bằng 0".
10. **Thông điệp theo mùa.**
    - Tết 2027 rơi vào ngày 06/02. Doanh nghiệp chốt quà Tết trong tháng 11 và 12.
    - Trang `/doanh-nghiep/qua-cuoi-nam` đã có sẵn. Từ giữa tháng 11, khi đợt 20/11 kết thúc, đề xuất:
      - đổi thanh trên cùng sang quà Tết;
      - thêm một dòng nhắc chốt sớm ngay dưới tiêu đề /doanh-nghiep, trỏ tới trang quà cuối năm.
    - Quảng cáo Tết nên trỏ về trang quà cuối năm, không trỏ về /doanh-nghiep.

## Nên thử nghiệm A/B, không nên đoán

- Nút đầu trang: "Nhận báo giá miễn phí" so với "Nhận báo giá & mockup trong [X] giờ". Cần chủ shop chốt con số X.
- Form một bước như hiện nay so với form hai bước (mục 8).
- Cụm nút nổi so với thanh dính đáy trên điện thoại (mục 7).
- Đưa form lên cao, ngay sau khối điều kiện đặt hàng, so với để ở cuối trang như hiện nay.
- Điều kiện để chạy thử: đủ lượt gửi mỗi nhánh. Nếu mỗi tuần dưới khoảng 20 lead thì cứ làm thay đổi rồi so số liệu trước và sau, không cần chia nhánh.

## Đo lường

- Đã có: sự kiện `lead` khi gửi thành công, sự kiện `contact` khi bấm Zalo hoặc gọi.
- Còn thiếu: sự kiện "bắt đầu điền form" (form_start). Không có sự kiện này thì không biết bao nhiêu người bỏ dở giữa chừng. Thêm sự kiện là thay đổi tracking nên cần chủ shop duyệt, và phải giữ nguyên tắc không để lỗi tracking làm hỏng việc gửi form.
- Báo cáo "Nguồn khách" trong CMS hiện chỉ đếm đơn hàng, chưa đếm lead báo giá theo nguồn.

## Lời văn thay thế

**Tiêu đề lớn.** Hiện tại: "Đồng phục công ty & quà tặng in logo – thấy mockup và giá ngay" (4 dòng trên điện thoại).
- A: "Đồng phục, quà in logo cho cả công ty – thấy mẫu và giá ngay". Ngắn hơn, nói "cả công ty" cho đúng người đặt cho tập thể.
- B: "Thấy mẫu và giá trước khi trình duyệt ngân sách". Nói đúng việc của HR hoặc leader phải xin duyệt; dòng phụ nói sản phẩm.
- C: "Đồng phục từ 10 áo, quà Tết in logo – một đầu mối, có VAT". Nêu đủ điều kiện ngay trong tiêu đề, hợp mùa Tết.

**Nút gửi form.** Hiện tại: "Gửi yêu cầu báo giá".
- "Nhận báo giá & mockup": nói khách nhận được gì, không nói việc khách phải làm.

**Dòng dưới nút.** Hiện tại: "Miễn phí tư vấn & mockup. Thông tin chỉ dùng để liên hệ báo giá."
- "Miễn phí tư vấn & mockup · Phản hồi trong [X] giờ làm việc · Không gửi tin quảng cáo". Cần chủ shop chốt X.

## Cần chủ shop cung cấp

- Thời gian phản hồi thật cho yêu cầu báo giá, để điền con số X.
- Danh sách khách doanh nghiệp được phép nêu tên.
- Có muốn thêm ô tải logo vào form không. Logo sẽ lưu cùng lead trong CMS.
