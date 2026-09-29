-- C. Khuyến mãi có hạn, hàng mới, phí ship theo cân nặng, thông báo
ALTER TABLE "Product" ADD COLUMN "salePrice" INTEGER,
ADD COLUMN "saleEndsAt" TIMESTAMP(3),
ADD COLUMN "newUntil" TIMESTAMP(3);

ALTER TABLE "Order" ADD COLUMN "shippingMethod" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN "weightGram" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT 'info',
    "showBanner" BOOLEAN NOT NULL DEFAULT false,
    "showOnProduct" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notice_isActive_startsAt_idx" ON "Notice"("isActive", "startsAt");
