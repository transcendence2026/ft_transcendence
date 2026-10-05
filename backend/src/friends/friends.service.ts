import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, FriendshipStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';

const userSummary = { id: true, username: true, profile: { select: { avatarUrl: true } } } as const;

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) throw new ConflictException('You cannot add yourself');
    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } });
    if (!receiver) throw new NotFoundException('User not found');

    const existing = await this.prisma.friendship.findFirst({
      where: { OR: [{ senderId, receiverId }, { senderId: receiverId, receiverId: senderId }] },
    });
    if (existing?.status === FriendshipStatus.ACCEPTED) throw new ConflictException('You are already friends');
    if (existing?.status === FriendshipStatus.PENDING) throw new ConflictException('A friendship request already exists');

    try {
      if (existing) {
        return await this.prisma.friendship.update({
          where: { id: existing.id },
          data: { senderId, receiverId, status: FriendshipStatus.PENDING },
          include: { receiver: { select: userSummary } },
        });
      }
      return await this.prisma.friendship.create({
        data: { senderId, receiverId },
        include: { receiver: { select: userSummary } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A friendship request already exists');
      }
      throw error;
    }
  }

  async acceptRequest(requestId: string, receiverId: string) {
    const request = await this.prisma.friendship.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Friendship request not found');
    if (request.receiverId !== receiverId) throw new ForbiddenException('Only the receiver can accept this request');
    if (request.status !== FriendshipStatus.PENDING) throw new ConflictException('This request is no longer pending');
    return this.prisma.friendship.update({ where: { id: requestId }, data: { status: FriendshipStatus.ACCEPTED }, include: { sender: { select: userSummary } } });
  }

  async rejectRequest(requestId: string, receiverId: string) {
    const request = await this.prisma.friendship.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Friendship request not found');
    if (request.receiverId !== receiverId) throw new ForbiddenException('Only the receiver can reject this request');
    if (request.status !== FriendshipStatus.PENDING) throw new ConflictException('This request is no longer pending');
    return this.prisma.friendship.update({ where: { id: requestId }, data: { status: FriendshipStatus.DECLINED } });
  }

  async cancelRequest(requestId: string, senderId: string) {
    const request = await this.prisma.friendship.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Friendship request not found');
    if (request.senderId !== senderId) throw new ForbiddenException('Only the sender can cancel this request');
    if (request.status !== FriendshipStatus.PENDING) throw new ConflictException('This request is no longer pending');
    return this.prisma.friendship.delete({ where: { id: requestId } });
  }

  async list(userId: string) {
    const relations = await this.prisma.friendship.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      include: { sender: { select: userSummary }, receiver: { select: userSummary } },
      orderBy: { updatedAt: 'desc' },
    });
    return {
      friends: relations.filter((relation) => relation.status === FriendshipStatus.ACCEPTED).map((relation) => relation.senderId === userId ? relation.receiver : relation.sender),
      incomingRequests: relations.filter((relation) => relation.receiverId === userId && relation.status === FriendshipStatus.PENDING),
      outgoingRequests: relations.filter((relation) => relation.senderId === userId && relation.status === FriendshipStatus.PENDING),
    };
  }

  async getRelationship(viewerId: string, profileId: string) {
    if (viewerId === profileId) return { status: 'SELF', requestId: null };
    const relation = await this.prisma.friendship.findFirst({ where: { OR: [{ senderId: viewerId, receiverId: profileId }, { senderId: profileId, receiverId: viewerId }] } });
    if (!relation) return { status: 'NONE', requestId: null };
    if (relation.status === FriendshipStatus.PENDING) return { status: relation.senderId === viewerId ? 'OUTGOING_PENDING' : 'INCOMING_PENDING', requestId: relation.id };
    return { status: relation.status, requestId: relation.id };
  }
}
