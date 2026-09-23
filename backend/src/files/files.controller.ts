import { 
  Controller, 
  Post, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { createMulterOptions } from './multer-opts-builder';

// El cliente hace una petición POST.
// Envía el header Authorization: Bearer TOKEN.
// JwtAuthGuard valida el token.
// FileInterceptor busca el campo multipart llamado file.
// Multer valida y guarda el archivo.
// El método recibe el archivo mediante @UploadedFile().
// El controlador devuelve el nombre y la URL pública.

@Controller('api/files')
@UseGuards(JwtAuthGuard) // 1. Protege todas las rutas de este controlador con JWT
export class FilesController {

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', createMulterOptions('')))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('You need to attach an image file');
    }

    return {
      filename: file.filename,
      url: `/uploads/${file.filename}`,
    };
  }

  @Post(['avatar', 'upload/avatar'])
  @UseInterceptors(FileInterceptor('file', createMulterOptions('avatars')))
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('You need to attach an image file');
    }

    // 2. Devuelve la URL relativa lista para guardar en el perfil
    return {
      filename: file.filename,
      url: `/uploads/avatars/${file.filename}`,
    };
  }

  @Post(['post', 'upload/post'])
  @UseInterceptors(FileInterceptor('file', createMulterOptions('posts')))
  uploadPostImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('You need to attach an image file');
    }

    // 3. Devuelve la URL equivalente para las imágenes de posts
    return {
      filename: file.filename,
      url: `/uploads/posts/${file.filename}`,
    };
  }
}