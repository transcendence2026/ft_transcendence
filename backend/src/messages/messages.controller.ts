import { Controller, Get, Inject, Param, Req, UseGuards } from '@nestjs/common';
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
  @Get(":friendId")
  findConversation(@Req() req: any, @Param('friendId') id: string) {
    return this.messagesService.findConversation(req.user.id, id);
  }
}