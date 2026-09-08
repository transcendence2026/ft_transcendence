import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { WebsocketGateway } from './websocket/websocket.gateway.js';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URL ?? 'mongodb://db:27017', { dbName: process.env.MONGO_DB ?? 'transcendence' }),
    AuthModule,
    MessagesModule,
    HealthModule,
  ],
  providers: [WebsocketGateway],
})
export class AppModule {}