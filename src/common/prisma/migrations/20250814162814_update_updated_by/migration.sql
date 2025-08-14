-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "updatedBy" DROP DEFAULT;

-- AlterTable
ALTER TABLE "choruses" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "hymns" ALTER COLUMN "updatedBy" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updatedBy" DROP DEFAULT;

-- AlterTable
ALTER TABLE "verses" ALTER COLUMN "order" DROP NOT NULL;
