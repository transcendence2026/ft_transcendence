import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { RatingAggregatorService } from "./rating-aggregator.js";
import { RecommendationService } from "./recommendation.service.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { resolveObjectURL } from "buffer";

@Controller('api/recommendations')
export class RecommendationController {
	// Inject the aggregator so this controller can exposse it over HTTP
	constructor(
		private readonly ratingAggregator: RatingAggregatorService,
		private readonly recommendation: RecommendationService
	) {}

	@Get('dishes')
	@UseGuards(JwtAuthGuard) // use the real guard from Patricia's auth module
	getDishRecommendations(@Req() req: any, @Query('limit') limit?: string) {
		// Clamp the limit to 1..50 and default to 10
		const parsed = Math.min(Math.max(parseInt(limit ?? '10', 10) || 10, 1), 50);
		return this.recommendation.getDishRecommendations(req.user.id, parsed);
	}

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