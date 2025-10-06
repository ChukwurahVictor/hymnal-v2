/*
  Warnings:

  - You are about to drop the column `updatedBy` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `choruses` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `hymns` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `verses` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "hymns" DROP CONSTRAINT "hymns_categoryId_fkey";

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "entityId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "updatedBy",
ADD COLUMN     "updatedById" UUID;

-- AlterTable
ALTER TABLE "choruses" DROP COLUMN "updatedBy",
ADD COLUMN     "createdById" UUID,
ADD COLUMN     "updatedById" UUID;

-- AlterTable
ALTER TABLE "hymns" DROP COLUMN "updatedBy",
ADD COLUMN     "updatedById" UUID,
ALTER COLUMN "categoryId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "solfa_images" ADD COLUMN     "createdById" UUID,
ADD COLUMN     "updatedById" UUID;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy";

-- AlterTable
ALTER TABLE "verses" DROP COLUMN "updatedBy",
ADD COLUMN     "createdById" UUID,
ADD COLUMN     "updatedById" UUID;

-- AddForeignKey
ALTER TABLE "hymns" ADD CONSTRAINT "hymns_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hymns" ADD CONSTRAINT "hymns_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choruses" ADD CONSTRAINT "choruses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choruses" ADD CONSTRAINT "choruses_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verses" ADD CONSTRAINT "verses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verses" ADD CONSTRAINT "verses_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solfa_images" ADD CONSTRAINT "solfa_images_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solfa_images" ADD CONSTRAINT "solfa_images_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
