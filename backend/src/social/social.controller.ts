import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PostsService } from '../posts/posts.service.js';

@Controller('api/social')
export class SocialController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  feed(@Req() req: any, @Query('cursor') cursor?: string, @Query('limit') limit?: string, @Query('authorId') authorId?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 8;
    return this.postsService.findFeed(req.user.id, cursor, Number.isNaN(parsedLimit) ? 8 : parsedLimit, authorId);
  }
}