import { Body, Controller, Get, Patch, Post, Req, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseGuards ,UseInterceptors, BadRequestException,UnauthorizedException ,UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { editFileName } from './file-upload.utils';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateCurrentUser(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getUser(@Req() req: any) {
    return this.usersService.getProfile(req.params.id);
  }
  
  @UseGuards(JwtAuthGuard)
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
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // 1. Limita el tamaño a 2MB
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }),
          // 2. Solo permite JPG, JPEG y PNG (bloquea SVG implícitamente)
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/i }),
        ],
      }),

    ) file: Express.Multer.File,
    // Supongamos que recibes el ID desde un Decorador de usuario autenticado o req.user
    @Req() req: any, 
  ) {
    if (!file) { // <-- AÑADIR
      throw new BadRequestException('Debes adjuntar una imagen');
    }
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(userId, file.filename);
    }
}