import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { MessagesService } from './messages.service.js';

describe('MessagesService conversations', () => {
  it('returns each peer conversation using its latest message', async () => {
    const newest = new Date('2026-11-25T10:00:00.000Z');
    const older = new Date('2026-11-24T10:00:00.000Z');
    const messages = [
      {
        senderId: 'me',
        receiverId: 'friend-1',
        text: 'Latest with friend 1',
        createdAt: newest,
        sender: { id: 'me', username: 'me' },
        receiver: { id: 'friend-1', username: 'friend1' },
      },
      {
        senderId: 'friend-2',
        receiverId: 'me',
        text: 'Latest with friend 2',
        createdAt: older,
        sender: { id: 'friend-2', username: 'friend2' },
        receiver: { id: 'me', username: 'me' },
      },
      {
        senderId: 'friend-1',
        receiverId: 'me',
        text: 'Older with friend 1',
        createdAt: older,
        sender: { id: 'friend-1', username: 'friend1' },
        receiver: { id: 'me', username: 'me' },
      },
    ];
    const prisma = {
      message: {
        findMany: jest.fn().mockResolvedValue(messages),
      },
      conversationArchive: {
        findMany: jest.fn().mockResolvedValue([{ peerId: 'friend-1' }]),
      },
    };
    const service = new MessagesService(prisma as never);

    await expect(service.findConversations('me')).resolves.toEqual([
      {
        userId: 'friend-2',
        username: 'friend2',
        lastMessage: 'Latest with friend 2',
        lastMessageAt: older,
      },
    ]);
    expect(prisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [{ senderId: 'me' }, { receiverId: 'me' }] },
      orderBy: { createdAt: 'desc' },
    }));

    await expect(service.findConversations('me', true)).resolves.toEqual([
      {
        userId: 'friend-1',
        username: 'friend1',
        lastMessage: 'Latest with friend 1',
        lastMessageAt: newest,
      },
    ]);
  });

  it('creates an archive entry only for an existing conversation', async () => {
    const prisma = {
      message: { findFirst: jest.fn().mockResolvedValue({ id: 'message-1' }) },
      conversationArchive: { upsert: jest.fn().mockResolvedValue({ userId: 'me', peerId: 'friend-1' }) },
    };
    const service = new MessagesService(prisma as never);

    await expect(service.archiveConversation('me', 'friend-1')).resolves.toEqual({
      userId: 'me',
      peerId: 'friend-1',
    });
    expect(prisma.conversationArchive.upsert).toHaveBeenCalledWith({
      where: { userId_peerId: { userId: 'me', peerId: 'friend-1' } },
      create: { userId: 'me', peerId: 'friend-1' },
      update: {},
    });

    prisma.message.findFirst.mockResolvedValue(null);
    await expect(service.archiveConversation('me', 'unknown')).rejects.toBeInstanceOf(NotFoundException);
  });
});
