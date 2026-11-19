import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  findAll() {
    return this.prisma.post.findMany({
      include: { author: { select: { id: true, username: true } }, images: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFeed(viewerId: string, cursor?: string, requestedLimit = 8, authorId?: string) {
    const limit = Math.min(Math.max(requestedLimit, 1), 20);
    const friendships = await this.prisma.friendship.findMany({
      where: { OR: [{ senderId: viewerId }, { receiverId: viewerId }] },
      select: { id: true, senderId: true, receiverId: true, status: true },
    });
    const acceptedFriendships = await this.prisma.friendship.findMany({
      where: { status: 'ACCEPTED', OR: [{ senderId: viewerId }, { receiverId: viewerId }] },
      select: { senderId: true, receiverId: true },
    });
    const friendIds = acceptedFriendships.map((friendship) => friendship.senderId === viewerId ? friendship.receiverId : friendship.senderId);
    const visiblePosts = { OR: [{ authorId: viewerId }, { author: { isPrivate: false } }, { authorId: { in: friendIds } }] };
    const posts = await this.prisma.post.findMany({
      where: authorId ? { AND: [visiblePosts, { authorId }] } : visiblePosts,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      take: limit + 1,
      include: { author: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } }, images: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    return {
      items: items.map((post) => ({
        ...post,
        friendship: post.author.id === viewerId
          ? { status: 'SELF', requestId: null }
          : friendships.find((friendship) => friendship.senderId === post.author.id || friendship.receiverId === post.author.id)
            ? {
              status: friendships.find((friendship) => friendship.senderId === post.author.id || friendship.receiverId === post.author.id)?.status,
              requestId: friendships.find((friendship) => friendship.senderId === post.author.id || friendship.receiverId === post.author.id)?.id,
            }
            : { status: 'NONE', requestId: null },
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, username: true } }, images: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(authorId: string, dto: CreatePostDto) {
    dto.imageUrls?.forEach((url) => this.assertPostImageUrl(url));
    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        authorId,
        images: dto.imageUrls ? { create: dto.imageUrls.map((url) => ({ url })) } : undefined,
      },
      include: { author: { select: { id: true, username: true } }, images: true },
    });
    await this.emitMentions(authorId, dto.content);
    return post;
  }

  async like(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.postLike.findUnique({ where: { postId_userId: { postId, userId } } });
    if (existing) return { liked: true };

    await this.prisma.postLike.create({ data: { postId, userId } });

    if (post.authorId !== userId) {
      this.eventEmitter.emit('notification.create', {
        senderId: userId,
        receiverId: post.authorId,
        type: 'like',
        message: 'A alguien le ha gustado tu publicación.',
      });
    }
    return { liked: true };
  }

  async unlike(postId: string, userId: string) {
    await this.prisma.postLike.deleteMany({ where: { postId, userId } });

    return { liked: false };
  }

  private async emitMentions(senderId: string, content: string) {
    const usernames = [...content.matchAll(/@([a-zA-Z0-9_-]+)/g)].map((match) => match[1]);
    if (!usernames.length) return;

    const users = await this.prisma.user.findMany({
      where: { username: { in: usernames }, NOT: { id: senderId } },
      select: { id: true, username: true },
    });
    
    users.forEach((user) => this.eventEmitter.emit('notification.create', {
      senderId,
      receiverId: user.id,
      type: 'mention',
      message: `Te han mencionado en una publicación.`,
    }));
  }

  async update(id: string, authorId: string, dto: UpdatePostDto) {
    await this.assertOwner(id, authorId);
    dto.imageUrls?.forEach((url) => this.assertPostImageUrl(url));
    return this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        ...(dto.imageUrls
          ? { images: { deleteMany: {}, create: dto.imageUrls.map((url) => ({ url })) } }
          : {}),
      },
      include: { author: { select: { id: true, username: true } }, images: true },
    });
  }

  async remove(id: string, authorId: string) {
    await this.assertOwner(id, authorId);
    return this.prisma.post.delete({ where: { id } });
  }

  async addImage(id: string, authorId: string, url: string) {
    await this.assertOwner(id, authorId);
    this.assertPostImageUrl(url);
    return this.prisma.postImage.create({ data: { postId: id, url } });
  }

  async removeImage(postId: string, imageId: string, authorId: string) {
    await this.assertOwner(postId, authorId);
    const image = await this.prisma.postImage.findFirst({ where: { id: imageId, postId } });
    if (!image) throw new NotFoundException('Post image not found');
    return this.prisma.postImage.delete({ where: { id: imageId } });
  }

  private async assertOwner(id: string, authorId: string) {
    const post = await this.prisma.post.findUnique({ where: { id }, select: { authorId: true } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== authorId) throw new ForbiddenException('You can only edit your own posts');
  }

  private assertPostImageUrl(url: string) {
    if (!/^(\/uploads\/posts\/[A-Za-z0-9._-]+|https?:\/\/[^\s]+)$/.test(url)) {
      throw new BadRequestException('The image URL must be a local upload path or an HTTP(S) URL');
    }
  }
}
