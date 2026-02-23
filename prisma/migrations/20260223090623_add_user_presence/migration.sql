-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "invoicePath" TEXT;

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "adminEmail" TEXT,
ADD COLUMN     "bkashNumber" TEXT,
ADD COLUMN     "nagadNumber" TEXT,
ADD COLUMN     "paymentBkashOn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "paymentCardOn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "paymentNagadOn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "siteName" TEXT NOT NULL DEFAULT 'Thread Haus';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "image" TEXT,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSeen" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "orderId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editor_activities" (
    "id" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editor_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "editor_activities_editorId_idx" ON "editor_activities"("editorId");

-- CreateIndex
CREATE INDEX "editor_activities_createdAt_idx" ON "editor_activities"("createdAt");

-- AddForeignKey
ALTER TABLE "editor_activities" ADD CONSTRAINT "editor_activities_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editor_activities" ADD CONSTRAINT "editor_activities_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
