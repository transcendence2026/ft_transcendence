/*
  Warnings:

  - The values [INGAME] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `losses` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `wins` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('OFFLINE', 'ONLINE');
ALTER TABLE "User" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'OFFLINE';
COMMIT;

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "losses",
DROP COLUMN "rating",
DROP COLUMN "wins";

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "favoriteCuisine" TEXT[],
    "spiceLevel" INTEGER NOT NULL DEFAULT 2,
    "preferredPriceMin" INTEGER NOT NULL DEFAULT 1,
    "preferredPriceMax" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Preference_userId_key" ON "Preference"("userId");

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
