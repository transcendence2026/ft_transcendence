/* Fetches seeded users' preferences, converts them to vectors and checks
 * their pairwise cosine similitary against real data (not mocks)
*/

import { PrismaClient } from "@prisma/client";
import { preferenceToVector } from "../recommendation/preference-vector";
import { cosineSimilarity } from "./cosine-similarity-prototype";
import { profile } from "console";
import { EOF } from "dns";

const prisma = new PrismaClient();

async function main() {
	const users = await prisma.user.findMany({
		include: { preference: true, profile: true },
	});
	const withVectors = users
		.filter((u) => u.preference !== null)
		.map((u) => ({
			username: u.username,
			vector: preferenceToVector(u.preference!),
		}));

	console.log(`Loaded ${withVectors.length} users with preferences.\n`);

	// Compare every pair once
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
		console.error('Test failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
EOF