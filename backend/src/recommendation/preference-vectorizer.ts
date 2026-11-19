/* Converts a user's gastronomic Preference into a fixed-order numeric vector,
 * so it can be compared with cosineSimilarity().
*/

// fixed order -  Must match the Cuisine enum in schema.prisma 1:1 (12 values)
export const ORDERED_CUISINES = [
  "ITALIAN",
  "JAPANESE",
  "MEXICAN",
  "INDIAN",
  "FRENCH",
  "SPANISH",
  "THAI",
  "AMERICAN",
  "MEDITERRANEAN",
  "CHINESE",
  "KOREAN",
  "VIETNAMESE",
] as const;

export type Cuisine = (typeof ORDERED_CUISINES)[number];

// Matches Restaurant.priceRange (1-4)
const PRICE_MIN = 1;
const PRICE_MAX = 4;

// Matches Preference.spicyLevel (1-5)
const SPICY_LEVEL_MIN = 1;
const SPICY_LEVEL_MAX = 5;
// Tag that marks a dish as spicy (assigned by the seed via SPICY_DISHES)
export const SPICY_TAG = "Spicy";

// Minimal shape needed to build the vector — avoids importing Prisma's
// generated Preference type directly, so this stays easy to unit test
export interface PreferenceInput {
	favoriteCuisines: Cuisine[];
	spicyLevel: number;
	preferredPriceMin: number;
	preferredPriceMax: number;
}

// Minimal shape needed to build a dish vector (cuisine and priceRange come 
// from Dish.restaurant, tags from Dish.tags)
export interface DishInput {
  cuisine: Cuisine;
  priceRange: number;
  tags: { name: string }[];
}

export class PreferenceVectorizer {
  static readonly VECTOR_LENGTH = ORDERED_CUISINES.length + 1 + 1 + 1; // 15
 
  /** Converts a Preference into a normalized numeric vector. */
  static toVector(pref: PreferenceInput): number[] {
    const vector = new Array<number>(this.VECTOR_LENGTH).fill(0);
 
    // 1) Multi-hot of favorite cuisines
    for (const cuisine of pref.favoriteCuisines) {
      const idx = ORDERED_CUISINES.indexOf(cuisine);
      if (idx !== -1) vector[idx] = 1;
    }
 
    const cuisineBlockLength = ORDERED_CUISINES.length;
 
    // 2) spicyLevel normalized to [0, 1]
    vector[cuisineBlockLength] = this.normalize(
      pref.spicyLevel,
      SPICY_LEVEL_MIN,
      SPICY_LEVEL_MAX
    );
 
    // 3) preferredPriceMin and preferredPriceMax normalized to [0, 1]
    vector[cuisineBlockLength + 1] = this.normalize(
      pref.preferredPriceMin,
      PRICE_MIN,
      PRICE_MAX
    );
    vector[cuisineBlockLength + 2] = this.normalize(
      pref.preferredPriceMax,
      PRICE_MIN,
      PRICE_MAX
    );
    return vector;
  }
  /** Converts a Dish into a vector in the same space as toVector() */
  static toDishVector(dish: DishInput): number[] {
    const vector = new Array<number>(this.VECTOR_LENGTH).fill(0);

    // 1. One-hot of the dish's cuisine (inherited from its restaurant)
    const idx = ORDERED_CUISINES.indexOf(dish.cuisine);
    if (idx !== -1) vector[idx] = 1;

    const cuisineBlockLength = ORDERED_CUISINES.length;

    // 2. Spicy: 1 if the dish has the "Spicy" tag, 0 otherwise
    vector[cuisineBlockLength] = dish.tags.some((t) => t.name === SPICY_TAG) ? 1 : 0;

    // 3. A dish has a single price, so it fills both the min and max slots
    const price = this.normalize(dish.priceRange, PRICE_MIN, PRICE_MAX);
    vector[cuisineBlockLength + 1] = price;
    vector[cuisineBlockLength + 2] = price;
    
    return vector;
  }
 
  /** Normalizes a value to [0, 1] given a min/max range, with a safety clamp. */
  private static normalize(value: number, min: number, max: number): number {
    if (max === min) return 0;
    const clamped = Math.min(Math.max(value, min), max);
    return (clamped - min) / (max - min);
  }
}
 
/**
 * Example usage alongside your already-prototyped cosineSimilarity():
 *
 *   const vectorA = PreferenceVectorizer.toVector(preferenceUserA);
 *   const vectorB = PreferenceVectorizer.toVector(preferenceUserB);
 *   const score = cosineSimilarity(vectorA, vectorB);
 */