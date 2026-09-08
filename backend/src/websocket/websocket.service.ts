import { Injectable } from "@nestjs/common";
import WebSocket from "ws";

@Injectable()
export class PresenceService {
  private readonly activeSockets: Map<string, Set<WebSocket>> = new Map();

  addClient(userId: string, socket: WebSocket) {    
    if (!this.activeSockets.has(userId)) {
      this.activeSockets.set(userId, new Set());
    }

    this.activeSockets.get(userId)?.add(socket);
  }

  removeClient(userId: string, socket: WebSocket) {
    const userSocket = this.activeSockets.get(userId);

    if (userSocket) {
      userSocket.delete(socket)
      
      if (userSocket.size === 0)
        this.activeSockets.delete(userId);
    }
  }
}