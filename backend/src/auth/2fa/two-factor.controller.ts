import { Controller, Post, Body, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js'; // Tu guard personalizado
import { TwoFactorService } from './two-factor.service.js';
import { AuthService } from '../auth.service.js';

@Controller('api/auth/2fa')
export class TwoFactorController {
	constructor(
		private readonly twoFactorService: TwoFactorService,
		private readonly authService: AuthService,
	) {}

	//El frontend hace una petición a esta dirección exacta 
	// cuando el usuario quiere empezar a configurar el 2FA 
	// y necesita que le devuelvas el código secreto y la imagen QR.
	@Post('generate')
	@UseGuards(JwtAuthGuard)
	async registerTwofactor(@Request() req: any) {
		const userId = req.user.id;
		const userEmail = req.user.email;
		return this.twoFactorService.generateTwoFactorSecret(userId, userEmail);
	}

	//El frontend hace una petición a esta dirección 
	// cuando el usuario introduce los 6 dígitos de su móvil 
	// para demostrar que ha escaneado bien el QR 
	// y activar definitivamente el sistema en su cuenta.
	@Post('turn-on')
	@UseGuards(JwtAuthGuard)
	async turnOnTwoFactor(
		@Request() req: any,
		@Body('code') code: string
	) {
		const userId = req.user.id;
		await this.twoFactorService.turnOnTwoFactor(userId, code);
		return { message: 'Two-factor authentication successfully enabled'};
	}

	@Post('authenticate')
  async authenticate2fa(
    @Body('userId') userId: string,
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.authenticate2faLogin(userId, code);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd || true, // Activo para HTTPS
      sameSite: 'strict' as const,
    };

    if (result.accessToken) {
      res.cookie('accessToken', result.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutos
        path: '/',
      });
    }

    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        path: '/api/auth/refresh',
      });
    }

    return result;
  }

	//frontend hace una peticion HTTP a esta direccion
	//para desactivar 2FA
	//JwtService: herramienta para descifrar y validar tokens
	@Post('turn-off')
	@UseGuards(JwtAuthGuard)
	async turnOffTwoFactor(
		@Request() req: any,
		@Body('code') code: string
	) {
		await this.twoFactorService.turnOffTwoFactor(req.user.id, code);
		return { message: 'Two-factor authentication successfully disabled'};
	}
}