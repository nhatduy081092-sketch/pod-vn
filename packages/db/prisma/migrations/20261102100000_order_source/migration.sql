-- Nguồn khách của đơn (chỉ thêm cột có mặc định, không đụng dữ liệu cũ; đơn cũ để '' = chưa phân loại)
ALTER TABLE "Order" ADD COLUMN "sourceGroup" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "firstSourceGroup" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "referrerHost" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;
