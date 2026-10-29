import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { reverse } from "dns";
import { ReviewsController } from "../reviews/reviews.controller.js";
import { Cuisine } from "@prisma/client";

@Injectable()
export class RestaurantsService {
	constructor(private readonly prisma: PrismaService) {}

	async findOne(id: string) {
		const restaurant = await this.prisma.restaurant.findUnique({
			where: { id },
			include: {
				dishes: {
					orderBy: { name: 'asc' },
					include: {
						tags: { select: { id: true, name: true } },
						reviews: {
							orderBy: { createdAt: 'desc' },
							select: {
								id: true,
								rating: true,
								comment: true,
								createdAt: true,
								author: { select: { id: true, username: true } },
							},
						},
					},
				},
			},
		});

		if (!restaurant) {
			throw new NotFoundException('Restaurant not found');
		}

		const avg = (ratings: number[]) =>
			ratings.length
				? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
				: null;
		const dishes = restaurant.dishes.map((d) => ({
			id: d.id,
			name: d.name,
			description: d.description,
			price: d.price,
			tags: d.tags,
			avgRating: avg(d.reviews.map((r) => r.rating)),
			reviewCount: d.reviews.length,
		}));

		// Same definition as /api/search: average over all reviews of all dishes
		const allReviews = restaurant.dishes.flatMap((d) =>
			d.reviews.map((r) => ({ ...r, dishId: d.id, dishName: d.name})),
		);

		return {
			id: restaurant.id,
			name: restaurant.name,
			cuisine: restaurant.cuisine,
			priceRange: restaurant.priceRange,
			avgRating: avg(allReviews.map((r) => r.rating)),
			reviewCount: allReviews.length,
			dishes,
			recentReviews: allReviews
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
				.slice(0, 10),
		};
	}
}