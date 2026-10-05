import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PostsModule } from '../posts/posts.module.js';
import { SocialController } from './social.controller.js';

@Module({
  imports: [AuthModule, PostsModule],
  controllers: [SocialController],
})
export class SocialModule {}