/* Converts a user's gastronomic Preference into a fixed-order numeric vector,
 * so it can be compared with cosineSimilarity().
*/

// fixed order - must match the cuisines used across the proyect (seed.ts RESTAURANTS/DISH_POOL)
export const CUISINE_ORDER = [
	'Italian',
	'Japanese',
	'Mexican',
	'Indian',
	'French',
	'Spanish',
	'Thai',
	'American',
	'Mediterranean',
	'Chinese',
	'Korean',
	'Vietnamese',
] as const;

// Matches Restaurant.priceRange (1-4)
const PRICE_LEVELS = [1, 2, 3, 4] as const;

// Matches Preference.spiceLevel (1-5)
const SPICE_LEVEL_MAX = 5;

// Minimal shape needed to build the vector — avoids importing Prisma's
// generated Preference type directly, so this stays easy to unit test
export interface PreferenceVectorInput {
	favoriteCuisines: string[];
	spiceLevel: number;
	preferredPriceMin: number;
	preferredPriceMax: number;
}
