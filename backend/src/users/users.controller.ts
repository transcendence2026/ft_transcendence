import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName } from './file-upload.utils';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('avatar') // Escucha peticiones POST /api/users/avatar
  @UseInterceptors(
    FileInterceptor('file', { // 'file' es la clave que enviará el cliente HTTP
      storage: diskStorage({
        destination: './uploads/avatars', // Guarda físicamente en la carpeta creada
        filename: editFileName,           // Pasa la función para renombrar
      }),
    }),
  )
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return this.usersService.formatAvatarResponse(file);
  }
}