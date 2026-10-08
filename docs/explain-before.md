                                                         QUERY PLAN                                                          
-----------------------------------------------------------------------------------------------------------------------------
 HashAggregate  (cost=26.24..26.51 rows=22 width=85) (actual time=0.086..0.097 rows=0 loops=1)
   Group Key: r.id
   Batches: 1  Memory Usage: 24kB
   Buffers: shared hit=1
   ->  Hash Join  (cost=6.25..23.84 rows=480 width=57) (actual time=0.085..0.095 rows=0 loops=1)
         Hash Cond: (d."restaurantId" = r.id)
         Buffers: shared hit=1
         ->  Hash Join  (cost=4.75..20.84 rows=480 width=41) (actual time=0.021..0.022 rows=0 loops=1)
               Hash Cond: (rv."dishId" = d.id)
               ->  Seq Scan on "Review" rv  (cost=0.00..14.80 rows=480 width=36) (actual time=0.020..0.021 rows=0 loops=1)
               ->  Hash  (cost=3.78..3.78 rows=78 width=74) (never executed)
                     ->  Seq Scan on "Dish" d  (cost=0.00..3.78 rows=78 width=74) (never executed)
         ->  Hash  (cost=1.22..1.22 rows=22 width=53) (actual time=0.050..0.059 rows=22 loops=1)
               Buckets: 1024  Batches: 1  Memory Usage: 10kB
               Buffers: shared hit=1
               ->  Seq Scan on "Restaurant" r  (cost=0.00..1.22 rows=22 width=53) (actual time=0.025..0.036 rows=22 loops=1)
                     Buffers: shared hit=1
 Planning:
   Buffers: shared hit=221 read=9 dirtied=1
 Planning Time: 30.567 ms
 Execution Time: 1.863 ms
(21 rows)