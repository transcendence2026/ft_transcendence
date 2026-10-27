import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PreferenceVectorizer } from './preference-vectorizer.js';
import { cosineSimilarity } from './cosine-similarity.js';
import { Cuisine } from '@prisma/client';

export interface DishRecommendation {
	id: string;
	name: string;
	description: string | null;
	price: number;
	restaurant: { id: string; name: string; cuisine: string; priceRange: number };
	tags: string[];
	score: number; // cosine similarity, 0..1
  source: 'personalized' | 'top-rated'; // the Bayesian average divided by 5 for top-rated
}

export interface SimilarFriend {
	id: string;
	username: string;
	score: number;
}

// Weight of the prior in the Bayesian average: a dish needs about this many
// reviews befor its own averagecounts as much as the global mean
const COLD_START_PRIOR_WEIGHT = 3;

// Same relations for every dish query
const DISH_INCLUDE = {
  restaurant: { select: { id: true, name: true, cuisine: true, priceRange: true } },
  tags: { select: { name: true } },
} as const;

@Injectable()
export class RecommendationService {
	constructor(private readonly prisma: PrismaService) {}

	/** Dishes ranked by cosine similarity to the user's preference vector */
	async getDishRecommendations(userId: string, limit = 10): Promise<DishRecommendation[]> {
		const preference = await this.prisma.preference.findUnique({ where: { userId } });
		// Cold Start: no preferences to compare, fall back to the best-rated dishes
		if (!preference) return this.getTopRatedDishes(userId, limit);

		const userVector = PreferenceVectorizer.toVector(preference);
		const reviewedIds = await this.getReviewedDishIds(userId);

    const dishes = await this.prisma.dish.findMany({
      where: { id: { notIn: reviewedIds } },
      include: DISH_INCLUDE,
    });

    return dishes
      .map((dish) => {
        const dishVector = PreferenceVectorizer.toDishVector({
          cuisine: dish.restaurant.cuisine,
          priceRange: dish.restaurant.priceRange,
          tags: dish.tags,
        });
        return this.toRecommendation(
          dish,
          cosineSimilarity(userVector, dishVector),
          'personalized',
        );
      })
      // Highest score first; name as a stable tie-breaker
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, limit);
  }

  /** Cold start: best-rated dishes overall, ranked by Bayesian average */
  private async getTopRatedDishes(userId: string, limit: number): Promise<DishRecommendation[]> {
    const reviewedIds = await this.getReviewedDishIds(userId);

    const [overall, perDish] = await Promise.all([
      this.prisma.review.aggregate({ _avg: { rating: true} }),
      this.prisma.review.groupBy({
        by: ['dishId'],
        where: { dishId: { notIn: reviewedIds } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // Nothing reviewed yet: there is no evidence to rank by
    const globalMean = overall._avg.rating;
    if (globalMean === null || perDish.length === 0) {
      const fallbackDishes = await this.prisma.dish.findMany({
        where: { id: { notIn: reviewedIds } },
        take: limit,
        include: DISH_INCLUDE,
      });
      return fallbackDishes.map((dish) => this.toRecommendation(dish, 0.5, 'top-rated'));
    }

    const m = COLD_START_PRIOR_WEIGHT;
    const ranked = perDish
      .map((row) => {
        const v = row._count.rating;
        const avg = row._avg.rating ?? globalMean;
        return {
          dishId: row.dishId,
          reviews: v,
          bayes: (v / (v + m)) * avg + (m / (v + m)) * globalMean,
        };
      })
      .sort((a, b) => b.bayes - a.bayes || b.reviews - a.reviews)
      .slice(0, limit);
    
    const dishes = await this.prisma.dish.findMany({
      where: { id: { in: ranked.map((r) => r.dishId) } },
      include: DISH_INCLUDE,
    });
    const byId = new Map(dishes.map((d) => [d.id, d]));

    // Keep the ranking order; rating are 1-5, so /5 gives a 0..1 score
    return ranked.flatMap(({ dishId, bayes}) => {
      const dish = byId.get(dishId);
      return dish ? [this.toRecommendation(dish, bayes / 5, 'top-rated')] : [];
    });
  }

  /** Accepted friends ranked by taste similarity (blocked users excluded). */
  async getSimilarFriends(userId: string, limit = 5): Promise<SimilarFriend[]> {
    const preference = await this.prisma.preference.findUnique({ where: { userId } });
    if (!preference) return [];

    const userVector = PreferenceVectorizer.toVector(preference);

    const [friendships, blocks] = await Promise.all([
      this.prisma.friendship.findMany({
        where: { status: 'ACCEPTED', OR: [{ senderId: userId }, { receiverId: userId }] },
        select: { senderId: true, receiverId: true },
      }),
      this.prisma.block.findMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
        select: { blockerId: true, blockedId: true },
      }),
    ]);

    // A friendship is stored in one direction: take whichever side is not the user
    const blockedIds = new Set(
      blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)),
    );
    const friendIds = friendships
      .map((f) => (f.senderId === userId ? f.receiverId : f.senderId))
      .filter((id) => !blockedIds.has(id));
    if (friendIds.length === 0) return [];

    const friends = await this.prisma.user.findMany({
      where: { id: { in: friendIds }, preference: { isNot: null } },
      select: { id: true, username: true, preference: true },
    });

    return friends
      .flatMap((f) =>
        f.preference
          ? [{
              id: f.id,
              username: f.username,
              score: Number(
                cosineSimilarity(userVector, PreferenceVectorizer.toVector(f.preference)).toFixed(4),
              ),
            }]
          : [],
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Never recommend a dish the user already reviewed
  private async getReviewedDishIds(userId: string): Promise<string[]> {
    const reviewed = await this.prisma.review.findMany({
      where: { authorId: userId },
      select: { dishId: true },
    });
    return reviewed.map((r) => r.dishId);
  }

  private toRecommendation(
    dish: {
      id: string;
      name: string;
      description: string | null;
      price: number;
      restaurant: { id: string; name: string; cuisine: string; priceRange: number };
      tags: { name: string }[];
    },
    score: number,
    source: DishRecommendation['source'],
  ): DishRecommendation {
    return {
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      restaurant: dish.restaurant,
      tags: dish.tags.map((t) => t.name),
      score: Number(score.toFixed(4)),
      source,
    };
  }
}