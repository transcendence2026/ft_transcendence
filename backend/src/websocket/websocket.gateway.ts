import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import WebSocket from 'ws';
import { PresenceService, RoomService } from './websocket.service.js';
import jwt from 'jsonwebtoken';
import { DirectMessageDto, MessagePayloadDto } from './dto/messagePayload.dto.js';
import { MessagesService } from '../messages/messages.service.js';

export type Client = {
  userId?: string;
};

export type ConnectedClient = WebSocket & Client;

@WebSocketGateway()
export class WebsocketGateway {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly roomService: RoomService,
    private readonly messagesService: MessagesService,
  ) {}
  private readonly logger = new Logger(WebsocketGateway.name);

  handleConnection(client: ConnectedClient, request: any) {
    let token: string | undefined;

    const cookieHeader = request.headers?.cookie;
    if (cookieHeader) {
      const match = cookieHeader
        .split(';')
        .map((c: string) => c.trim())
        .find((c: string) => c.startsWith('accessToken='));
      if (match) {
        token = match.split('=')[1];
      }
    }

    if (!token && request.url?.includes('token=')) {
      token = request.url.split('token=')[1]?.split('&')[0];
    }

    if (!token) {
      this.logger.warn('WebSocket: Token ausente en cookies o URL');
      client.close(1008, 'Token manquant');
      return;
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET as string);

      if (typeof payload === 'string' || (!payload.id && !payload.sub)) {
        client.close(1008, 'Token invalido');
        return;
      }

      const userId = String(payload.id ?? payload.sub);

      client.userId = userId;
      this.presenceService.addClient(userId, client);
      this.logger.log(`Cliente WebSocket autenticado: ${userId}`);

      client.send('Bienvenido al WebSocket !');
    } catch {
      this.logger.warn('WebSocket: Token inválido o expirado');
      client.close(1008, 'Token invalido');
    }
  }

  handleDisconnect(client: ConnectedClient) {
    if (!client.userId) {
      return;
    }

    this.presenceService.removeClient(client.userId, client);

    this.logger.log('Le client a fermé la page ou perdu la connexion.');
  }

  broadcastToRoom(roomName: string, message: string) {
    const userList = this.roomService.getUsersInRoom(roomName)

    userList?.forEach((userId) => {
      this.presenceService.getUserSockets(userId)?.forEach((socket) => socket.send(message));
    })
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: MessagePayloadDto) {
    this.broadcastToRoom(data.roomName, data.message)
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: MessagePayloadDto, @ConnectedSocket() client: Client) {
    if (!client.userId) {
      return;
    }

    this.roomService.joinRoom(client.userId, data.roomName)
  }

  @SubscribeMessage('chat:message')
  async handleDirectMessage(@MessageBody() data: DirectMessageDto, @ConnectedSocket() client: Client) {
    if (!client.userId) {
      return;
    }

    const savedMessage = await this.messagesService.createMessage(client.userId, data.receiverId, data.text)

    const receiver = this.presenceService.getUserSockets(data.receiverId)
    const senderId = this.presenceService.getUserSockets(client.userId)

    receiver?.forEach((user) => {
      user.send(JSON.stringify({ event: 'chat:receive', data: savedMessage }));
    })

    senderId?.forEach((user) => {
      user.send(JSON.stringify({ event: 'chat:receive', data: savedMessage }));
    })

  }
}