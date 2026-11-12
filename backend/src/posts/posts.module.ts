import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [AuthModule, EventEmitterModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
