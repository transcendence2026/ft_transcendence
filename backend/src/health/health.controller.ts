import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UseInterceptors } from '@nestjs/common';
import { MetricsInterceptor } from '../metrics/metrics.interceptor.js';

@Controller('api/health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @UseInterceptors(MetricsInterceptor)
  @Get()
  async check() {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({ status: 'error' });
    }
    return { status: 'ok' };
  }
}