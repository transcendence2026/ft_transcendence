import { Controller, Get, Inject } from '@nestjs/common';
import { MessagesService } from './messages.service.js';

@Controller('api/message')
export class MessagesController {
  constructor(@Inject(MessagesService) private readonly messagesService: MessagesService) {}

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }
}