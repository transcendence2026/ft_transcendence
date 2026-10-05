import {
  PreferenceVectorizer,
  ORDERED_CUISINES,
  PreferenceInput,
} from "./preference-vectorizer";

// Helper to build a valid PreferenceInput with sensible defaults,
// overriding only the fields relevant to each test.
function buildPreference(overrides: Partial<PreferenceInput> = {}): PreferenceInput {
  return {
    favoriteCuisines: [],
    spicyLevel: 2,
    preferredPriceMin: 1,
    preferredPriceMax: 4,
    ...overrides,
  };
}

describe("PreferenceVectorizer", () => {
  it("returns a vector of the expected fixed length (15)", () => {
    const vector = PreferenceVectorizer.toVector(buildPreference());
    expect(vector).toHaveLength(15);
    expect(PreferenceVectorizer.VECTOR_LENGTH).toBe(15);
  });

  it("sets a 1 in every position matching a favorite cuisine (multi-hot)", () => {
    const pref = buildPreference({ favoriteCuisines: ["ITALIAN", "JAPANESE"] });
    const vector = PreferenceVectorizer.toVector(pref);

    const italianIdx = ORDERED_CUISINES.indexOf("ITALIAN");
    const japaneseIdx = ORDERED_CUISINES.indexOf("JAPANESE");

    expect(vector[italianIdx]).toBe(1);
    expect(vector[japaneseIdx]).toBe(1);

    // Every other cuisine slot should remain 0
    ORDERED_CUISINES.forEach((cuisine, idx) => {
      if (cuisine !== "ITALIAN" && cuisine !== "JAPANESE") {
        expect(vector[idx]).toBe(0);
      }
    });
  });

  it("produces an all-zero cuisine block when favoriteCuisines is empty", () => {
    const vector = PreferenceVectorizer.toVector(buildPreference({ favoriteCuisines: [] }));
    const cuisineBlock = vector.slice(0, ORDERED_CUISINES.length);
    expect(cuisineBlock.every((value) => value === 0)).toBe(true);
  });

  it("is order-independent: same cuisines in a different order yield the same vector", () => {
    const vectorA = PreferenceVectorizer.toVector(
      buildPreference({ favoriteCuisines: ["THAI", "KOREAN", "FRENCH"] })
    );
    const vectorB = PreferenceVectorizer.toVector(
      buildPreference({ favoriteCuisines: ["FRENCH", "THAI", "KOREAN"] })
    );
    expect(vectorA).toEqual(vectorB);
  });

  it("normalizes spicyLevel to 0 at the minimum (1) and 1 at the maximum (5)", () => {
    const spicyIdx = ORDERED_CUISINES.length; // position 12

    const minVector = PreferenceVectorizer.toVector(buildPreference({ spicyLevel: 1 }));
    const maxVector = PreferenceVectorizer.toVector(buildPreference({ spicyLevel: 5 }));
    const midVector = PreferenceVectorizer.toVector(buildPreference({ spicyLevel: 3 }));

    expect(minVector[spicyIdx]).toBe(0);
    expect(maxVector[spicyIdx]).toBe(1);
    expect(midVector[spicyIdx]).toBeCloseTo(0.5);
  });

  it("normalizes preferredPriceMin and preferredPriceMax independently to [0, 1]", () => {
    const priceMinIdx = ORDERED_CUISINES.length + 1; // position 13
    const priceMaxIdx = ORDERED_CUISINES.length + 2; // position 14

    const vector = PreferenceVectorizer.toVector(
      buildPreference({ preferredPriceMin: 1, preferredPriceMax: 4 })
    );

    expect(vector[priceMinIdx]).toBe(0); // (1 - 1) / (4 - 1)
    expect(vector[priceMaxIdx]).toBe(1); // (4 - 1) / (4 - 1)
  });

  it("clamps out-of-range values instead of producing values outside [0, 1]", () => {
    const spicyIdx = ORDERED_CUISINES.length;

    const belowRange = PreferenceVectorizer.toVector(buildPreference({ spicyLevel: 0 }));
    const aboveRange = PreferenceVectorizer.toVector(buildPreference({ spicyLevel: 10 }));

    expect(belowRange[spicyIdx]).toBe(0);
    expect(aboveRange[spicyIdx]).toBe(1);
  });

  it("ignores a cuisine value not present in ORDERED_CUISINES without throwing", () => {
    const pref = buildPreference({
      // Cast to simulate bad/stale data (e.g. a renamed enum value) reaching the vectorizer.
      favoriteCuisines: ["ITALIAN", "UNKNOWN_CUISINE" as PreferenceInput["favoriteCuisines"][number]],
    });

    expect(() => PreferenceVectorizer.toVector(pref)).not.toThrow();

    const vector = PreferenceVectorizer.toVector(pref);
    const italianIdx = ORDERED_CUISINES.indexOf("ITALIAN");
    expect(vector[italianIdx]).toBe(1);
  });
});