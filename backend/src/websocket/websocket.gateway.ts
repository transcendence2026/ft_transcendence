import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import WebSocket from 'ws';
import { PresenceService } from './websocket.service.js';

@WebSocketGateway()
export class WebsocketGateway {
  constructor(private readonly presenceService: PresenceService) {}
  private readonly logger = new Logger(WebsocketGateway.name);

  handleConnection(client: WebSocket, request: any) {
    const token = request.headers.authorization

    if (!token) {
      client.close(1008, "Token manquant")
      return;
    }
    const userId = "test_user_id";

    this.presenceService.addClient(userId, client);

    this.logger.log('Un nouveau client vient de se connecter en WS.');

    client.send('Bienvenue sur le WebSocket !');
  }

  handleDisconnect(client: WebSocket) {
    const userId = "test_user_id";

    this.presenceService.removeClient(userId, client);
    
    this.logger.log('Le client a fermé la page ou perdu la connexion.');
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: string, @ConnectedSocket() client: WebSocket) {
    const text = typeof message === 'string' ? message : JSON.stringify(message);

    this.logger.log(`Reçu du client : ${text}`);

    client.send(`J'ai bien reçu ton message : "${text}"`);
  }
}