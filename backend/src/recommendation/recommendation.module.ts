import { Module } from '@nestjs/common';
import { RatingAggregatorService } from './rating-aggregator';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';

@Module({
	controllers: [RecommendationController],
	// Providers available within this module
	providers: [RatingAggregatorService, RecommendationService],
	// Export the service so other modules (e.g. a future RecommendationController can use it)
	exports: [RatingAggregatorService, RecommendationService],
})
export class RecommendationModule {}