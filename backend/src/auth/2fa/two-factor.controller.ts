import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
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
	async turnOnTwoFactor(@Request() req: any, @Body('code') code: string) {
		const userId = req.user.id;
		await this.twoFactorService.turnOnTwoFactor(userId, code);
		return { message: 'Two-factor authentication successfully enabled'};
	}

	//despues de que el usuario abra Google Authenticator,
	// mira y escribe en pantalla el número de 6 dígitos
	//llega la peticion a esta ruta de autenticación
	@Post('authenticate')
	async authenticate2fa(@Body('userId') userId: string, @Body('code') code: string) {
    //entra en marcha el servicio de autenticacion (en auth.service)
   	 return this.authService.authenticate2faLogin(userId, code);
	}
}