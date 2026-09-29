-- Thư viện thiết kế: clipart + mẫu dựng sẵn cho công cụ thiết kế
CREATE TABLE "DesignAsset" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "natW" INTEGER NOT NULL DEFAULT 0,
    "natH" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DesignAsset_kind_isActive_sortOrder_idx" ON "DesignAsset"("kind", "isActive", "sortOrder");
