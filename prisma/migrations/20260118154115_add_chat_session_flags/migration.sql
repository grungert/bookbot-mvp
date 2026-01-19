-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "isImportant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;
