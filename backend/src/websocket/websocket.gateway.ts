import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import WebSocket from 'ws';
import { PresenceService, RoomService } from './websocket.service.js';
import jwt from 'jsonwebtoken';
import { MessagePayloadDto } from './dto/messagePayload.dto.js';

export type Client = {
  userId?: string;
};

export type ConnectedClient = WebSocket & Client;

@WebSocketGateway()
export class WebsocketGateway {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly roomService: RoomService,
  ) {}
  private readonly logger = new Logger(WebsocketGateway.name);

  handleConnection(client: ConnectedClient, request: any) {
	console.log('>>> [WS CONNECT] Petición recibida en URL:', request?.url);
    // 1. Extraemos el token de la cookie HttpOnly
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

    // 2. Soporte opcional para query param si viniera por URL
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
}