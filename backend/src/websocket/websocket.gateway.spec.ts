import { jest } from '@jest/globals';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WebsocketGateway } from './websocket.gateway.js';

describe('WebsocketGateway direct messages', () => {
  it('creates a persistent notification for the receiver', async () => {
    const savedMessage = {
      id: 'message-1',
      senderId: 'sender-1',
      receiverId: 'receiver-1',
      text: 'Hello',
    };
    const messagesService = {
      createMessage: jest.fn().mockResolvedValue(savedMessage),
    };
    const eventEmitter = {
      emit: jest.fn(),
    };
    const receiverSocket = { send: jest.fn() };
    const senderSocket = { send: jest.fn() };
    const presenceService = {
      getUserSockets: jest.fn((userId: string) => (
        userId === 'receiver-1'
          ? new Set([receiverSocket])
          : new Set([senderSocket])
      )),
    };
    const gateway = new WebsocketGateway(
      presenceService as never,
      {} as never,
      messagesService as never,
      eventEmitter as unknown as EventEmitter2,
    );

    await gateway.handleDirectMessage(
      { receiverId: 'receiver-1', text: 'Hello' },
      { userId: 'sender-1' },
    );

    expect(eventEmitter.emit).toHaveBeenCalledWith('notification.create', {
      senderId: 'sender-1',
      receiverId: 'receiver-1',
      type: 'message',
      message: 'Has recibido un nuevo mensaje.',
    });
    expect(receiverSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ event: 'chat:receive', data: savedMessage }),
    );
  });
});
