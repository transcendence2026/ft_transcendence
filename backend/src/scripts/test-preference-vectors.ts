/* 
 * Fetches seeded users' preferences, converts them into numerical vectors,
 * and computes pairwise cosine similarity against real database records.
*/

import { PrismaClient } from "@prisma/client";
import { preferenceToVector } from "../recommendation/preference-vector";
import { cosineSimilarity } from "./cosine-similarity-prototype";

// Initialize the Prisma Client instance
const prisma = new PrismaClient();

async function main() {
	// Retrieve all users along with their associated preference and profiles
	const users = await prisma.user.findMany({
		include: { preference: true, profile: true },
	});

	// Filtes out users missing preference data and map remaining users to feature vectors
	const withVectors = users
		.filter((u) => u.preference !== null)
		.map((u) => ({
			username: u.username,
			vector: preferenceToVector(u.preference!),
		}));

	console.log(`Loaded ${withVectors.length} users with preferences.\n`);

	// Compute pairwise cosine similitary for all unique user combinations
	for (let i =  0; i < withVectors.length; i++) {
		for (let j = i + 1; j < withVectors.length; j++) {
			const score = cosineSimilarity(withVectors[i].vector, withVectors[j].vector);
			console.log(`${withVectors[i].username} vs ${withVectors[j].username}: ${score.toFixed(3)}`,
		);
		}
	}
}

main()
	.catch((e) => {
		// Log any runtime or query execution errors and exit with failure code
		console.error('Test failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		// Ensure the Prisma Client disconnects gracefully
		await prisma.$disconnect();
	});