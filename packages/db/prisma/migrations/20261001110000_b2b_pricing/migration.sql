-- Giá B2B: lưu giá niêm yết của nguồn hàng + cờ giá chỉnh tay
ALTER TABLE "Product" ADD COLUMN "sourcePrice" INTEGER;
ALTER TABLE "Product" ADD COLUMN "priceManual" BOOLEAN NOT NULL DEFAULT false;
-- Sản phẩm đã nhập trước đây: giá bán đang chính là giá nguồn lúc nhập
UPDATE "Product" SET "sourcePrice" = "basePrice" WHERE "externalId" LIKE 'oem:%' AND "basePrice" > 0;
