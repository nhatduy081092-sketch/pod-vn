-- P0: giá tham khảo "Từ …đ", giá sắp xếp, bảng size; xoá đánh giá mẫu
ALTER TABLE "Category" ADD COLUMN "sizeChart" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Product" ADD COLUMN "priceFrom" INTEGER,
ADD COLUMN "sortPrice" INTEGER,
ADD COLUMN "sizeChart" TEXT NOT NULL DEFAULT '';

UPDATE "Product" SET "sortPrice" = "basePrice" WHERE "basePrice" > 0;

CREATE INDEX "Product_sortPrice_idx" ON "Product"("sortPrice");

-- Đánh giá mẫu do seed tạo (nội dung bắt đầu bằng "[Nội dung mẫu]") – chỉ đăng review thật
DELETE FROM "Testimonial" WHERE "content" LIKE '[Nội dung mẫu]%';
