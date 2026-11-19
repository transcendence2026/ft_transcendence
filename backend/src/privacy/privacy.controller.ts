import { Controller, Patch, Post, Delete, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PrivacyService } from './privacy.service.js';
import { UpdatePrivacyDto } from './dto/update-privacy.dto.js';
@Controller('api')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  // Toggle profile visibility (public vs private)
  @Patch('auth/privacy')
  async updatePrivacy(
    @Request() req: any,
    @Body() updatePrivacyDto: UpdatePrivacyDto,
  ) {
    return this.privacyService.updatePrivacy(req.user.id, updatePrivacyDto.isPrivate);
  }

  // Block a user by ID
  @Post('users/block/:id')
  async blockUser(
    @Request() req: any,
    @Param('id') targetUserId: string,
  ) {
    return this.privacyService.blockUser(req.user.id, targetUserId);
  }

  // Unblock a user by ID
  @Delete('users/block/:id')
  async unblockUser(
    @Request() req: any,
    @Param('id') targetUserId: string,
  ) {
    return this.privacyService.unblockUser(req.user.id, targetUserId);
  }

  // get blocked users list
  @Get('users/blocked')
  async getBlockedUsers(@Request() req: any) {
    return this.privacyService.getBlockedUsers(req.user.id);
  }
}