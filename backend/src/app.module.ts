//metemos AuthModule dentro de la AppModule, así cuando arranque la aplicacion,
//enciende tambien el modulo de autenticacion
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js'; //importas la rama
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { WebsocketGateway } from './websocket/websocket.gateway.js';
import { PresenceService, RoomService } from './websocket/websocket.service.js';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
	imports: [
		//ConfigModule: te permite cargar y leer las variables de entorno del .env
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		DatabaseModule,
		PrismaModule,
		AuthModule, //Importa el Modulo de Autenticación
		MessagesModule,
    	HealthModule,
    	EventEmitterModule.forRoot()
		//Modulos siguientes que importaremos cuando se hagan
		//UsersModule,  //Modulo para gesrionar perfiles y datos usuarios
		//ProductsModule, //Modulo para catálogo de tienda
		//OrdersModule, //Modulo para compras y carritos
	],
	controllers: [],
	providers: [WebsocketGateway, PresenceService, RoomService],
})
export class AppModule {}