-- Gom đơn nhóm qua link (chỉ thêm bảng mới, không đụng dữ liệu cũ)
CREATE TABLE "GroupOrder" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '',
    "design" JSONB NOT NULL,
    "adminHash" TEXT NOT NULL,
    "deadline" TEXT NOT NULL DEFAULT '',
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GroupOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroupOrder_code_key" ON "GroupOrder"("code");
CREATE INDEX "GroupOrder_createdAt_idx" ON "GroupOrder"("createdAt");
ALTER TABLE "GroupOrder" ADD CONSTRAINT "GroupOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "person" TEXT NOT NULL,
    "printName" TEXT NOT NULL DEFAULT '',
    "number" TEXT NOT NULL DEFAULT '',
    "size" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT NOT NULL DEFAULT '',
    "editHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GroupMember_groupId_createdAt_idx" ON "GroupMember"("groupId", "createdAt");
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
