-- Đồng bộ sản phẩm từ nguồn ngoài (oemgroup.vn) + yêu cầu báo giá
ALTER TABLE "Product" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "sourceUrl" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Order" ADD COLUMN     "company" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isQuote" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Product_externalId_key" ON "Product"("externalId");
