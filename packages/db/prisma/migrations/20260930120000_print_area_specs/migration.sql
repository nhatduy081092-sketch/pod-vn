-- Mặt in: viền tràn, vùng an toàn, kích thước theo size, gợi ý thiết kế (chỉ thêm cột, có giá trị mặc định)
ALTER TABLE "PrintArea" ADD COLUMN "bleedMm" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PrintArea" ADD COLUMN "safeMm" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PrintArea" ADD COLUMN "sizeSpecs" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "PrintArea" ADD COLUMN "tips" TEXT NOT NULL DEFAULT '';
