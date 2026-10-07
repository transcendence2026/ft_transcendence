import { ConflictException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UsersService {

  private readonly logger = new Logger(UsersService.name);

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

async updateAvatar(userId: string, newAvatarUrl: string) {
    // 1. Verificamos que el usuario exista en la base de datos y leemos su perfil previo
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Si tenía una foto previa y es distinta de la nueva, la eliminamos físicamente del disco
    const previousAvatarUrl = user.profile?.avatarUrl;

    if (previousAvatarUrl && previousAvatarUrl !== newAvatarUrl) {
      this.deleteOldAvatarFile(previousAvatarUrl);
    }

    // 3. con upsers actualizamos o creamos la propiedad avatarUrl dentro del perfil (Profile)
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: { avatarUrl: newAvatarUrl },
            update: { avatarUrl: newAvatarUrl }, // <--  para que apunte al campo avatarUrl
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
        profile: true,
      },
    });

    return updatedUser;
  }

  private deleteOldAvatarFile(avatarUrl: string) {
    try {
      // Si la URL es remota (http/https) o es el avatar por defecto del sistema, NO la borramos del disco
      if (avatarUrl.startsWith('http') || avatarUrl.includes('default-avatar')) {
        return;
      }

      // Quitamos la barra "/" inicial si la tiene (convierte "/uploads/avatars/..." en "uploads/avatars/...")
      const relativePath = avatarUrl.startsWith('/') ? avatarUrl.substring(1) : avatarUrl;

      // Calculamos la ruta absoluta completa en el sistema operativo del servidor
      // path.join une el directorio actual de ejecución (process.cwd()) con la ruta relativa del archivo
      const absolutePath = path.join(process.cwd(), relativePath);

      // Verificamos con fs.existsSync si el archivo existe físicamente en el disco duro del servidor
      if (fs.existsSync(absolutePath)) {
        // fs.unlinkSync borra el archivo del disco de forma síncrona
        fs.unlinkSync(absolutePath);

        // Imprimimos un log verde en la consola indicando que se limpió el archivo huérfano
        this.logger.log(`Avatar anterior eliminado con éxito: ${relativePath}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Usamos logger.warn para capturar cualquier fallo de permisos o del disco sin detener la ejecución de la app
      this.logger.warn(`No se pudo eliminar el avatar anterior (${avatarUrl}): ${message}`);
    }
  }
}