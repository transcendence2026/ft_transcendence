//metemos AuthModule dentro de la AppModule, así cuando arranque la aplicacion,
//enciende tambien el modulo de autenticacion
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FilesModule } from './files/files.module.js';
import { AuthModule } from './auth/auth.module.js'; //importas la rama
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { WebsocketGateway } from './websocket/websocket.gateway.js';
import { PresenceService, RoomService } from './websocket/websocket.service.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UsersModule } from './users/users.module.js';
import { PostsModule } from './posts/posts.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { SocialModule } from './social/social.module.js';
import { PrivacyModule } from './privacy/privacy.module.js';
import { RecommendationModule } from './recommendation/recommendation.module.js';
import { FriendsModule } from './friends/friends.module.js';
import { RgpdModule } from './rgpd/rgpd.module.js';
import { SearchModule } from './search/search.module.js';
import { NotificationGateway } from './notification/notification.gateway.js';
import { NotificationController } from './notification/notification.controller.js';
import { RestaurantsModule } from './restaurants/restaurants.module.js';

@Module({
	imports: [
		//ConfigModule: allows you to load and read environment variables from the .env file.
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		// Rate Limiting: maximum 100 requests every 60 seconds per IP
		ThrottlerModule.forRoot([
		{
			ttl: 60000, // time in milliseconds (1 minute)
			limit: 100, 
		},
		]),
		PrismaModule,
		AuthModule,
		UsersModule,
		FilesModule,
		PostsModule,
		ReviewsModule,
		SocialModule,
		PrivacyModule,
		RgpdModule,
		RecommendationModule,
		FriendsModule,
		MessagesModule,
    	HealthModule,
		SearchModule,
    	EventEmitterModule.forRoot(),
		RestaurantsModule,
		ServeStaticModule.forRoot({
			rootPath: join(process.cwd(), 'uploads'),
			serveRoot: '/uploads',
		}), 
	],
	controllers: [NotificationController],
	providers: [
		WebsocketGateway,
		PresenceService,
		RoomService,
		NotificationGateway,
		{
		//global guard that intercepts all routes and Apply the limit of 100 calls per minute
		provide: APP_GUARD,
		useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}