import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
  // Aquí inyectarías tu repositorio/ORM (TypeORM, Prisma, Mongoose, etc.)

  async updateAvatar(userId: string, filename: string) {
    // 1. Buscar al usuario
    // const user = await this.userRepository.findOne(userId);
    // if (!user) throw new NotFoundException('Usuario no encontrado');

    // 2. Aplicar la lógica (asignar la imagen)
    // user.avatar = filename;

    // 3. Persistir los cambios
    // return await this.userRepository.save(user);

    return {
      message: 'Avatar actualizado con éxito',
      userId,
      avatar: filename,
    };
  }
}