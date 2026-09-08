import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import WebSocket from 'ws';
import { PresenceService, RoomService } from './websocket.service.js';
import jwt from 'jsonwebtoken';

export type Client = {
  userId?: string;
};

type ConnectedClient = WebSocket & Client;

type MessagePayload = {
  roomName: string, 
  message: string
}


@WebSocketGateway()
export class WebsocketGateway {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly roomService: RoomService,
  ) {}
  private readonly logger = new Logger(WebsocketGateway.name);

  handleConnection(client: ConnectedClient, request: any) {
    const token = request.headers?.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      client.close(1008, "Token manquant")
      return;
    }
    
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET as string);
      
      if (typeof payload === 'string' || (!payload.id && !payload.sub)) {
        client.close(1008, "Token manquant")
        throw new Error('Token invalido');
      }

      const userId = String(payload.id ?? payload.sub);
      
      client.userId = userId;
      this.presenceService.addClient(userId, client);
      this.logger.log('Un nuevo cliente se ha conectado.');

      client.send('Bienvenido al WebSocket !');
    } catch {
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
  handleMessage(@MessageBody() data: MessagePayload) {
    this.broadcastToRoom(data.roomName, data.message)
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: MessagePayload, @ConnectedSocket() client: Client) {
    if (!client.userId) {
      return;
    }

    this.roomService.joinRoom(client.userId, data.roomName)
  }
}