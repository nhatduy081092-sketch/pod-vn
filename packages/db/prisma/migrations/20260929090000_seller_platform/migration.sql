-- E. Seller dropship: hồ sơ seller, API key, mẫu sản phẩm, thanh toán gộp, webhook
CREATE TABLE "SellerProfile" (
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "companyName" TEXT NOT NULL DEFAULT '',
    "taxCode" TEXT NOT NULL DEFAULT '',
    "storeUrl" TEXT NOT NULL DEFAULT '',
    "channels" TEXT NOT NULL DEFAULT '',
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "brandName" TEXT NOT NULL DEFAULT '',
    "labelImage" TEXT NOT NULL DEFAULT '',
    "webhookUrl" TEXT NOT NULL DEFAULT '',
    "webhookSecret" TEXT NOT NULL DEFAULT '',
    "adminNote" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("customerId")
);
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ApiKey_hash_key" ON "ApiKey"("hash");
CREATE INDEX "ApiKey_customerId_idx" ON "ApiKey"("customerId");
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SellerProduct" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "design" JSONB NOT NULL,
    "previewUrl" TEXT NOT NULL DEFAULT '',
    "retailPrice" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerProduct_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SellerProduct_sellerId_code_key" ON "SellerProduct"("sellerId", "code");
CREATE INDEX "SellerProduct_sellerId_createdAt_idx" ON "SellerProduct"("sellerId", "createdAt");
ALTER TABLE "SellerProduct" ADD CONSTRAINT "SellerProduct_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerProduct" ADD CONSTRAINT "SellerProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PaymentBatch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentBatch_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PaymentBatch_code_key" ON "PaymentBatch"("code");
CREATE INDEX "PaymentBatch_sellerId_createdAt_idx" ON "PaymentBatch"("sellerId", "createdAt");
ALTER TABLE "PaymentBatch" ADD CONSTRAINT "PaymentBatch_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "ok" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WebhookDelivery_sellerId_createdAt_idx" ON "WebhookDelivery"("sellerId", "createdAt");

ALTER TABLE "Order" ADD COLUMN "sellerId" TEXT,
ADD COLUMN "externalId" TEXT,
ADD COLUMN "codAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "whiteLabel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "batchId" TEXT;
CREATE UNIQUE INDEX "Order_sellerId_externalId_key" ON "Order"("sellerId", "externalId");
CREATE INDEX "Order_sellerId_createdAt_idx" ON "Order"("sellerId", "createdAt");
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PaymentBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
