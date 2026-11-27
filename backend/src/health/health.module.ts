import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { MetricsService }  from '../metrics/metrics.service.js';
import { MetricsModule } from '../metrics/metrics.module.js';

@Module({ 
    imports: [MetricsModule],
    controllers: [HealthController] })
export class HealthModule {}