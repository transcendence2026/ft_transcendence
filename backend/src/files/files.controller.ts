import { 
  Controller, 
  Post, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileTypeFromFile } from 'file-type';
import { unlink } from 'node:fs/promises';
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

  private async ensureJpegOrPng(file: Express.Multer.File) {
    const detectedType = await fileTypeFromFile(file.path);
    if (!detectedType || !['image/jpeg', 'image/png'].includes(detectedType.mime)) {
      await unlink(file.path).catch(() => undefined);
      throw new BadRequestException('Only real JPEG and PNG images are allowed');
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', createMulterOptions('')))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('You need to attach an image file');
    }
    await this.ensureJpegOrPng(file);

    return {
      filename: file.filename,
      url: `/uploads/${file.filename}`,
    };
  }

//   @Post(['avatar', 'upload/avatar'])
//   @UseInterceptors(FileInterceptor('file', createMulterOptions('avatars')))
//   async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
//     if (!file) {
//       throw new BadRequestException('You need to attach an image file');
//     }
//     await this.ensureJpegOrPng(file);

//     // 2. Devuelve la URL relativa lista para guardar en el perfil
//     return {
//       filename: file.filename,
//       url: `/uploads/avatars/${file.filename}`,
//     };
//   }




//a la espera de la logica de post para pasar a post.service.ts donde se actualice la base de datos con la url de la imagen del post, y luego devolver la url al front para que se muestre en el post creado.
  @Post(['post', 'upload/post'])
  @UseInterceptors(FileInterceptor('file', createMulterOptions('posts')))
  async uploadPostImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('You need to attach an image file');
    }
    await this.ensureJpegOrPng(file);

    // 3. Devuelve la URL equivalente para las imágenes de posts
    return {
      filename: file.filename,
      url: `/uploads/posts/${file.filename}`,
    };
  }
}