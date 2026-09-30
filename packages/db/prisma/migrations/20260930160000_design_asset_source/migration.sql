-- Thư viện thiết kế: nguồn nội dung, giấy phép, trạng thái duyệt (hình cũ coi như đã duyệt)
ALTER TABLE "DesignAsset" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'SELF';
ALTER TABLE "DesignAsset" ADD COLUMN "license" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DesignAsset" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'APPROVED';
CREATE INDEX "DesignAsset_status_idx" ON "DesignAsset"("status");
