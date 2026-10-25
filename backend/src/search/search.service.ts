import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js'; // adjust to your path
import { SearchQueryDto } from './dto/search-query.dto.js';

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

  async search(query: SearchQueryDto) {
    const { cuisine, price, rating, q, cursor, limit } = query;
    const conditions: Prisma.Sql[] = [];

    if (cuisine) {
      // The param travels as text, so cast it to the Postgres enum type
      conditions.push(Prisma.sql`r.cuisine = ${cuisine}::"Cuisine"`);
    }

    if (price !== undefined) {
      conditions.push(Prisma.sql`r."priceRange" = ${price}`);
    }

    if (q) {
      // Escape LIKE wildcards so "%" or "_" typed by the user are literal
      const pattern = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
      // EXISTS instead of filtering the main JOIN: otherwise only the matching
      // dishes would be averaged and avgRating would be distorted
      conditions.push(Prisma.sql`(
        r.name ILIKE ${pattern}
        OR EXISTS (
          SELECT 1 FROM "Dish" dq
          WHERE dq."restaurantId" = r.id AND dq.name ILIKE ${pattern}
        )
      )`);
    }

    if (cursor) {
      // Reject unknown cursors with a 400 instead of silently returning nothing 
      const exists = await this.prisma.restaurant.findUnique({
        where: { id: cursor },
        select: { id: true },
      });
      if (!exists) {
        throw new BadRequestException('Invalid cursor');
      }
      // Keyset pagination: everything strictly after the cursor row in the
      // order (createdAt DESC, id DESC). id breaks ties between equal createdAt
      conditions.push(Prisma.sql`(r."createdAt", r.id) < (
        SELECT c."createdAt", c.id FROM "Restaurant" c WHERE c.id = ${cursor}
        )`);
    }

    const where = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    // HAVING filters on the aggregate, so it can't go in WHERE
    const having =
      rating !== undefined
        ? Prisma.sql`HAVING AVG(rev.rating) >= ${rating}`
        : Prisma.empty;

    // Fetch one extra row to know if there is a next page
    const rows = await this.prisma.$queryRaw<RestaurantRating[]>(Prisma.sql`
      SELECT
        r.id,
        r.name,
        r.cuisine::text         AS cuisine,
        r."priceRange",
        AVG(rev.rating)::float8 AS "avgRating",
        COUNT(rev.id)::int      AS "reviewCount"
      FROM "Restaurant" r
      LEFT JOIN "Dish"   d   ON d."restaurantId" = r.id
      LEFT JOIN "Review" rev ON rev."dishId" = d.id
      ${where}
      GROUP BY r.id
      ${having}
      ORDER BY r."createdAt" DESC, r.id DESC
      LIMIT ${limit + 1}
    `);

    const hasMore = rows.length > limit;
    const results = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? results[results.length - 1].id : null;

    return { results, nextCursor };
  }
}