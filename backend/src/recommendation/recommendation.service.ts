import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PreferenceVectorizer } from './preference-vectorizer.js';
import { cosineSimilarity } from './cosine-similarity.js';

export interface DishRecommendation {
	id: string;
	name: string;
	description: string | null;
	price: number;
	restaurant: { id: string; name: string; cuisine: string; priceRange: number };
	tags: string[];
	score: number; // cosine similarity, 0..1
}

export interface SimilarFriend {
	id: string;
	username: string;
	score: number;
}

@Injectable()
export class RecommendationService {
	constructor(private readonly prisma: PrismaService) {}

	/** Dishes ranked by cosine similarity to the user's preference vector */
	async getDishRecommendations(userId: string, limit = 10): Promise<DishRecommendation[]> {
		const preference = await this.prisma.preference.findUnique({ where: { userId } });
		// Without preference there is nothing to compare: the UI shows an empty state
		if (!preference) return [];

		const userVector = PreferenceVectorizer.toVector(preference);

		// Never recommend a dish the user already reviewed
		const reviewed = await this.prisma.review.findMany({
			where: { authorId: userId },
			select: { dishId: true },
		});

    const dishes = await this.prisma.dish.findMany({
      where: { id: { notIn: reviewed.map((r) => r.dishId) } },
      include: {
        restaurant: { select: { id: true, name: true, cuisine: true, priceRange: true } },
        tags: { select: { name: true } },
      },
    });

    return dishes
      .map((dish) => {
        const dishVector = PreferenceVectorizer.toDishVector({
          cuisine: dish.restaurant.cuisine,
          priceRange: dish.restaurant.priceRange,
          tags: dish.tags,
        });
        return {
          id: dish.id,
          name: dish.name,
          description: dish.description,
          price: dish.price,
          restaurant: dish.restaurant,
          tags: dish.tags.map((t) => t.name),
          score: Number(cosineSimilarity(userVector, dishVector).toFixed(4)),
        };
      })
      // Highest score first; name as a stable tie-breaker
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, limit);
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
}