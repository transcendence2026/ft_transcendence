# N+1 verification — RatingAggregatorService

## getDishRatings (groupBy)
```sql
SELECT AVG("Review"."rating"), COUNT("Review"."rating"), "Review"."dishId"
FROM "Review"
WHERE 1=1
GROUP BY "Review"."dishId"
```
Single query for 50 dishes — no N+1.

## getRestaurantRatings ($queryRaw)
```sql
SELECT d."restaurantId",
       AVG(rv.rating)::float AS "avgRating",
       COUNT(rv.id)::int AS "reviewCount"
FROM "Review" rv
JOIN "Dish" d ON d.id = rv."dishId"
GROUP BY d."restaurantId"
```
Single query for 21 restaurants — no N+1.
