import { Controller, Get } from '@nestjs/common';
import { MessagesService } from './messages.service.js';

@Controller('api/message')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }
}