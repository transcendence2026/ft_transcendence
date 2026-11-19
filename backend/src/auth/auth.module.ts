// Bundles all authentication components, strategies, and dependencies

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FortyTwoStrategy } from './oauth/forty-two.strategy.js';
import { TwoFactorController } from './2fa/two-factor.controller.js';
import { TwoFactorService } from './2fa/two-factor.service.js';

// Verifies OAuth credentials at startup to avoid crashing if env variables are missing
const isFortyTwoOAuthConfigured = Boolean(
	process.env.FORTY_TWO_CLIENT_ID && process.env.FORTY_TWO_CLIENT_SECRET,
);

@Module({
	imports: [
		ConfigModule,
		PrismaModule,
		PassportModule,
		// Asynchronously registers JwtModule to ensure environment variables are loaded before reading secrets
    	JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET') || 'super-secret',
				signOptions: { expiresIn: '15m' }, // Short-lived access token for security
    		}),
		}),
	],
	controllers: [AuthController, TwoFactorController],
	providers: [
		AuthService, 
		JwtStrategy, 
		// Conditionally registers FortyTwoStrategy only when OAuth environment variables are present
		...(isFortyTwoOAuthConfigured ? [FortyTwoStrategy] : []),
		TwoFactorService,
	],
	// Exports modules so guards and token handlers can be reused in other feature modules
	exports: [JwtModule, PassportModule],
})
export class AuthModule {}

