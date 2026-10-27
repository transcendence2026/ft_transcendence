import { Body, Controller, Get, Delete, Header, Patch, Post, Req, StreamableFile, UseGuards, UseInterceptors, UploadedFile, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileTypeFromFile } from 'file-type';
import { unlink } from 'node:fs/promises';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { createMulterOptions } from '../files/multer-opts-builder.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';
import { GastronomicJournalService } from './gastronomic-journal.service.js';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly gastronomicJournalService: GastronomicJournalService,
  ) {}
  //GET /api/users/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Get('export/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="diario-gastronomico.pdf"')
  async exportJournal(@Req() req: any): Promise<StreamableFile> {
    const pdf = await this.gastronomicJournalService.generatePdf(req.user.id);
    return new StreamableFile(pdf);
  }
  //PATCH /api/users/me
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateCurrentUser(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  // GET /api/users/blocked (¡DEBE IR ANTES DE :id!)
  @Get('blocked')
  getBlockedUsers(@Req() req: any) {
    return this.usersService.getBlockedUsers(req.user.id);
  }

  // POST /api/users/block/:id
  @Post('block/:id')
  blockUser(@Req() req: any) {
    return this.usersService.blockUser(req.user.id, req.params.id);
  }

  // DELETE /api/users/block/:id
  @Delete('block/:id')
  unblockUser(@Req() req: any) {
    return this.usersService.unblockUser(req.user.id, req.params.id);
  }


  //GET /api/users/:id
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getUser(@Req() req: any) {
    return this.usersService.getProfile(req.params.id, req.user.id);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', createMulterOptions('avatars')))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('You need to attach an image file');
    }

    const detectedType = await fileTypeFromFile(file.path);
    if (!detectedType || !['image/jpeg', 'image/png'].includes(detectedType.mime)) {
      await unlink(file.path).catch(() => undefined);
      throw new BadRequestException('Only real JPEG and PNG images are allowed');
    }

    const userId = req.user?.id;
    if (!userId) {
      await unlink(file.path).catch(() => undefined);
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const url = `/uploads/avatars/${file.filename}`;

    try {
      const updatedUser = await this.usersService.updateAvatar(userId, url);
      return { filename: file.filename, url, user: updatedUser };
    } catch (error) {
      await unlink(file.path).catch(() => undefined);
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