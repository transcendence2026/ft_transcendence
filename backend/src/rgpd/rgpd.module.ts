import { Module } from '@nestjs/common';
import { RgpdController } from './rgpd.controller.js';
import { RgpdService } from './rgpd.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [RgpdController],
  providers: [RgpdService],
  exports: [RgpdService],
})
export class RgpdModule {}