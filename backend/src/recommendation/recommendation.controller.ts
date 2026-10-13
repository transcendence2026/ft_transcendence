import { Controller, Get, Query } from "@nestjs/common";
import { RatingAggregatorService } from "./rating-aggregator";
import { resolveObjectURL } from "buffer";

@Controller('api/recommendation')
export class RecommendationController {
	// Inject the aggregator so this controller can exposse it over HTTP
	constructor(private readonly ratingAggregator: RatingAggregatorService) {}

	@Get('dish-ratings')
	getDishRatings(@Query('dishIds') dishIds?: string) {
		// Accept a comma-separated list of IDs, or none to get all
		const ids = dishIds ? dishIds.split(',') : undefined;
		return this.ratingAggregator.getDishRatings(ids);
	}

	@Get('restaurant-ratings')
	getRestaurantRatings(@Query('restaurantIds') restaurantIds?: string) {
		const ids = restaurantIds ? restaurantIds.split(',') : undefined;
		return this.ratingAggregator.getRestaurantRatings(ids);
	}
}