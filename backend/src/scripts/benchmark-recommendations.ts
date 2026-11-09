/**
 * Latency benchmark for RecommendationService.getDishRecommendations.
 *
 * Usage (dev DB only):
 *   npx tsx src/scripts/benchmark-recommendations.ts
 *   npx tsx src/scripts/benchmark-recommendations.ts --reviews=2000 --runs=100
 *   npx tsx src/scripts/benchmark-recommendations.ts --cleanup   # only delete simulated reviews
 *
 * Simulated reviews are tagged with BENCH_PREFIX in their text so they can be
 * removed afterwards without touching the seed data.
 */

import { performance } from 'node:perf_hooks';
import { PrismaService } from '../prisma/prisma.service.js';
import { RecommendationService } from '../recommendation/recommendation.service.js';
import { VectorCacheService } from '../recommendation/vector-cache.service.js';

const BENCH_PREFIX = '__BENCH__';
const cache = new VectorCacheService();

// CLI args
function arg(name: string, fallback: number): number {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? Number(found.split('=')[1]) : fallback;
}
const TOTAL_REVIEWS = arg('reviews', 1000);
const WARMUP_RUNS = arg('warmup', 5);
const MEASURED_RUNS = arg('runs', 50);
const ONLY_CLEANUP = process.argv.includes('--cleanup');

// Safety guard: never run against production
function assertNotProduction(): void {
  const dbUrl = process.env.DATABASE_URL ?? '';
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run: NODE_ENV=production');
  }
  if (/prod/i.test(dbUrl)) {
    throw new Error('Refusing to run: DATABASE_URL looks like a prod database');
  }
}

// Stats helpers 
function percentile(sortedAsc: number[], p: number): number {
  const idx = Math.min(
    sortedAsc.length - 1,
    Math.ceil((p / 100) * sortedAsc.length) - 1,
  );
  return sortedAsc[Math.max(0, idx)];
}

function report(label: string, samples: number[]): void {
  const sorted = [...samples].sort((a, b) => a - b);
  const mean = samples.reduce((acc, v) => acc + v, 0) / samples.length;
  console.log(`\n${label} (${samples.length} runs)`);
  console.log(`  mean: ${mean.toFixed(2)} ms`);
  console.log(`  p50:  ${percentile(sorted, 50).toFixed(2)} ms`);
  console.log(`  p95:  ${percentile(sorted, 95).toFixed(2)} ms`);
  console.log(`  min:  ${sorted[0].toFixed(2)} ms | max: ${sorted[sorted.length - 1].toFixed(2)} ms`);
}

// Data setup / teardown 
async function cleanup(prisma: PrismaService): Promise<void> {
  const { count } = await prisma.review.deleteMany({
    where: { comment: { startsWith: BENCH_PREFIX } },
  });
  console.log(`Cleanup: deleted ${count} simulated reviews`);
}

async function insertSimulatedReviews(
  prisma: PrismaService,
  userIds: string[],
  dishIds: string[],
): Promise<void> {
  const existingReviews = await prisma.review.findMany({
    select: { authorId: true, dishId: true },
  });
  const existingPairs = new Set(
    existingReviews.map((review) => `${review.authorId}:${review.dishId}`),
  );
  const candidates = userIds.flatMap((authorId) =>
    dishIds
      .filter((dishId) => !existingPairs.has(`${authorId}:${dishId}`))
      .map((dishId) => ({ authorId, dishId })),
  );

  candidates.sort(() => Math.random() - 0.5);

  if (candidates.length < TOTAL_REVIEWS) {
    throw new Error(
      `Only ${candidates.length} unique user-dish combinations are available; ` +
        `cannot insert ${TOTAL_REVIEWS} simulated reviews.`,
    );
  }

  const data = candidates.slice(0, TOTAL_REVIEWS).map((pair, index) => ({
    ...pair,
    comment: `${BENCH_PREFIX} review ${index}`,
    rating: 1 + Math.floor(Math.random() * 5),
  }));

  // createMany keeps the insert fast; chunk to avoid huge single statements
  const CHUNK = 500;
  for (let i = 0; i < data.length; i += CHUNK) {
    await prisma.review.createMany({ data: data.slice(i, i + CHUNK) });
  }
  console.log(`Inserted ${data.length} simulated reviews`);
}

async function measure(
  fn: () => Promise<unknown>,
  warmup: number,
  runs: number,
): Promise<number[]> {
  for (let i = 0; i < warmup; i++) await fn(); // warm-up (JIT, connection pool, caches)
  const samples: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    await fn();
    samples.push(performance.now() - start);
  }
  return samples;
}

// main
async function main(): Promise<void> {
  assertNotProduction();

  const prisma = new PrismaService();
  await prisma.$connect();

  const service = new RecommendationService(prisma, cache);

  try {
    if (ONLY_CLEANUP) {
      await cleanup(prisma);
      return;
    }

    const users = await prisma.user.findMany({ select: { id: true } });
    const dishes = await prisma.dish.findMany({ select: { id: true } });
    const userIds = users.map((u) => u.id);
    const dishIds = dishes.map((d) => d.id);
    console.log(`Seed: ${userIds.length} users, ${dishIds.length} dishes`);

    // Baseline with seed data only
    const baseline = await measure(
      () => service.getDishRecommendations(userIds[0]),
      WARMUP_RUNS,
      MEASURED_RUNS,
    );
    report('Baseline (seed only)', baseline);

    await insertSimulatedReviews(prisma, userIds, dishIds);

    // Rotate through users so we do not benchmark a single warm path
    let i = 0;
    const loaded = await measure(
      () => service.getDishRecommendations(userIds[i++ % userIds.length]),
      WARMUP_RUNS,
      MEASURED_RUNS,
    );
    report(`With ${TOTAL_REVIEWS} simulated reviews`, loaded);
  } finally {
    await cleanup(prisma); // always remove simulated data
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});