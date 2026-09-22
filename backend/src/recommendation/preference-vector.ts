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

/**
 * Converts a Preference into a fixed-length numeric vector:
 * - CUISINE_ORDER.length positions -> one-hot (1 if favorite, 0 otherwise)
 * - 1 position -> normalized spice level [0, 1]
 * - PRICE_LEVELS.length positions -> one-hot-ish (1 if level falls in [min, max])
 * 
 * Total length: CUISINE_ORDER.length + 1 PRICE_LEVELS.length
 */
export function preferenceToVector(pref: PreferenceVectorInput): number[] {
	// 1. Cuisine section: one-hot encoding in the fixed CUISINE_ORDER
	const cuisineVector = CUISINE_ORDER.map((cuisine) =>
		pref.favoriteCuisines.includes(cuisine) ? 1 : 0,
	);

	// 2. Spice level normalized to [0, 1]
	const spiceVector = [pref.spiceLevel / SPICE_LEVEL_MAX];

	// 3. Price range coverage: which price levels fall inside the user's preferred range
	const priceVector = PRICE_LEVELS.map((level) =>
		level >= pref.preferredPriceMin && level <= pref.preferredPriceMax ? 1 : 0,
	);

	return [...cuisineVector, ...spiceVector, ...priceVector];
}