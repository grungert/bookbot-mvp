-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "businessAddress" TEXT,
ADD COLUMN     "businessEmail" TEXT,
ADD COLUMN     "businessPhone" TEXT,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "taxRate" DECIMAL(5,2) DEFAULT 20.00,
ADD COLUMN     "vatNumber" TEXT;
