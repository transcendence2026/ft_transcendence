jest.mock('@nestjs/common', () => ({
  Injectable: () => () => undefined,
}));
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));


import { RecommendationService } from "./recommendation.service";

// Minimal PrismaService mock: only the calls the service makes
function createPrismaMock() {
	return {
		preference: { findUnique: jest.fn() },
		review: { findMany: jest.fn() },
		dish: { findMany: jest.fn() },
		friendship: { findMany: jest.fn() },
		block: { findMany: jest.fn() },
		user: { findMany: jest.fn() },
	};
}

// User likes ITALIAN, mild spice (spicyLevel 1 -> 0), price range 2-3
const userPref = {
	favoriteCuisines: ['ITALIAN'],
	spicyLevel: 1,
	preferredPriceMin: 2,
	preferredPriceMax: 3,
};

function makeDish(id: string, cuisine:string, priceRange: number, spicy = false) {
	return {
		id,
		name: `Dish ${id}`,
		description: null,
		price: 10,
		restaurant: { id: `r-${id}`, name: `Restaurant ${id}`, cuisine, priceRange },
		tags: spicy ? [{ name: 'Spicy' }] : [],
	};
}

describe('RecommendationService', () => {
	let prisma: ReturnType<typeof createPrismaMock>;
	let service: RecommendationService;

	beforeEach(() => {
		prisma = createPrismaMock();
		service = new RecommendationService(prisma as any);
		prisma.preference.findUnique.mockResolvedValue(userPref);
		prisma.review.findMany.mockResolvedValue([]);
		prisma.dish.findMany.mockResolvedValue([]);
		prisma.friendship.findMany.mockResolvedValue([]);
		prisma.block.findMany.mockResolvedValue([]);
		prisma.user.findMany.mockResolvedValue([]);
	});

	describe('getDishRecommendations', () => {
		it('returns [] without querying dishes when the user has no preference', async () => {
			prisma.preference.findUnique.mockResolvedValue(null);

			const result = await service.getDishRecommendations('u1');

			expect(result).toEqual([]);
			expect(prisma.dish.findMany).not.toHaveBeenCalled();
		});

		it('ranks dishes by similarity, highest first', async () => {
			prisma.dish.findMany.mockResolvedValue([
				makeDish('mexican-spicy', 'MEXICAN', 1, true), // no shared dimension -> 0
				makeDish('italian', 'ITALIAN', 2), // best match
				makeDish('japanese', 'JAPANESE', 4), // only price overlap
			]);

			const result = await service.getDishRecommendations('u1');

			expect(result.map((r) => r.id)).toEqual(['italian', 'japanese', 'mexican-spicy']);
			expect(result[0].score).toBeGreaterThan(result[1].score);
			expect(result[1].score).toBeGreaterThan(result[2].score);
			expect(result[2].score).toBe(0);
		});

		it('keeps every score within [0, 1]', async () => {
			prisma.dish.findMany.mockResolvedValue([
				makeDish('a', 'ITALIAN', 2),
				makeDish('b', 'KOREAN', 3, true),
			]);

			const result = await service.getDishRecommendations('u1');

			for (const r of result) {
				expect(r.score).toBeGreaterThanOrEqual(0);
				expect(r.score).toBeLessThanOrEqual(1);
			}
		});

		it('excludes dishes the user already reviewed', async () => {
			prisma.review.findMany.mockResolvedValue([{ dishId: 'd1' }, { dishId: 'd2' }]);

			await service.getDishRecommendations('u1');

			expect(prisma.review.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { authorId: 'u1' } }),
			);
			expect(prisma.dish.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: { notIn: ['d1', 'd2'] } } }),
			);
		});

		it('respects the limit', async () => {
			prisma.dish.findMany.mockResolvedValue(
				['a', 'b', 'c', 'd'].map((id) => makeDish(id, 'ITALIAN', 2)),
			);

			const result = await service.getDishRecommendations('u1', 2);

			expect(result).toHaveLength(2);
		});

		it('maps tags to plain names and keeps the restaurant info', async () => {
			prisma.dish.findMany.mockResolvedValue([makeDish('x', 'ITALIAN', 2, true)]);

			const [rec] = await service.getDishRecommendations('u1');

			expect(rec.tags).toEqual(['Spicy']);
			expect(rec.restaurant).toEqual({
				id: 'r-x',
				name: 'Restaurant x',
				cuisine: 'ITALIAN',
				priceRange: 2,
			});
		});
	});

	describe('getSimilarFriends', () => {
		it('returns [] when the user has no preference', async () => {
			prisma.preference.findUnique.mockResolvedValue(null);

			expect(await service.getSimilarFriends('u1')).toEqual([]);
			expect(prisma.friendship.findMany).not.toHaveBeenCalled();
		});

		it('only asks for ACCEPTED friendships', async () => {
			await service.getSimilarFriends('u1');

			expect(prisma.friendship.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({ status: 'ACCEPTED' }),
				}),
			);
		});

		it('reads friendships in both directions and drops blocked users', async () => {
			prisma.friendship.findMany.mockResolvedValue([
				{ senderId: 'u1', receiverId: 'f1' }, // user is sender
				{ senderId: 'f2', receiverId: 'u1' }, // user is the receiver
				{ senderId: 'u1', receiverId: 'f3' }, // f3 is blocked below
			]);
			prisma.block.findMany.mockResolvedValue([{ blockerId: 'f3', blockedId: 'u1' }]);

			await service.getSimilarFriends('u1');

			expect(prisma.user.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({ id: { in: ['f1', 'f2'] } }),
				}),
			);
		});

		it('does not query users when every friend is blocked or there are none', async () => {
			await service.getSimilarFriends('u1');

			expect(prisma.user.findMany).not.toHaveBeenCalled();
		});

		it('ranks friends by taste similarity and skips friends without preference', async () => {
			prisma.friendship.findMany.mockResolvedValue([
				{ senderId: 'u1', receiverId: 'same' },
				{ senderId: 'u1', receiverId: 'other' },
				{ senderId: 'u1', receiverId: 'empty' },
			]);
			prisma.user.findMany.mockResolvedValue([
				{
					id: 'other',
					username: 'other',
					preference: { ...userPref, favoriteCuisines: ['KOREAN'] },
				},
				{ id: 'same', username: 'same', preference: { ...userPref } },
				{ id: 'empty', username: 'empty', preference: null },
			]);
			
			const result = await service.getSimilarFriends('u1');
			
			expect(result.map((f) => f.id)).toEqual(['same', 'other']);
			expect(result[0].score).toBeCloseTo(1);
			expect(result[1].score).toBeLessThan(result[0].score);
		});

		it('respects the limit', async () => {
			prisma.friendship.findMany.mockResolvedValue([
				{senderId: 'u1', receiverId: 'a' },
				{ senderId: 'u1', receiverId: 'b' },
			]);
			prisma.user.findMany.mockResolvedValue([
				{ id: 'a', username: 'a', preference: { ...userPref } },
				{ id: 'b', username: 'b', preference: { ...userPref } },
			]);

			expect(await service.getSimilarFriends('u1', 1)).toHaveLength(1);
		});
	});
});