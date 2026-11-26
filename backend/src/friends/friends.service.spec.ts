import { jest } from '@jest/globals';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FriendshipStatus } from '@prisma/client';
import { FriendsService } from './friends.service.js';

describe('FriendsService notifications', () => {
  it('notifies the requester when their request is accepted', async () => {
    const request = {
      id: 'request-1',
      senderId: 'requester-1',
      receiverId: 'accepter-1',
      status: FriendshipStatus.PENDING,
    };
    const prisma = {
      friendship: {
        findUnique: jest.fn().mockResolvedValue(request),
        update: jest.fn().mockResolvedValue({
          ...request,
          status: FriendshipStatus.ACCEPTED,
        }),
      },
    };
    const eventEmitter = { emit: jest.fn() };
    const service = new FriendsService(prisma as never, eventEmitter as unknown as EventEmitter2);

    await service.acceptRequest('request-1', 'accepter-1');

    expect(eventEmitter.emit).toHaveBeenCalledWith('notification.create', {
      senderId: 'accepter-1',
      receiverId: 'requester-1',
      type: 'friend_accepted',
      message: 'Tu solicitud de amistad ha sido aceptada.',
    });
  });
});
