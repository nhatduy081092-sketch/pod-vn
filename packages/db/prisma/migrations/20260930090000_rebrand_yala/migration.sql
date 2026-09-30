-- Đổi thương hiệu OEM Group -> YALA trong nội dung landing (bảng Setting, key 'landing').
-- Chỉ thay các trường CÒN GIỮ NGUYÊN giá trị mặc định cũ; trường admin đã tự sửa trong CMS được giữ nguyên.
-- Không đụng hotline, Zalo, email, địa chỉ, tên công ty, MST, tài khoản ngân hàng (thông tin pháp lý thật).

CREATE OR REPLACE FUNCTION pg_temp.yala_set(j jsonb, p text[], old_vals text[], new_val jsonb) RETURNS jsonb AS $$
  SELECT CASE WHEN (j #>> p) = ANY(old_vals) THEN jsonb_set(j, p, new_val, true) ELSE j END
$$ LANGUAGE sql IMMUTABLE;

UPDATE "Setting" SET value = t.v, "updatedAt" = NOW()
FROM (
  SELECT key,
    pg_temp.yala_set(pg_temp.yala_set(pg_temp.yala_set(pg_temp.yala_set(pg_temp.yala_set(pg_temp.yala_set(
    pg_temp.yala_set(pg_temp.yala_set(pg_temp.yala_set(pg_temp.yala_set(pg_temp.yala_set(pg_temp.yala_set(
      value,
      '{brand,name}', ARRAY['OEM Group','PODViet'], '"YALA"'),
      '{brand,tagline}', ARRAY['Sáng tạo ý tưởng và giải pháp merchandise, hàng khuyến mãi và quà tặng doanh nghiệp – nay in áo theo yêu cầu từ 1 chiếc.'],
        '"Tự thiết kế áo, túi, phụ kiện theo ý bạn ngay trên web – xem trước tức thì, in từ 1 chiếc, giao toàn quốc."'),
      '{brand,logoUrl}', ARRAY['https://oemgroup.vn/wp-content/uploads/2025/04/cropped-oem-fav-icon-1.png'], '""'),
      '{brand,website}', ARRAY['https://oemgroup.vn'], '"https://yala.vn"'),
      '{b2b,eyebrow}', ARRAY['OEM GROUP · GIẢI PHÁP DOANH NGHIỆP'], '"YALA · GIẢI PHÁP DOANH NGHIỆP"'),
      '{hero,tag}', ARRAY['Xu hướng POD mới · OEM Group','Xu hướng POD mới · PODViet'], '"YALA Studio · Tự thiết kế theo ý bạn"'),
      '{hero,title}', ARRAY['IN TOÀN THÂN'], '"TỰ THIẾT KẾ"'),
      '{hero,badge}', ARRAY['Thiết kế theo yêu cầu'], '"Miễn phí thiết kế"'),
      '{hero,ctaHref}', ARRAY['#hot-sale'], '"/thiet-ke"'),
      '{topBanner,line4}', ARRAY['IN TỪ 1 CHIẾC – KHÔNG CẦN ĐẶT SỐ LƯỢNG LỚN.'], '"TỰ THIẾT KẾ ONLINE – IN TỪ 1 CHIẾC."'),
      '{whyChoose,title}', ARRAY['Vì sao chọn OEM Group?','Vì sao chọn PODViet?'], '"Vì sao chọn YALA?"'),
      '{seo,title}', ARRAY['OEM Group – In áo theo yêu cầu, in toàn thân & đồng phục doanh nghiệp'],
        '"YALA – Tự thiết kế áo, in theo yêu cầu từ 1 chiếc"') AS v
  FROM "Setting" WHERE key = 'landing'
) t
WHERE "Setting".key = t.key;

-- Mô tả SEO + 5 bước quy trình: chỉ thay khi vẫn là nội dung mặc định cũ
UPDATE "Setting" SET value = jsonb_set(value, '{seo,description}',
  '"Tự thiết kế áo thun, hoodie, đồng phục, túi và phụ kiện online với YALA Studio: thêm ảnh, chữ, in tên số từng người, xem trước tức thì. In từ 1 chiếc, COD toàn quốc."', true)
WHERE key = 'landing' AND value #>> '{seo,description}' = 'In áo thun, hoodie, pijama, sơ mi, đồ thể thao in toàn thân theo thiết kế riêng. In từ 1 chiếc, duyệt mockup miễn phí, COD toàn quốc.';

UPDATE "Setting" SET value = jsonb_set(value, '{steps}', '[
  {"title": "Chọn sản phẩm & mở YALA Studio", "color": "#A9D8F7"},
  {"title": "Thêm ảnh, chữ, mẫu có sẵn – xem trước ngay", "color": "#F79A9A"},
  {"title": "Đặt hàng & thanh toán COD / VietQR", "color": "#FF9A22"},
  {"title": "Xưởng in đúng file thiết kế & kiểm tra chất lượng", "color": "#D6A9F2"},
  {"title": "Đóng gói & giao hàng toàn quốc", "color": "#8BE3D3"}
]'::jsonb, true)
WHERE key = 'landing' AND value #>> '{steps,0,title}' = 'Chọn sản phẩm & tải thiết kế';

-- Topbanner trỏ tới trang thiết kế nếu vẫn là link mặc định
UPDATE "Setting" SET value = jsonb_set(value, '{topBanner,href}', '"/thiet-ke"', true)
WHERE key = 'landing' AND value #>> '{topBanner,href}' = '#hot-sale';
