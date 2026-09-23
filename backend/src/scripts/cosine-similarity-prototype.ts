/**
 * Cosine similarity measures the cosine of the angle between two vectors.
 * 
 * Result:
 *  1.0 => Perfect match of gastronomic tastes
 *  0.0 => No affinity / Orthogonal vectors
 * -1.0 => Opossite tastes
*/

/**
 * Calculates the cosine similarity between two numeric vectors.
 *
 * @param vectorA - The first feature vector (e.g., user preferences)
 * @param vectorB - The second feature vector (e.g., another user's preferences)
 * @returns The cosine similarity score ranging from -1.0 to 1.0
 * @throws {Error} If vectors have different dimensions
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
	// Ensure both vectors reside in the same vector space (equal dimensions)
	if (vectorA.length !== vectorB.length) {
		throw new Error("Vectors must have the same dimension");
	}

	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	// Compute the dot product (A · B) and squared Euclidean norms (||A||², ||B||²)
	for (let i = 0; i < vectorA.length; i++) {
		dotProduct += vectorA[i] * vectorB[i];
		normA += vectorA[i] ** 2;
		normB += vectorB[i] ** 2;
	}

	// Handle zero vectors to prevent division by zero (e.g. unrated/empty profiles)
	if (normA === 0 || normB === 0) return 0; // Prevents division by zero

	// Apply formula: (A · B) / (||A|| * ||B||)
	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- Verification with known edge cases --- 
console.log("Orthogonal [1,0] vs [0,1]:", cosineSimilarity([1, 0], [0, 1])); // expected: 0
console.log("Identical [1,1] vs [1,1]:", cosineSimilarity([1, 1], [1, 1])); // expected: 1

// --- Mock Data: User Preference Profiles ---
const userA = [5, 4, 1, 0];
const userB = [4, 5, 1, 0];
const userC = [0, 0, 5, 5];

console.log("A vs B (similar):", cosineSimilarity(userA, userB));
console.log("A vs C (opposite):", cosineSimilarity(userA, userC));
