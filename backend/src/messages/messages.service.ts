import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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

  async findConversations(userId: string, archived = false) {
    const [messages, archivedConversations] = await Promise.all([
      this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      select: {
        senderId: true,
        receiverId: true,
        text: true,
        createdAt: true,
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } },
      },
      }),
      this.prisma.conversationArchive.findMany({
        where: { userId },
        select: { peerId: true },
      }),
    ]);
    const archivedPeerIds = new Set(archivedConversations.map(({ peerId }) => peerId));

    const conversations = new Map<string, {
      userId: string;
      username: string;
      lastMessage: string;
      lastMessageAt: Date;
    }>();

    for (const message of messages) {
      const peer = message.senderId === userId ? message.receiver : message.sender;
      if (!conversations.has(peer.id)) {
        conversations.set(peer.id, {
          userId: peer.id,
          username: peer.username,
          lastMessage: message.text,
          lastMessageAt: message.createdAt,
        });
      }
    }

    return [...conversations.values()].filter(
      (conversation) => archivedPeerIds.has(conversation.userId) === archived,
    );
  }

  async archiveConversation(userId: string, peerId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: peerId },
          { senderId: peerId, receiverId: userId },
        ],
      },
      select: { id: true },
    });
    if (!message) throw new NotFoundException('Conversation not found');

    return this.prisma.conversationArchive.upsert({
      where: { userId_peerId: { userId, peerId } },
      create: { userId, peerId },
      update: {},
    });
  }

  unarchiveConversation(userId: string, peerId: string) {
    return this.prisma.conversationArchive.deleteMany({
      where: { userId, peerId },
    });
  }

  async createMessage(senderId: string, receiverId: string, text: string) {
    return await this.prisma.message.create({ data: { senderId, receiverId, text }});
  }
  
}