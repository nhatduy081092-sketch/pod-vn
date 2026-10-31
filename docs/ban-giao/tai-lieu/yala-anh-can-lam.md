# YALA – ảnh còn thiếu + prompt Gemini (rà soát 31/10/2026)

Số liệu lấy từ web thật (`https://yala.vn/api/products`, `/api/home`, `/api/settings`).

## 1. Tình trạng ảnh

| Nhóm | Số lượng | Tình trạng |
|---|---|---|
| YALA Everyday (6 SP) | 6 | Ảnh phôi trơn thật – ổn |
| Phôi trơn Studio (6 dáng × 6 màu) | 36 | Đủ |
| Ảnh người mẫu Studio | 3/10 | **Thiếu 7**: áo thun đen, sweater trắng/đen, dài tay trắng/đen, tote trắng/đen |
| Sản phẩm từ OEM Group | **596** | Ảnh lấy thẳng từ oemgroup.vn, **nhiều ảnh in logo "OEM Group" trên sản phẩm** (VD túi tote có dây kéo) → trái quy tắc "không dùng tên/logo OEM như của YALA" |
| Sản phẩm in toàn thân (6 danh mục cũ) | 28 | Chỉ có hình vẽ SVG → đang **bị ẩn** khỏi web (CMS bật "chỉ hiện ảnh thật"), kể cả 6 SP gắn "Bán chạy" |
| Banner trang dịp lễ `/dip/...` | 5 | Dùng lại 3 ảnh `/showcase/*` (Halloween + Noel cùng 1 ảnh hoodie) |

Theo danh mục OEM: Balo – Túi 150 · Vali – Du lịch 126 · Bình nước – Ly cốc 101 · Đồng phục – May mặc 80 · Văn phòng phẩm 54 · Mũ nón – Ô dù 44 · Gia dụng 17 · Hộp quà – Giấy 16 · Đồ chơi 8.

Tên sản phẩm có chữ "OEM Group" (đổi tên trong CMS → Sản phẩm):
- `oem-group-goi-hoi` – "Gối hơi OEM Group êm ái…" → VD "Gối hơi du lịch êm ái, gấp gọn"
- `oem-group-vali-ve-nha` – "OEM GROUP vali Về Nhà" → VD "Vali quà tặng Về Nhà"

## 2. Thứ tự làm

1. **23 ảnh OEM đang hiện trên trang chủ** (bảng mục 3A) – khách thấy logo OEM ngay trang đầu.
2. **7 ảnh người mẫu** (mục 3B) – Studio "Xem trên người mẫu".
3. **5 banner dịp lễ** (mục 3C) – Tết 2027 và Noel trước.
4. Các SP OEM còn lại: làm dần theo danh mục bán nhiều. Làm tay ~2 phút/ảnh. Nếu chạy tự động bằng khoá API thì khoảng 0,04 USD/ảnh × ~570 ≈ 23 USD, **vượt hạn mức 3 USD** → cần chủ shop quyết.
5. 28 SP in toàn thân (mục 3D): đang ẩn, làm sau cùng hoặc bỏ.

Ảnh AI chỉ là **ảnh minh hoạ** – không dùng làm ảnh khách hàng/case study thật.

## 3. Prompt

Cách làm chung trong gemini.google.com: bấm **+** đính kèm ảnh gốc (nếu có) → dán prompt → gửi → chưa ưng thì nhắn thêm yêu cầu sửa → tải ảnh về.

### 3A. Ảnh sản phẩm OEM – xoá logo OEM, giữ nguyên sản phẩm

Ảnh gốc: mở trang sản phẩm trên yala.vn → bấm chuột phải vào ảnh → **Lưu ảnh** → đính kèm vào Gemini.

```
Edit the attached product photo. Remove every logo, emblem, brand name, slogan and text that is printed, embroidered, engraved or stuck on the product (including the "OEM Group" logo and the words "Original Equipment Manufacturing"). Fill those areas with the plain material of the product so it looks naturally blank, matching the exact color, texture, stitching, reflections, lighting and shadows. Keep everything else exactly the same: product shape, parts, colors, camera angle, size in frame, background and lighting. Do not add anything new. Square 1:1, same composition, photorealistic.
```

Nếu ảnh có nền rối hoặc nhiều sản phẩm, nhắn thêm: `Also make the background a clean seamless light grey (#f4f4f5) with a soft shadow.`

Đưa lên: CMS → **Sản phẩm** → tìm tên → ô ảnh → **Tải ảnh lên** (thay ảnh có nhãn cam "OEM") → Lưu. Ảnh tự tải lên được giữ nguyên khi đồng bộ lại OEM.

| # | Chỗ hiện trên trang chủ | Sản phẩm |
|---|---|---|
| 1 | Bán chạy | Cốc Sứ Quà Tặng Trụ Nắp Gỗ |
| 2 | Bán chạy | Pin Cài Áo Nhận Diện Thương Hiệu |
| 3 | Bán chạy | Cốc Quà Tặng Inox Không Nắp 02 |
| 4 | Bán chạy | Vali quà tặng Beatas JP20 |
| 5 | Bán chạy | Túi đeo chéo phụ kiện quà tặng Seliux F16 Fighting Falcon Messenger |
| 6 | Bán chạy | Bộ Quần Áo Bảo Hộ Đơn Sắc Tay Ngắn |
| 7 | Bán chạy | Vali Pisani CxO HF3020 |
| 8 | Bán chạy | Bình Rượu Quà Tặng Inox Kèm Túi Da |
| 9 | Bán chạy | Balo Trẻ Em Đầu Thú Hình Sóc |
| 10 | Doanh nghiệp | Áo Thun Thể Thao Cổ Tròn Tay Ngắn 10 |
| 11 | Doanh nghiệp | Áo Thun Thể Thao Cổ Tròn Tay Raglan 5 |
| 12 | Doanh nghiệp | Áo Thun Thể Thao Singlet 5 |
| 13 | Doanh nghiệp | Áo Thun Thể Thao Cổ Tròn Tay Ngắn 11 |
| 14 | Doanh nghiệp | Áo Thun Thể Thao Cổ Tròn Tay Ngắn 9 |
| 15 | Doanh nghiệp | Áo Thun Thể Thao Cổ Tròn Tay Ngắn Trẻ Em (cũng là ô danh mục Đồng phục) |
| 16 | Ô danh mục Balo – Túi | Túi Tote Có Dây Kéo 1 |
| 17 | Ô danh mục Bình nước | Quai Treo Bình Giữ Nhiệt Da Dập Nổi Logo |
| 18 | Ô danh mục Văn phòng phẩm | Kỷ Niệm Chương In 3D Phối Đế Gỗ Gác Điện Thoại |
| 19 | Ô danh mục Vali | Gối hơi OEM Group (đổi tên luôn) |
| 20 | Ô danh mục Gia dụng | Nến Thơm Nắp Gỗ – Hương Tùy Chỉnh |
| 21 | Ô danh mục Đồ chơi | Đồ Chơi Bút Sáp Màu Trẻ Em In Artwork Thiết Kế |
| 22 | Ô danh mục Mũ nón – Ô dù | Ảnh đại diện danh mục (ô dù gấp gọn) |
| 23 | Ô danh mục Hộp quà – Giấy | Ảnh đại diện danh mục (bộ lịch để bàn đế gỗ) |

Ô 22–23 sửa ở CMS → **Danh mục** → **Ảnh đại diện**.

Sản phẩm không in logo nào thì không cần làm lại – chỉ cần tải ảnh đó lên CMS để web không phụ thuộc oemgroup.vn.

### 3B. 7 ảnh người mẫu (Studio)

Đính kèm hình phôi `apps/api/assets/basic-src/<ô>.jpg` → dán prompt (thay `[MÀU]` và `[ÁO]`) → tải ảnh → CMS → **Ảnh thật AI** → ô tương ứng → **Tải ảnh lên** → kéo khung xanh vào ngực áo/mặt túi → **Lưu khung**.

| Ô | Đính kèm | [MÀU] | [ÁO] |
|---|---|---|---|
| Áo thun · Đen | `tshirt-den.jpg` | black | relaxed-fit short-sleeve crew-neck cotton T-shirt |
| Sweater · Trắng | `sweater-trang.jpg` | white | crew-neck cotton fleece sweatshirt |
| Sweater · Đen | `sweater-den.jpg` | black | crew-neck cotton fleece sweatshirt |
| Dài tay · Trắng | `longsleeve-trang.jpg` | white | relaxed-fit long-sleeve crew-neck cotton T-shirt |
| Dài tay · Đen | `longsleeve-den.jpg` | black | relaxed-fit long-sleeve crew-neck cotton T-shirt |

```
The attached image is a flat 2D illustration of the exact [MÀU] [ÁO] to show. Keep the same color, cut, neckline, sleeves, ribbing and proportions – do not add pockets, prints or details. Photorealistic e-commerce lifestyle photo of a young Vietnamese person (early 20s, natural friendly look) wearing this garment. Front view, standing straight, facing the camera, framed from mid-thigh to just above the head, arms relaxed at the sides so the chest area is completely unobstructed and flat. The garment is completely blank: no print, no logo, no text, no labels. Soft natural studio daylight, clean light warm-grey background, realistic fabric folds. Portrait 4:5.
```

Tote · Trắng (`tote-trang.jpg`, `[MÀU]` = white, người mẫu mặc đồ màu trung tính) và Tote · Đen (`tote-den.jpg`, `[MÀU]` = black, người mẫu mặc đồ màu sáng):

```
The attached image is a flat 2D illustration of the exact [MÀU] canvas tote bag to show. Keep the same color, shape, handles and proportions – do not add pockets, prints or details. Photorealistic e-commerce lifestyle photo of a young Vietnamese person (early 20s, natural friendly look, wearing simple clothes in a contrasting color) carrying this tote bag on the shoulder, bag facing the camera. Front view, standing straight, framed from mid-thigh to just above the head, so the front of the bag is completely unobstructed and flat. The bag is completely blank: no print, no logo, no text, no labels. Soft natural studio daylight, clean light warm-grey background, realistic canvas texture. Portrait 4:5.
```

### 3C. 5 banner trang dịp lễ (ngang 4:3)

Không cần đính kèm. Đưa lên: CMS → **Nội dung & vận chuyển** → khối Chiến dịch → dịp tương ứng → ô **Ảnh banner** → Tải ảnh lên → Lưu.

Câu chung đặt cuối mỗi prompt:

```
Photorealistic lifestyle photo, natural candid moment, warm soft light, shallow depth of field. Garments are plain cotton with only a small simple graphic on the chest – no readable text, no letters, no logos, no brand names, no watermark. Landscape 4:3.
```

**20/10** (`/dip/20-10`):
```
A young Vietnamese woman (mid 20s) smiling as she opens a gift on Vietnamese Women's Day: a white canvas tote bag and a white ceramic mug with a small floral print, a bouquet of pink roses and a kraft gift box on a light wooden table, cozy apartment by a window.
```

**Halloween** (`/dip/halloween`):
```
Four Vietnamese friends (early 20s) at a small Halloween house party wearing matching black hoodies with a small orange pumpkin graphic on the chest, laughing together, carved pumpkins and warm string lights in the background, evening mood with orange and purple accents.
```

**20/11** (`/dip/20-11`):
```
A group of Vietnamese university students (around 19–20) in matching white class T-shirts with a small simple leaf graphic on the chest, presenting a bouquet of flowers to their smiling middle-aged female teacher in a bright classroom on Vietnamese Teachers' Day.
```

**Noel** (`/dip/noel`):
```
A young Vietnamese couple (mid 20s) wearing matching red crew-neck sweatshirts with a small white snowflake graphic on the chest, sitting together by a decorated Christmas tree, holding two white mugs, small wrapped gifts around them, cozy warm living room.
```

**Tết 2027** (`/dip/tet-2027`):
```
A happy three-generation Vietnamese family (grandparents, parents and a young child) wearing matching red T-shirts with a small yellow apricot-blossom graphic on the chest, posing together at home for Lunar New Year, yellow apricot blossoms (hoa mai) and pink peach blossoms, red lanterns and a tray of Tết fruits in the background.
```

### 3D. 28 sản phẩm in toàn thân (đang ẩn – làm sau cùng)

Ảnh gốc là hình vẽ SVG: mở `https://yala.vn/mock/<tên>.svg` trên trình duyệt → chụp màn hình (Windows: Win+Shift+S) → đính kèm. Danh sách: CMS → Sản phẩm → lọc theo các danh mục Áo thun, Hoodie & Sweater, Pijama, Sơ mi & Polo, Đồ thể thao, Phụ kiện.

```
The attached image is a flat 2D illustration of the product "[TÊN SẢN PHẨM]". Recreate it as the SAME real physical product: keep the exact same all-over print pattern, motifs, colors, color placement, scale of the pattern and the same cut/shape. Do not invent new graphics, do not simplify or recolor the print. Photorealistic studio product photo in ghost-mannequin (invisible mannequin) style for garments, or standing naturally for accessories, front view, centered, realistic fabric texture, seams and natural folds, soft even studio lighting, seamless light grey (#f4f4f5) background with a soft shadow. Square 1:1 e-commerce catalog photo. No text, no letters, no logos, no watermark, no price tags, no hangers.
```

## 4. Lưu ý

- Ảnh Gemini có thể có logo ngôi sao nhỏ ở góc: chọn ảnh mà logo không đè lên sản phẩm, hoặc cắt bớt mép.
- Không đưa logo thương hiệu khác vào ảnh (Nike, Adidas…). Không ghi chữ lên áo trong prompt – Gemini hay viết sai chính tả tiếng Việt.
- Ảnh sản phẩm OEM sau khi xoá logo vẫn là ảnh của OEM chỉnh lại; khi xưởng gửi ảnh thật thì thay.
