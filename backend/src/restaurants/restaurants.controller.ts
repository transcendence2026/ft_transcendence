import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SearchController } from '../search/search.controller.js';
import { RecommendationController } from '../recommendation/recommendation.controller.js';
import { RestaurantsService } from './restaurants.service.js';

@Controller('restaurants')
// @UseGuards(JwtAuthGuard)
export class RestaurantsController {
	constructor(private readonly restaurants: RestaurantsService) {}

	@Get(':id')
	findOne(@Param('id', ParseUUIDPipe) id: string) {
		return this.restaurants.findOne(id);
	}
}