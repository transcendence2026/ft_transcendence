import { Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { FriendsService } from './friends.service.js';

@UseGuards(JwtAuthGuard)
@Controller('api/friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  list(@Req() req: any) { return this.friendsService.list(req.user.id); }

  @Post('requests/:userId')
  sendRequest(@Req() req: any, @Param('userId') userId: string) { return this.friendsService.sendRequest(req.user.id, userId); }

  @Patch('requests/:requestId/accept')
  accept(@Req() req: any, @Param('requestId') requestId: string) { return this.friendsService.acceptRequest(requestId, req.user.id); }

  @Patch('requests/:requestId/reject')
  reject(@Req() req: any, @Param('requestId') requestId: string) { return this.friendsService.rejectRequest(requestId, req.user.id); }

  @Delete('requests/:requestId')
  cancel(@Req() req: any, @Param('requestId') requestId: string) { return this.friendsService.cancelRequest(requestId, req.user.id); }
}
