-- A. Lõi dữ liệu: biến thể SKU (màu × size), vùng in theo mặt, thời gian SX + cân nặng theo sản phẩm

ALTER TABLE "Product" ADD COLUMN "productionDays" TEXT NOT NULL DEFAULT '',
ADD COLUMN "weightGram" INTEGER NOT NULL DEFAULT 300;

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '',
    "colorHex" TEXT NOT NULL DEFAULT '',
    "size" TEXT NOT NULL DEFAULT '',
    "sku" TEXT NOT NULL,
    "weightGram" INTEGER,
    "priceDelta" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintArea" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "widthMm" INTEGER NOT NULL,
    "heightMm" INTEGER NOT NULL,
    "dpi" INTEGER NOT NULL DEFAULT 150,
    "mockupImage" TEXT NOT NULL DEFAULT '',
    "maskImage" TEXT NOT NULL DEFAULT '',
    "overlayImage" TEXT NOT NULL DEFAULT '',
    "zoneX" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "zoneY" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "zoneW" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "zoneH" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "extraPrice" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PrintArea_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE INDEX "ProductVariant_productId_isActive_idx" ON "ProductVariant"("productId", "isActive");
CREATE UNIQUE INDEX "ProductVariant_productId_color_size_key" ON "ProductVariant"("productId", "color", "size");
CREATE UNIQUE INDEX "PrintArea_productId_key_key" ON "PrintArea"("productId", "key");

ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrintArea" ADD CONSTRAINT "PrintArea_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OrderItem: biến thể + thiết kế từ editor
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT,
ADD COLUMN "sku" TEXT NOT NULL DEFAULT '',
ADD COLUMN "design" JSONB;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill biến thể từ colors[] × sizes[] hiện có (mảng rỗng = 1 giá trị "")
INSERT INTO "ProductVariant" ("id", "productId", "color", "colorHex", "size", "sku", "priceDelta", "isActive", "sortOrder")
SELECT
    'pv' || substr(md5(p."id" || '|' || c.val || '|' || s.val), 1, 23),
    p."id",
    c.val,
    '',
    s.val,
    'SP-' || upper(substr(md5('sku|' || p."id" || '|' || c.val || '|' || s.val), 1, 10)),
    0,
    true,
    ((c.ord - 1) * 100 + s.ord)::int
FROM "Product" p
CROSS JOIN LATERAL unnest(CASE WHEN cardinality(p."colors") = 0 THEN ARRAY['']::text[] ELSE p."colors" END) WITH ORDINALITY AS c(val, ord)
CROSS JOIN LATERAL unnest(CASE WHEN cardinality(p."sizes") = 0 THEN ARRAY['']::text[] ELSE p."sizes" END) WITH ORDINALITY AS s(val, ord)
ON CONFLICT DO NOTHING;

-- Backfill vùng in:
-- * Sản phẩm in toàn thân (có mockShape): 1 mặt phủ kín theo mask dáng áo, 100 DPI
-- * Sản phẩm còn lại (in/thêu/khắc logo): 1 vị trí logo 10×10cm, 300 DPI – chỉnh lại trong CMS theo từng sản phẩm
INSERT INTO "PrintArea" ("id", "productId", "key", "name", "widthMm", "heightMm", "dpi", "mockupImage", "maskImage", "overlayImage", "zoneX", "zoneY", "zoneW", "zoneH", "extraPrice", "sortOrder")
SELECT
    'pa' || substr(md5('area|' || p."id"), 1, 23),
    p."id",
    CASE WHEN p."mockShape" <> '' THEN 'front' ELSE 'logo' END,
    CASE WHEN p."mockShape" <> '' THEN 'In toàn thân' ELSE 'Vị trí in logo' END,
    CASE WHEN p."mockShape" <> '' THEN 600 ELSE 100 END,
    CASE WHEN p."mockShape" <> '' THEN 700 ELSE 100 END,
    CASE WHEN p."mockShape" <> '' THEN 100 ELSE 300 END,
    '',
    CASE WHEN p."mockShape" <> '' THEN '/shapes/mask-' || p."mockShape" || '.svg' ELSE '' END,
    CASE WHEN p."mockShape" <> '' THEN '/shapes/line-' || p."mockShape" || '.svg' ELSE '' END,
    CASE WHEN p."mockShape" <> '' THEN 0 ELSE 0.35 END,
    CASE WHEN p."mockShape" <> '' THEN 0 ELSE 0.3 END,
    CASE WHEN p."mockShape" <> '' THEN 1 ELSE 0.3 END,
    CASE WHEN p."mockShape" <> '' THEN 1 ELSE 0.3 END,
    0,
    0
FROM "Product" p
ON CONFLICT DO NOTHING;
