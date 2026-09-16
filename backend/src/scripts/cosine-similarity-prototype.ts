/**
 * Cosine Similarity Prototype
 * 
 * Cosine similarity measures the cosine of the angle between two vectors.
 * 
 * Result:
 *  1.0 => Perfect match of gastronomic tastes
 *  0.0 => No affinity / Orthogonal vectors
 * -1.0 => Opossite tastes
*/

export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
	if (vectorA.length !== vectorB.length) {
		throw new Error("Vectors must have the same dimension");
	}

	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < vectorA.length; i++) {
		dotProduct += vectorA[i] * vectorB[i];
		normA += vectorA[i] ** 2;
		normB += vectorB[i] ** 2;
	}

	if (normA === 0 || normB === 0) return 0; // Prevents division by zero

	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- Verification with known cases --- 
console.log("Orthogonal [1,0] vs [0,1]:", cosineSimilarity([1, 0], [0, 1])); // expected: 0
console.log("Identical [1,1] vs [1,1]:", cosineSimilarity([1, 1], [1, 1])); // expected: 1

// --- Mock Data ---
const userA = [5, 4, 1, 0];
const userB = [4, 5, 1, 0];
const userC = [0, 0, 5, 5];

console.log("A vs B (similar):", cosineSimilarity(userA, userB));
console.log("A vs C (opposite):", cosineSimilarity(userA, userC));
