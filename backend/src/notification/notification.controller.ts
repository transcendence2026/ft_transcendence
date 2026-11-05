import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { NotificationGateway } from './notification.gateway.js';

@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationGateway) {}

  @Get()
  findMine(@Req() req: any) {
    return this.notifications.findForUser(req.user.id);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    return this.notifications.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.notifications.markAsRead(id, req.user.id);
  }
}
