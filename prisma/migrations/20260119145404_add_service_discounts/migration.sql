-- CreateEnum
CREATE TYPE "PromotionalBadge" AS ENUM ('SALE', 'NEW', 'POPULAR', 'HOT');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "customBadgeLabel" TEXT,
ADD COLUMN     "discountEndDate" TIMESTAMP(3),
ADD COLUMN     "discountStartDate" TIMESTAMP(3),
ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DECIMAL(10,2),
ADD COLUMN     "promotionalBadge" "PromotionalBadge";
