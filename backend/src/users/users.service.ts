import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto';


@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string, viewerId = userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        reviews: {
          include: { dish: { include: { restaurant: true, tags: true } } },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const relationship = userId === viewerId
      ? { status: 'SELF', requestId: null }
      : await this.prisma.friendship.findFirst({
        where: { OR: [{ senderId: viewerId, receiverId: userId }, { senderId: userId, receiverId: viewerId }] },
        select: { id: true, status: true, senderId: true },
      }).then((friendship) => {
        if (!friendship) return { status: 'NONE', requestId: null };
        if (friendship.status === 'PENDING') return { status: friendship.senderId === viewerId ? 'OUTGOING_PENDING' : 'INCOMING_PENDING', requestId: friendship.id };
        return { status: friendship.status, requestId: friendship.id };
      });

	  // Comprobar si el usuario que mira el perfil (viewerId) tiene bloqueado a este usuario (userId)
    const isBlockedByViewer = userId !== viewerId
      ? !!(await this.prisma.block.findUnique({
          where: {
            blockerId_blockedId: { blockerId: viewerId, blockedId: userId },
          },
        }))
      : false;

	  //Regla de privacidad: Si es privado y no es él ni un amigo
	  const isSelf = userId === viewerId;
	  const isFriend = relationship.status === 'ACCEPTED';

	  // CASO 1: Es privado y no soy yo ni un amigo aceptado
	  if(user.isPrivate && !isSelf && !isFriend) {
		return {
        id: user.id,
        username: user.username,
        email: null,                          // Oculto por privacidad
        status: user.status,
        isPrivate: true,                      // Indica al frontend que está bloqueado
        isBlocked: isBlockedByViewer,        //estado de bloqueo
		createdAt: user.createdAt,
        profile: {
          avatarUrl: user.profile?.avatarUrl ?? null,
          bio: null,                          // Oculto por privacidad
        },
        friendship: relationship,
        favoriteDishes: [],                   // Vacío
        stats: null,                          // Nulo para activar el candado en UI
      };
	}
	// CASO 2: Perfil público o consulta propia (return completo)
    return {
      id: user.id,
      username: user.username,
      email: isSelf ? user.email : null, //Solo visible para el dueño
      status: user.status,
	  isPrivate: user.isPrivate,
	  isBlocked: isBlockedByViewer,
      createdAt: user.createdAt,
      profile: user.profile,
      friendship: relationship,
      favoriteDishes: user.reviews
        .sort((first, second) => second.rating - first.rating)
        .slice(0, 3)
        .map((review) => ({
        id: review.dish.id,
        name: review.dish.name,
        restaurant: review.dish.restaurant.name,
        cuisine: review.dish.restaurant.cuisine,
        rating: review.rating,
      })),
      stats: {
        recipesRated: user.reviews.length,
        averageRecipeRating: user.reviews.length
          ? Number((user.reviews.reduce((total, review) => total + review.rating, 0) / user.reviews.length).toFixed(1))
          : 0,
        favoriteIngredients: Object.entries(user.reviews
          .flatMap((review) => review.dish.tags.map((tag) => tag.name).filter(Boolean))
          .reduce<Record<string, number>>((counts, ingredient) => {
            counts[ingredient] = (counts[ingredient] ?? 0) + 1;
            return counts;
          }, {}))
          .sort((first, second) => second[1] - first[1])
          .slice(0, 5)
          .map(([name]) => name),
      },
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    if (data.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: { username: data.username, NOT: { id: userId } },
      });
      if (existingUser) throw new ConflictException('Username already taken');
    }

    if (data.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: data.email, NOT: { id: userId } },
      });
      if (existingUser) throw new ConflictException('Email already registered');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { username: data.username, email: data.email },
    });
    if (data.bio !== undefined) {
      await this.prisma.profile.upsert({
        where: { userId },
        create: { userId, bio: data.bio },
        update: { bio: data.bio },
      });
    }
    return this.getProfile(userId);
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    // 1. Verificamos que el usuario exista en la base de datos
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Actualizamos la propiedad avatarUrl dentro del perfil (Profile) o User
    // avatarUrl vive dentro de Profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: { avatarUrl },
            update: { avatarUrl },
          },
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        isPrivate: true,
        isTwoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        profile: true, // Incluye el perfil actualizado con la nueva avatarUrl
      },
    });

    return updatedUser;
  }
  // Métodos del módulo de bloqueo
  async getBlockedUsers(userId: string) {
    const blocks = await this.prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: { avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return blocks.map((b: any) => ({
      blockId: b.id,
      user: {
        id: b.blocked.id,
        username: b.blocked.username,
        email: b.blocked.email,
        avatarUrl: b.blocked.profile?.avatarUrl ?? null,
      },
    }));
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }

    // 1. Si ya está bloqueado, devolvemos respuesta exitosa sin fallar con 409
    const existing = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });

    if (existing) {
      return { message: 'Already blocked' };
    }
	// 2. Si existía una relación de amistad o solicitud pendiente, se elimina
    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { senderId: blockerId, receiverId: blockedId },
          { senderId: blockedId, receiverId: blockerId },
        ],
      },
    });
	//3. Creamos el registro en el modelo Block
    return this.prisma.block.create({
      data: {
        blockerId,
        blockedId,
      },
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    return this.prisma.block.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    });
  }
}