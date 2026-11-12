import axios from 'axios';

const PAGE_SIZE = 12;

export type FriendshipState = 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED';

// Must match the Cuisine enum in scheme.prisma
export const CUISINE = [
	'ITALIAN', 'JAPANESE', 'MEXICAN', 'INDIAN', 'FRENCH', 'SPANISH',
	'THAI', 'AMERICAN', 'MEDITERRANEAN', 'CHINESE', 'KOREAN', 'VIETNAMESE',
] as const;

export const CUISINE_LABELS: Record<string, string> = {
	ITALIAN: 'Italiana',
	JAPANESE: 'Japonesa',
	MEXICAN: 'Mejicana',
	INDIAN: 'India',
	FRENCH: 'Francesa',
	SPANISH: 'Española',
	THAI: 'Thailandesa',
	AMERICAN: 'Americana',
	MEDITERRANEAN: 'Mediterránea',
	CHINESE: 'China',
	KOREAN: 'Coreana',
	VIETNAMESE: 'Vietnamita',
};

export interface RestaurantResult {
	id: string;
	name: string;
	cuisine: string;
	priceRange: number;
	avgRating: number | null; // null when the restaurant has no reviews yet
	reviewCount: number;
}

export interface UserResult {
	id: string;
	username: string;
	firstName: string | null;
	lastName: string | null;
	avatarUrl: string | null;
	bio: string | null; // always null for private profiles
	isPrivate: boolean;
	friendshipStatus: FriendshipState;
}

export interface UserSearchPage {
	results: UserResult[];
	nextCursor: string | null;
}

export interface UserSearchParams {
	q?: string;
	cursor?: string | null;
}

export interface SearchPage {
	results: RestaurantResult[];
	nextCursor: string | null;
}

export interface SearchParams {
	q?: string;
	cuisine?: string;
	price?: string;
	rating?: string;
	cursor?: string | null;
}

export interface DishRecommendation {
	id: string;
	name: string;
	description: string | null;
	price: number;
	restaurant: { id: string; name: string; cuisine: string; priceRange: number };
	tags: string[];
	score: number; // cosine similarity, 0..1
	source: 'personalized' | 'top-rated';
}

export async function searchUsers(
	params: UserSearchParams,
	signal?: AbortSignal,
): Promise<UserSearchPage> {
	const query: Record<string, string | number> = { limit: PAGE_SIZE };
	if (params.q) query.q = params.q;
	if (params.cursor) query.cursor = params.cursor;

	const { data } = await axios.get<UserSearchPage>('/api/search/users', { params: query, signal });
	return data;
}

export async function searchRestaurants(
	params: SearchParams,
	signal?: AbortSignal,
): Promise<SearchPage> {
	// Only send the filters that are set
	const query: Record<string, string | number> = { limit: PAGE_SIZE };
	if (params.q) query.q = params.q;
	if (params.cuisine) query.cuisine = params.cuisine;
	if (params.price) query.price = params.price;
	if (params.rating) query.rating = params.rating;
	if (params.cursor) query.cursor = params.cursor;

	const { data } = await axios.get<SearchPage>('/api/search', { params: query, signal });
	return data;
}

export async function getDishRecommendations(
	limit = 10,
	signal?: AbortSignal,
): Promise<DishRecommendation[]> {
	const { data } = await axios.get<DishRecommendation[]>('/api/recommendations/dishes', {
		params: { limit },
		signal,
	});
	return data;
}