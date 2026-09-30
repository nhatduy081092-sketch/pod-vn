-- Kho ảnh của tôi (khách hàng)
CREATE TABLE "CustomerAsset" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "label" TEXT NOT NULL DEFAULT '',
    "natW" INTEGER NOT NULL,
    "natH" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerAsset_customerId_url_key" ON "CustomerAsset"("customerId", "url");
CREATE INDEX "CustomerAsset_customerId_createdAt_idx" ON "CustomerAsset"("customerId", "createdAt");

ALTER TABLE "CustomerAsset" ADD CONSTRAINT "CustomerAsset_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
