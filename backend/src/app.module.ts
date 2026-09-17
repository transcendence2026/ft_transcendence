import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module.js';
import { join } from 'path';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { WebsocketGateway } from './websocket/websocket.gateway.js';
import { PresenceService, RoomService } from './websocket/websocket.service.js';
import { UsersModule } from './users/users.module.js'; // <-- Importante

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    MessagesModule,
    HealthModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }), 
  ],
  providers: [WebsocketGateway, PresenceService, RoomService],
})
export class AppModule {}