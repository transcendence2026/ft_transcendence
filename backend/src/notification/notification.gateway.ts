import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateNotificationDto } from "./dto/createNotifcation.dto.js";
import { PresenceService } from "../websocket/websocket.service.js";


@Injectable()
export class NotificationGateway {
    constructor(
        @Inject(PrismaService) private readonly prisma: PrismaService,
        @Inject(PresenceService) private readonly presence: PresenceService
    ) {}
    
    @OnEvent('notification.create')
    async handleCreateNotification({ senderId, receiverId, type, message, requestId } : CreateNotificationDto) {
        const isBlocked = await this.prisma.block.findFirst({ where: { blockedId: senderId, blockerId: receiverId } })

        if (!isBlocked) {
            this.presence.getUserSockets(receiverId)?.forEach((socket) => socket.send(JSON.stringify({
                event: 'notification',
                data: { type, message, senderId, requestId },
            })));
        }
    }
}