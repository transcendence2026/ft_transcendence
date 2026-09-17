import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service'; // Ajusta la ruta a tu PrismaService

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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