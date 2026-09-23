import { 
  Controller, 
  Patch, 
  Body, 
  Req, 
  UseGuards, 
  BadRequestException, 
  UnauthorizedException 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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