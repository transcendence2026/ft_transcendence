import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { WebsocketGateway } from './websocket/websocket.gateway.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    MessagesModule,
    HealthModule,
  ],
  providers: [WebsocketGateway],
})
export class AppModule {}