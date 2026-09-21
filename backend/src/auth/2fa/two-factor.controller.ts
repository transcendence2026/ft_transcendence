import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js'; // Tu guard personalizado
import { TwoFactorService } from './two-factor.service.js';

@Controller('api/auth/2fa')
export class TwoFactorController {
	constructor(private readonly twoFactorService: TwoFactorService) {}

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
	async turnOnTwoFactor(@Request() req: any, @Body('code') code: string) {
		const userId = req.user.id;
		await this.twoFactorService.turnOnTwoFactor(userId, code);
		return { message: 'Doble factor de autenticacion activado con exito'};
	}
}