import { jest } from '@jest/globals';
import { NotificationGateway } from './notification.gateway.js';

describe('NotificationGateway dismiss', () => {
  it('succeeds when the notification was already removed', async () => {
    const deleteMany = jest.fn<
      (args: { where: { id: string; receiverId: string } }) => Promise<{ count: number }>
    >().mockResolvedValue({ count: 0 });
    const prisma = { notification: { deleteMany } };
    const presence = { getUserSockets: jest.fn() };
    const gateway = new NotificationGateway(prisma as never, presence as never);

    await expect(gateway.dismiss('notification-1', 'user-1')).resolves.toEqual({
      dismissed: true,
    });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: 'notification-1', receiverId: 'user-1' },
    });
  });
});
