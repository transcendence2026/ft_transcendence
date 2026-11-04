import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RestaurantsService } from './restaurants.service.js';


@Controller('api/restaurants')
// @UseGuards(JwtAuthGuard)
export class RestaurantsController {
	constructor(private readonly restaurants: RestaurantsService) {}

	@Get(':id')
	findOne(@Param('id', ParseUUIDPipe) id: string) {
		return this.restaurants.findOne(id);
	}

	@Get(':id/favorite')
	@UseGuards(JwtAuthGuard)
	getFavoriteStatus(
		@Req() req: any,
		@Param('id', ParseUUIDPipe) restaurantId: string,
	) {
		return this.restaurants.getFavoriteStatus(req.user.id, restaurantId);
	}

	@Post(':id/favorite')
	@UseGuards(JwtAuthGuard)
	addFavorite(
		@Req() req: any,
		@Param('id', ParseUUIDPipe) restaurantId: string,
	) {
		return this.restaurants.addFavorite(req.user.id, restaurantId);
	}

	@Delete(':id/favorite')
	@UseGuards(JwtAuthGuard)
	removeFavorite(
		@Req() req: any,
		@Param('id', ParseUUIDPipe) restaurantId: string,
	) {
		return this.restaurants.removeFavorite(req.user.id, restaurantId);
	}
}