-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "HymnStatus" AS ENUM ('Published', 'Draft', 'UnderReview', 'Archived');

-- AlterTable
ALTER TABLE "hymns" ADD COLUMN     "status" "HymnStatus" NOT NULL DEFAULT 'Published';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'Active';
