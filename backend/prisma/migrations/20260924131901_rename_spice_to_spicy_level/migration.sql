/*
  Warnings:

  - You are about to drop the column `spiceLevel` on the `Preference` table. All the data in the column will be lost.
  - The `favoriteCuisines` column on the `Preference` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `cuisine` on the `Restaurant` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Cuisine" AS ENUM ('ITALIAN', 'JAPANESE', 'MEXICAN', 'INDIAN', 'FRENCH', 'SPANISH', 'THAI', 'AMERICAN', 'MEDITERRANEAN', 'CHINESE', 'KOREAN', 'VIETNAMESE');

-- AlterTable
ALTER TABLE "Preference" DROP COLUMN "spiceLevel",
ADD COLUMN     "spicyLevel" INTEGER NOT NULL DEFAULT 2,
DROP COLUMN "favoriteCuisines",
ADD COLUMN     "favoriteCuisines" "Cuisine"[];

-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "cuisine",
ADD COLUMN     "cuisine" "Cuisine" NOT NULL;

-- CreateTable
CREATE TABLE "PostImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "PostImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostImage_postId_idx" ON "PostImage"("postId");

-- AddForeignKey
ALTER TABLE "PostImage" ADD CONSTRAINT "PostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
