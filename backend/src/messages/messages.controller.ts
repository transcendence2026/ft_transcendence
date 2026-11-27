import { Controller, Delete, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('api/message')
export class MessagesController {
  constructor(@Inject(MessagesService) private readonly messagesService: MessagesService) {}

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  findConversations(@Req() req: any, @Query('archived') archived?: string) {
    return this.messagesService.findConversations(req.user.id, archived === 'true');
  }

  @UseGuards(JwtAuthGuard)
  @Post('conversations/:peerId/archive')
  archiveConversation(@Req() req: any, @Param('peerId') peerId: string) {
    return this.messagesService.archiveConversation(req.user.id, peerId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('conversations/:peerId/archive')
  unarchiveConversation(@Req() req: any, @Param('peerId') peerId: string) {
    return this.messagesService.unarchiveConversation(req.user.id, peerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":friendId")
  findConversation(@Req() req: any, @Param('friendId') id: string) {
    return this.messagesService.findConversation(req.user.id, id);
  }
}