import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import WebSocket from 'ws';
import { PresenceService, RoomService } from './websocket.service.js';
import jwt from 'jsonwebtoken';

export type Client = {
  socket: WebSocket;
  userId: string;
};

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

  handleConnection(client: Client, request: any) {
    const token = request.headers.authorization

    if (!token) {
      client.socket.close(1008, "Token manquant")
      return;
    }
    
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET as string);
      
      if (typeof payload === 'string' || !payload.sub) {
        client.socket.close(1008, "Token manquant")
        throw new Error('Token invalido');
      }

      const userId = payload.sub.toString();
      
      client.userId = userId;
      this.presenceService.addClient(userId, client.socket);
      this.logger.log('Un nuevo cliente se ha conectado.');

      client.socket.send('Bienvenido al WebSocket !');
    } catch {
      client.socket.close(1008, 'Token invalido');
    }
  }
  
  handleDisconnect(client: Client, request: any) {

    this.presenceService.removeClient(client.userId, client.socket);

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
    this.roomService.joinRoom(client.userId, data.roomName)
  }
}