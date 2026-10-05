import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service'; // Ajusta la ruta a tu PrismaService
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
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

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      profile: user.profile,
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

  async updateAvatar(userId: string, filename: string) {
    const avatarUrl = `/uploads/avatars/${filename}`;

    // 1. Verificamos que el usuario exista en la base de datos
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`El usuario con ID ${userId} no existe`);
    }

    // 2. Actualizamos el campo avatarUrl DENTRO del modelo Profile relacionado
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            // Si el perfil no existe, lo crea con la foto
            create: {
              avatarUrl: avatarUrl,
            },
            // Si el perfil ya existe, actualiza solo el avatarUrl
            update: {
              avatarUrl: avatarUrl,
            },
          },
        },
      },
      include: {
        profile: true, // Incluye el perfil actualizado en la respuesta
      },
    });
  }
}