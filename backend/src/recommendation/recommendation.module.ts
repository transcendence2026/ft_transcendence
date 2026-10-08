import { Module } from '@nestjs/common';
import { RatingAggregatorService } from './rating-aggregator.js';
import { RecommendationController } from './recommendation.controller.js';

@Module({
	controllers: [RecommendationController],
	// Providers available within this module
	providers: [RatingAggregatorService],
	// Export the service so other modules (e.g. a future RecommendationController can use it)
	exports: [RatingAggregatorService],
})
export class RecommendationModule {}