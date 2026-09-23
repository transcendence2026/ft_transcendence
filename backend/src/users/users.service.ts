import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Actualiza la URL del avatar para un usuario específico.
   * Supone la relación entre User y Profile según tu modelo de Prisma.
   */
  async updateAvatar(userId: string, avatarUrl: string) {
    // 1. Verificamos primero si el usuario existe
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Actualizamos la propiedad avatarUrl dentro del perfil (Profile) o User
    // avatarUrl vive dentro de Profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          update: {
            avatarUrl: avatarUrl,
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