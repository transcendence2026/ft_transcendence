# Recommendation Engine Benchmark

Latency benchmark of `RecommendationService.getDishRecommendations` (Week 7, bonus, P4), measuring the effect of the in-memory vector cache (`VectorCacheService`) and of a larger review volume.

- **Date:** 2026-11-06
- **Script:** `backend/src/scripts/benchmark-recommendations.ts`

## How to run

The benchmark runs inside the backend container of the dev stack, where `DATABASE_URL` is already defined:

```bash
docker compose -f docker-compose-dev.yml up -d --build backend
docker compose -f docker-compose-dev.yml exec backend node dist/scripts/benchmark-recommendations.js
```

Optional flags:

| Flag | Default | Meaning |
|---|---|---|
| `--reviews=N` | 1000 | Number of simulated reviews to insert |
| `--runs=N` | 50 | Measured runs per scenario |
| `--warmup=N` | 5 | Warm-up runs discarded before measuring |
| `--cleanup` | - | Only delete simulated data (use if a run was interrupted) |

The script refuses to run if `NODE_ENV=production` or if `DATABASE_URL` looks like a production database.

## Methodology

- **Dataset (seed):** 11 users, 79 dishes.
- **Simulated load:** 1,000 reviews with random ratings (1-5), authored by 14 throwaway users (`bench_sim_*`) so that each (author, dish) pair is unique. Reviews are tagged with the `__BENCH__` prefix in their comment.
- **Cleanup:** simulated reviews and users are always deleted at the end (`finally` block). Last run: 1,000 reviews and 14 users deleted.
- **Evaluated users:** the script rotates through the real seed users, so a single warm path is not measured.
- **Cold cache:** a brand-new `VectorCacheService` is created for every call, so each run recomputes the vectors from the database.
- **Warm cache:** one `VectorCacheService` is shared across all calls (TTL 10 min), so after the warm-up the vectors are served from memory.
- **Timing:** `performance.now()` around each call, 5 warm-up runs, then 50 measured runs per scenario.

## Results

| Scenario | Cache | Mean | p50 | p95 | Min | Max |
|---|---|---|---|---|---|---|
| Seed only (79 dishes) | cold | 6.44 ms | 6.41 ms | 7.71 ms | 5.31 ms | 10.31 ms |
| Seed only (79 dishes) | warm | 1.14 ms | 0.80 ms | 3.27 ms | 0.71 ms | 4.82 ms |
| + 1,000 simulated reviews | cold | 5.36 ms | 5.32 ms | 5.63 ms | 5.02 ms | 7.04 ms |
| + 1,000 simulated reviews | warm | 0.84 ms | 0.80 ms | 1.07 ms | 0.74 ms | 1.36 ms |

## Observations

- **Cache effect:** with 1,000 reviews, the warm cache brings the median from about 5.3 ms down to about 0.8 ms (roughly 6-7x faster), and the p95 from 5.63 ms to 1.07 ms.
- **Scaling with review volume:** going from the seed data to 1,000+ reviews does not increase cold latency. This is consistent with rating aggregation being done in the database (`groupBy` / `aggregate`) rather than in application memory.
- **Seed-only cold baseline:** its mean (6.44 ms) is slightly higher than the cold run with 1,000 reviews (5.36 ms). This is most likely connection-pool and JIT warm-up in the first block of the run (5 warm-up iterations are few), not a real effect of having more reviews. Re-running with `--warmup=20` gives a cleaner baseline.

## Limitations

- The benchmark calls the service directly: it does not include HTTP, nginx, authentication or serialization overhead.
- Small dataset (79 dishes, 11 real users) on a local dev stack; absolute numbers will differ on other hardware or with a larger catalog.
- Only 50 runs per scenario, so the p95 is sensitive to individual outliers.
- The warm scenario measures cache hits; it does not include the invalidation cost when preferences change or a dish is created.