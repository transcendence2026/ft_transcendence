import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RestaurantsController } from './restaurants.controller.js';
import { RestaurantsService } from './restaurants.service.js';

@Module({
	controllers: [RestaurantsController],
	providers: [RestaurantsService, PrismaService],
})
export class RestaurantsModule {}