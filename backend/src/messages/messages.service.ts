import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MessagesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      select: { text: true, sender: true, createdAt: true },
    }).then((messages) => messages.map(({ createdAt, ...message }) => ({ ...message, created_at: createdAt })));
  }

  findConversation(myId: string, friendId: string) {
    return this.prisma.message.findMany({
      where : { OR: [{ senderId: friendId, receiverId: myId  }, { senderId: myId, receiverId: friendId } ]},
      orderBy: { createdAt: 'asc' },
    })
  }

  async createMessage(senderId: string, receiverId: string, text: string) {
    return await this.prisma.message.create({ data: { senderId, receiverId, text }});
  }
  
}