import { Controller, Post, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
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
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    // Supongamos que recibes el ID desde un Decorador de usuario autenticado o req.user
    @Req() req: any, 
    ) {
    const userId = req.user.id; // O el método con el que recuperes el ID del usuario
    return this.usersService.updateAvatar(userId, file.filename);
    }
}