-- Tìm kiếm không dấu + lọc nhóm con
ALTER TABLE "Product" ADD COLUMN     "searchText" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "subcategory" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "subcategorySlug" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Product_categoryId_subcategorySlug_idx" ON "Product"("categoryId", "subcategorySlug");
