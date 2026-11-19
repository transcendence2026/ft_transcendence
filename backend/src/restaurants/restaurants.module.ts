import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RestaurantsController } from './restaurants.controller.js';
import { RestaurantsService } from './restaurants.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
	imports: [AuthModule],
	controllers: [RestaurantsController],
	providers: [RestaurantsService, PrismaService],
})
export class RestaurantsModule {}