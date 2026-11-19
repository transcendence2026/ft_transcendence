import { RoomService } from './websocket.service.js';

describe('RoomService', () => {
  it('tracks users in rooms and removes empty rooms', () => {
    const service = new RoomService();

    service.joinRoom('user-1', 'chat-1');
    service.joinRoom('user-1', 'chat-1');
    service.joinRoom('user-2', 'chat-1');

    expect(service.getUsersInRoom('chat-1')).toEqual(new Set(['user-1', 'user-2']));

    service.leaveRoom('user-1', 'chat-1');
    expect(service.getUsersInRoom('chat-1')).toEqual(new Set(['user-2']));

    service.leaveRoom('user-2', 'chat-1');
    expect(service.getUsersInRoom('chat-1')).toBeUndefined();
  });

  it('ignores leaving a room that does not exist', () => {
    const service = new RoomService();

    expect(() => service.leaveRoom('user-1', 'missing-room')).not.toThrow();
  });
});
