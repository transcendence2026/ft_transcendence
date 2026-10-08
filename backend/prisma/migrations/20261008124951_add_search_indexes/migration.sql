-- DropIndex
DROP INDEX "Review_dishId_idx";

-- CreateIndex
CREATE INDEX "Restaurant_cuisine_priceRange_idx" ON "Restaurant"("cuisine", "priceRange");

-- CreateIndex
CREATE INDEX "Restaurant_createdAt_id_idx" ON "Restaurant"("createdAt", "id");

-- CreateIndex
CREATE INDEX "Review_dishId_rating_idx" ON "Review"("dishId", "rating");
