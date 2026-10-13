import { Module } from '@nestjs/common';
import { PrivacyController } from './privacy.controller.js';
import { PrivacyService } from './privacy.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
	imports: [PrismaModule, AuthModule],
	controllers: [PrivacyController],
	providers: [PrivacyService],
	exports: [PrivacyService],

})
export class PrivacyModule {}