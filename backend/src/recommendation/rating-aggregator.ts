import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class RatingAggregatorService {
  // Inject Prisma so we can query the database
  constructor(private readonly prisma: PrismaService) {}

  // Average rating and review count per dish — a single aggregated query
  async getDishRatings(dishIds?: string[])
  {
    // groupBy works directly because dishId already lives on Review
    return this.prisma.review.groupBy({
      by: ['dishId'], // group rows by dish
      where: dishIds ? { dishId: { in: dishIds } } : undefined, // optional filter to specific dishes
      _avg: { rating: true }, // compute the average rating per group
      _count: { rating: true }, // also count how many reviews make up that average
    });
  }

  // Average rating and review count per restaurant — needs raw SQL because
  // restaurantId is not directly on Review, we have to join through Dish
  async getRestaurantRatings(restaurantIds?: string[])
  {
    return this.prisma.$queryRaw<
      { restaurantId: string; avgRating: number; reviewCount: bigint }[]
    >`
      SELECT d."restaurantId",
             AVG(rv.rating)::float AS "avgRating",
             COUNT(rv.id)::int AS "reviewCount"
      FROM "Review" rv
      JOIN "Dish" d ON d.id = rv."dishId"
      ${restaurantIds?.length ? Prisma.sql`WHERE d."restaurantId" IN (${Prisma.join(restaurantIds)})` : Prisma.empty}
      GROUP BY d."restaurantId"
    `;
  }
}