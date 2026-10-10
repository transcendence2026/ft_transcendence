import { Controller, Get, Delete, UseGuards, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RgpdService } from './rgpd.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

//Controller: Escucha en la red y asigna la ruta que activa cada accion
//y delega la ejecución en Service (quien habla con la Base de Datos)
//rgpd: identifica ambito normativa RGPD
@Controller('rgpd')
@UseGuards(JwtAuthGuard)
export class RgpdController {
	constructor(private readonly rgpdService: RgpdService) {}

	//export: estándar para volcar/descargar informacion
	@Get('export')
	async exportData(@Req() req: any, @Res() res: Response) {
		const data = await this.rgpdService.exportUserData(req.user.id);

		res.setHeader('Content.Type', 'application/json');
		res.setHeader(
			'Content-Disposition',
			`attachment; filename="tastesync_rgpd_${req.user.id}.json"`,
		);
		return res.json(data);
	}
	//account: deja claro que el recurso a destruir es la cuenta (account)
	@Delete('account')
	async deleteAccount(@Req() req: any, @Res() res: Response) {
		const result = await this.rgpdService.deleteUserAccount(req.user.id);

		//Limpia las cookies de sesion
		res.clearCookie('accessToken'); //pase de acceso rápido. Viaja en cada petición para comprobar quién eres y qué permisos tienes
		res.clearCookie('refreshToken'); //pase de renovación. Vive en una cookie HttpOnly segura y solo se utiliza cuando el accessToken caduca

		return res.json(result);
	}
}