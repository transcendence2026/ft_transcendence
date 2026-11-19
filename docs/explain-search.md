# EXPLAIN ANALYZE: `GET /api/search`

Execution plans of the query built by `SearchService.search()` (`backend/src/search/search.service.ts`),
including the dynamic filters and the keyset cursor.

* **Latency goal:** < 20 ms execution time.
* **Engine:** PostgreSQL 16, all migrations applied (up to `add_search_indexes`).
* **Data:** 22 restaurants, 77 dishes, 73 reviews (same restaurants and dishes as `prisma/seed.ts`; reviews generated with the same 5-10 per user rule), warm cache, `ANALYZE` run.
* The parameters are sent as bind variables, exactly like Prisma does with `$queryRaw`.

## Results (seed-sized data)

| Scenario | Execution time |
| --- | --- |
| Combined: `cuisine=ITALIAN&price=2&rating=2&q=a&limit=10&cursor=<id>` | ~0.1 ms |
| No filters (first page) | ~0.2 ms |
| `cuisine` only | ~0.1 ms |
| `q` only (`pizza`) | ~0.2 ms |

## Combined query

Values: `$1='ITALIAN'`, `$2=2`, `$3='%a%'`, `$4='%a%'`, `$5='r19'` (cursor), `$6=2` (rating), `$7=11` (`limit + 1`).

```
Limit  (actual time=0.078..0.080 rows=1 loops=1)
  InitPlan 3 (returns $2,$3)                       -- cursor row, fetched once
    ->  Seq Scan on "Restaurant" c  (actual time=0.006..0.007 rows=1)
  ->  Sort  Sort Key: r."createdAt" DESC, r.id DESC
        ->  GroupAggregate  Group Key: r.id
              Filter: (avg(rev.rating) >= '2'::numeric)   -- HAVING
              ->  Sort  Sort Key: r.id DESC
                    ->  Nested Loop Left Join
                          ->  Hash Right Join  Hash Cond: (d."restaurantId" = r.id)
                                ->  Seq Scan on "Dish" d
                                ->  Index Scan using "Restaurant_cuisine_priceRange_idx" on "Restaurant" r
                                      Index Cond: ((cuisine = 'ITALIAN') AND ("priceRange" = 2))
                                      Filter: (ROW("createdAt", id) < ROW($2, $3)) AND (name ~~* '%a%' OR SubPlan 1)
                          ->  Index Scan using "Review_dishId_rating_idx" on "Review" rev
                                Index Cond: ("dishId" = d.id)
Planning Time: 0.436 ms
Execution Time: 0.124 ms
```

* A single query computes every average (no N+1).
* `Restaurant_cuisine_priceRange_idx` and `Review_dishId_rating_idx` are used even on this tiny dataset.
* On a table this small Postgres still prefers a `Seq Scan` for `Dish`, which is expected.

## Scaling check (informational)

Same query shapes on a synthetic dataset of 20,000 restaurants, 60,000 dishes and 54,000 reviews:

| Scenario | Execution time |
| --- | --- |
| Combined (all filters + cursor) | ~10 ms |
| `cuisine` only | ~30 ms |
| No filters | ~94 ms |
| `q` only | ~155 ms |

Without selective filters the query aggregates every matching restaurant before sorting, and `ILIKE '%text%'`
cannot use a B-Tree index. This is irrelevant at the project's current size, but if the catalogue grows,
the next steps would be a `pg_trgm` GIN index for the text search and a stored rating aggregate.