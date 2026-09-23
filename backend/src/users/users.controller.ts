import { 
  Controller, 
  Patch, 
  Post,
  Body, 
  Req, 
  UseGuards, 
  UseInterceptors,
  UploadedFile,
  BadRequestException, 
  UnauthorizedException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileTypeFromBuffer } from 'file-type';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { createAvatarMulterOptions } from '../files/multer-opts-builder';
import { UsersService } from './users.service';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', createAvatarMulterOptions()))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('You need to attach an image file');
    }

    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const detectedType = await fileTypeFromBuffer(file.buffer);
    if (!detectedType || !['image/jpeg', 'image/png'].includes(detectedType.mime)) {
      throw new BadRequestException('Only real JPEG and PNG images are allowed');
    }

    const extension = detectedType.mime === 'image/png' ? 'png' : 'jpg';
    const destination = join(process.cwd(), 'uploads', 'avatars');
    const filename = `${randomUUID()}.${extension}`;
    await mkdir(destination, { recursive: true });
    const filePath = join(destination, filename);
    const url = `/uploads/avatars/${filename}`;

    await writeFile(filePath, file.buffer);
    
    try {
      const updatedUser = await this.usersService.updateAvatar(userId, url);

      return {
        filename,
        url,
        user: updatedUser,
      };
    } catch (error) {
      await unlink(filePath).catch(() => undefined);
      throw error;
    }

  }

  @Patch('avatar')
  async updateAvatar(
    @Body('avatarUrl') avatarUrl: string,
    @Req() req: any,
  ) {
    // 1. Validar que la petición incluya el campo avatarUrl
    if (!avatarUrl) {
      throw new BadRequestException('Debes proporcionar la propiedad avatarUrl');
    }

    // 2. Obtener el ID del usuario autenticado a través del token JWT
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // 3. Delegar la actualización de la base de datos al servicio
    return this.usersService.updateAvatar(userId, avatarUrl);
  }
}