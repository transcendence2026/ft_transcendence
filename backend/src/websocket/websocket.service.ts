import { Injectable } from "@nestjs/common";
import WebSocket from "ws";

@Injectable()
export class PresenceService {
  private readonly activeSockets: Map<string, Set<WebSocket>> = new Map();

  addClient(userId: string, client: WebSocket) {    
    if (!this.activeSockets.has(userId)) {
      this.activeSockets.set(userId, new Set());
    }

    this.activeSockets.get(userId)?.add(client);
  }

  removeClient(userId: string, client: WebSocket) {
    const userSocket = this.activeSockets.get(userId);

    if (userSocket) {
      userSocket.delete(client)
      
      if (userSocket.size === 0)
        this.activeSockets.delete(userId);
    }
  }

  getUserSockets(userId: string) {
    return this.activeSockets.get(userId)
  }
}

@Injectable()
export class RoomService {
  private readonly channels: Map<string, Set<string>> = new Map();

  joinRoom(userId: string, roomName: string) {
    if (!this.channels.has(roomName))
      this.channels.set(roomName, new Set())

    this.channels.get(roomName)?.add(userId);
  }

  leaveRoom(userId: string, roomName: string) {
    const room = this.channels.get(roomName)

    if (room) {
      room.delete(userId);
  
      if (room.size === 0)
        this.channels.delete(roomName);
    }
  }

  getUsersInRoom(roomName: string) {
    return this.channels.get(roomName)
  }
}