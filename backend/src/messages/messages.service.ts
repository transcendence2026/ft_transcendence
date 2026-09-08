import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class MessagesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      select: { text: true, sender: true, createdAt: true },
    }).then((messages) => messages.map(({ createdAt, ...message }) => ({ ...message, created_at: createdAt })));
  }
}