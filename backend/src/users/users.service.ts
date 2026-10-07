import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      status: user.status,
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
}