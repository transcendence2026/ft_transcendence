import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "../database/prisma.service";
import { CreateNotificationDto } from "./dto/createNotifcation.dto";
import { PresenceService } from "../websocket/websocket.service";


@Injectable()
export class NotificationGateway {
    constructor(
        @Inject(PrismaService) private readonly prisma: PrismaService,
        @Inject(PresenceService) private readonly presence: PresenceService
    ) {}
    
    @OnEvent('notification.create')
    async handleCreateNotification({ senderId, receiverId, type, message } : CreateNotificationDto) {
        const isBlocked = await this.prisma.block.findFirst({ where: { blockedId: senderId, blockerId: receiverId } })

        if (!isBlocked) {
            this.presence.getUserSockets(receiverId)?.forEach((socket) => socket.send(JSON.stringify({ event: 'notification', data: { type, message, senderId } })));
        }
    }
}