-- Lượt xem sản phẩm theo ngày (thuật toán bán chạy / phổ biến)
CREATE TABLE "ProductDailyStat" (
    "productId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductDailyStat_pkey" PRIMARY KEY ("productId","day")
);
CREATE INDEX "ProductDailyStat_day_idx" ON "ProductDailyStat"("day");
ALTER TABLE "ProductDailyStat" ADD CONSTRAINT "ProductDailyStat_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
