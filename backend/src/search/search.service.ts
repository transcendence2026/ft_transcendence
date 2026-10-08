import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryDto } from './dto/search-query.dto';

export interface RestaurantRating {
  id: string;
  name: string;
  cuisine: string;
  priceRange: number;
  avgRating: number | null; // null when the restaurant has no reviews yet
  reviewCount: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async getRestaurantsWithRating(minRating?: number): Promise<RestaurantRating[]> {
    // HAVING filters on the aggregate, so it can't go in WHERE
    const having =
      minRating !== undefined
        ? Prisma.sql`HAVING AVG(rev.rating) >= ${minRating}`
        : Prisma.empty;

    return this.prisma.$queryRaw<RestaurantRating[]>(Prisma.sql`
      SELECT
        r.id,
        r.name,
        r.cuisine::text            AS cuisine,
        r."priceRange",
        AVG(rev.rating)::float8    AS "avgRating",
        COUNT(rev.id)::int         AS "reviewCount"
      FROM "Restaurant" r
      LEFT JOIN "Dish"   d   ON d."restaurantId" = r.id
      LEFT JOIN "Review" rev ON rev."dishId" = d.id
      GROUP BY r.id
      ${having}
      ORDER BY r."createdAt" DESC, r.id DESC
    `);
  }

  // Temporary: only wires minRating. Filters + cursor come next.
  async search(query: SearchQueryDto) {
	const results = await this.getRestaurantsWithRating(query.rating);
	return {
		results, nextCursor: null
	};
  }
}