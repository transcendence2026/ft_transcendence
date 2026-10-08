                                            QUERY PLAN                                                     
-----------------------------------------------------------------------------------------------------------------------------
 HashAggregate  (cost=9.55..9.82 rows=22 width=69) (actual time=3.582..3.597 rows=21 loops=1)
   Group Key: r.id
   Batches: 1  Memory Usage: 24kB
   Buffers: shared hit=6
   ->  Hash Join  (cost=6.21..9.23 rows=64 width=41) (actual time=1.511..1.581 rows=64 loops=1)
         Hash Cond: (d."restaurantId" = r.id)
         Buffers: shared hit=6
         ->  Hash Join  (cost=4.71..7.53 rows=64 width=41) (actual time=1.403..1.448 rows=64 loops=1)
               Hash Cond: (rv."dishId" = d.id)
               Buffers: shared hit=5
               ->  Seq Scan on "Review" rv  (cost=0.00..2.64 rows=64 width=41) (actual time=0.020..0.033 rows=64 loops=1)
                     Buffers: shared hit=2
               ->  Hash  (cost=3.76..3.76 rows=76 width=74) (actual time=1.337..1.338 rows=76 loops=1)
                     Buckets: 1024  Batches: 1  Memory Usage: 16kB
                     Buffers: shared hit=3
                     ->  Seq Scan on "Dish" d  (cost=0.00..3.76 rows=76 width=74) (actual time=0.018..1.275 rows=76 loops=1)
                           Buffers: shared hit=3
         ->  Hash  (cost=1.22..1.22 rows=22 width=37) (actual time=0.037..0.038 rows=22 loops=1)
               Buckets: 1024  Batches: 1  Memory Usage: 10kB
               Buffers: shared hit=1
               ->  Seq Scan on "Restaurant" r  (cost=0.00..1.22 rows=22 width=37) (actual time=0.012..0.016 rows=22 loops=1)
                     Buffers: shared hit=1
 Planning:
   Buffers: shared hit=267
 Planning Time: 8.161 ms
 Execution Time: 3.937 ms
(26 rows)