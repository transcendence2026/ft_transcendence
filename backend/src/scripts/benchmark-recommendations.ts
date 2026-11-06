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
const BENCH_USER_PREFIX = 'bench_sim_';

async function cleanup(prisma: PrismaService): Promise<void> {
  const reviews = await prisma.review.deleteMany({
    where: { comment: { startsWith: BENCH_PREFIX } },
  });
  const users = await prisma.user.deleteMany({
    where: { username: { startsWith: BENCH_USER_PREFIX } },
  });
  console.log(
    `Cleanup: deleted ${reviews.count} simulated reviews and ${users.count} simulated users`,
  );
}

// Creates throwaway users so there are enough unique (author, dish) pairs
async function createBenchUsers(
  prisma: PrismaService,
  count: number,
): Promise<string[]> {
  await prisma.user.createMany({
    data: Array.from({ length: count }, (_, i) => ({
      username: `${BENCH_USER_PREFIX}${i}`,
      email: `${BENCH_USER_PREFIX}${i}@bench.local`,
      passwordHash: null,
    })),
    skipDuplicates: true,
  });
  const created = await prisma.user.findMany({
    where: { username: { startsWith: BENCH_USER_PREFIX } },
    select: { id: true },
  });
  return created.map((u) => u.id);
}

async function insertSimulatedReviews(
  prisma: PrismaService,
  authorIds: string[],
  dishIds: string[],
): Promise<void> {
  const candidates = authorIds.flatMap((authorId) =>
    dishIds.map((dishId) => ({ authorId, dishId })),
  );

  if (candidates.length < TOTAL_REVIEWS) {
    throw new Error(
      `Only ${candidates.length} unique author-dish pairs; cannot insert ${TOTAL_REVIEWS} reviews.`,
    );
  }

  // Fisher-Yates shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const data = candidates.slice(0, TOTAL_REVIEWS).map((pair, index) => ({
    ...pair,
    comment: `${BENCH_PREFIX} review ${index}`,
    rating: 1 + Math.floor(Math.random() * 5),
  }));

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

  try {
    if (ONLY_CLEANUP) {
      await cleanup(prisma);
      return;
    }

    // Evaluate only real seed users; bench users exist just to author reviews
    const users = await prisma.user.findMany({ select: { id: true } });
    const dishes = await prisma.dish.findMany({ select: { id: true } });
    const evalUserIds = users.map((u) => u.id);
    const dishIds = dishes.map((d) => d.id);
    console.log(`Seed: ${evalUserIds.length} users, ${dishIds.length} dishes`);

    const runScenario = async (label: string): Promise<void> => {
      // Cold: brand-new cache on every call, so each run hits the DB
      let i = 0;
      const cold = await measure(
        () =>
          new RecommendationService(prisma, new VectorCacheService())
            .getDishRecommendations(evalUserIds[i++ % evalUserIds.length]),
        WARMUP_RUNS,
        MEASURED_RUNS,
      );
      report(`${label} - cold cache`, cold);

      // Warm: one shared cache across all calls
      const shared = new RecommendationService(prisma, new VectorCacheService());
      i = 0;
      const warm = await measure(
        () => shared.getDishRecommendations(evalUserIds[i++ % evalUserIds.length]),
        WARMUP_RUNS,
        MEASURED_RUNS,
      );
      report(`${label} - warm cache`, warm);
    };

    await runScenario('Baseline (seed only)');

    const benchUserCount = Math.ceil(TOTAL_REVIEWS / dishIds.length) + 1;
    const benchUserIds = await createBenchUsers(prisma, benchUserCount);
    await insertSimulatedReviews(prisma, benchUserIds, dishIds);

    await runScenario(`With ${TOTAL_REVIEWS} simulated reviews`);
  } finally {
    await cleanup(prisma); // always remove simulated data
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});