import { Controller, Patch, Post, Delete, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PrivacyService } from './privacy.service.js';
import { UpdatePrivacyDto } from './dto/update-privacy.dto.js';
@Controller('api')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  // Toggle profile visibility (public vs private)
  //PATCH porque solo vamos a modificar un dato parcial del usuario (isPrivate), no a reemplazar toda su ficha.
  @Patch('auth/privacy')
  async updatePrivacy(
    @Request() req: any,
    @Body() updatePrivacyDto: UpdatePrivacyDto,
  ) {
    return this.privacyService.updatePrivacy(req.user.id, updatePrivacyDto.isPrivate);
  }

  // Block a user by ID
  //POST porque estamos creando un registro nuevo en la base de datos (una fila en la tabla Block).
  @Post('users/block/:id')
  async blockUser(
    @Request() req: any,
    @Param('id') targetUserId: string,
  ) {
    return this.privacyService.blockUser(req.user.id, targetUserId);
  }

  // Unblock a user by ID
  //DELETE porque vamos a borrar esa fila de la base de datos.
  @Delete('users/block/:id')
  async unblockUser(
    @Request() req: any,
    @Param('id') targetUserId: string,
  ) {
    return this.privacyService.unblockUser(req.user.id, targetUserId);
  }

  // Retrieve blocked users list
  //GET porque solo estamos pidiendo información para leer, sin modificar nada.
  @Get('users/blocked')
  async getBlockedUsers(@Request() req: any) {
    return this.privacyService.getBlockedUsers(req.user.id);
  }
}