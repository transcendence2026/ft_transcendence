import { Inject, Injectable, NotFoundException } from "@nestjs/common";
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

        if (isBlocked) return;

        const notification = await this.prisma.notification.create({
            data: { senderId, receiverId, type, message, requestId },
        });
        this.sendNotification(notification);
    }

    async findForUser(receiverId: string) {
        return this.prisma.notification.findMany({
            where: { receiverId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    async markAsRead(id: string, receiverId: string) {
        const notification = await this.prisma.notification.findFirst({ where: { id, receiverId } });
        if (!notification) throw new NotFoundException('Notification not found');
        return this.prisma.notification.update({ where: { id }, data: { read: true } });
    }

    markAllAsRead(receiverId: string) {
        return this.prisma.notification.updateMany({
            where: { receiverId, read: false },
            data: { read: true },
        });
    }

    private sendNotification(notification: {
        id: string;
        type: string;
        message: string;
        senderId: string;
        receiverId: string;
        requestId: string | null;
        read: boolean;
        createdAt: Date;
    }) {
        this.presence.getUserSockets(notification.receiverId)?.forEach((socket) => socket.send(JSON.stringify({
            event: 'notification',
            data: notification,
        })));
    }
}