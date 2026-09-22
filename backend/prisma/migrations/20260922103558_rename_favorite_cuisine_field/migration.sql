/*
  Warnings:

  - You are about to drop the column `favoriteCuisine` on the `Preference` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Preference" DROP COLUMN "favoriteCuisine",
ADD COLUMN     "favoriteCuisines" TEXT[];
