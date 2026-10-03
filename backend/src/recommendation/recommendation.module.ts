import { Module } from '@nestjs/common';
import { RatingAggregatorService } from './rating-aggregator.js';

@Module({
	// Providers available within this module
	providers: [RatingAggregatorService],
	// Export the service so other modules (e.g. a future RecommendationController can use it)
	exports: [RatingAggregatorService],
})
export class RecommendationModule {}