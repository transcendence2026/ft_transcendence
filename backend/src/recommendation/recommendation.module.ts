import { Module } from '@nestjs/common';
import { RatingAggregatorService } from './rating-aggregator.js';
import { RecommendationController } from './recommendation.controller.js';
import { RecommendationService } from './recommendation.service.js';
import { VectorCacheService } from './vector-cache.service.js';

@Module({
	controllers: [RecommendationController],
	// Providers available within this module
	providers: [RatingAggregatorService, RecommendationService, VectorCacheService],
	// Export the service so other modules (e.g. a future RecommendationController can use it)
	exports: [RatingAggregatorService, RecommendationService, VectorCacheService],
})
export class RecommendationModule {}