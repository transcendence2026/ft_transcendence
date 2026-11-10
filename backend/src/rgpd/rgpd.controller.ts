import { Controller, Get, Delete, UseGuards, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RgpdService } from './rgpd.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('api/rgpd')
@UseGuards(JwtAuthGuard)
export class RgpdController {
	constructor(private readonly rgpdService: RgpdService) {}

	// Exports all personal data associated with the authenticated user as a downloadable JSON file
	@Get('export')
	async exportData(@Req() req: any, @Res() res: Response) {
		const data = await this.rgpdService.exportUserData(req.user.id);

		res.setHeader('Content-Type', 'application/json');
		res.setHeader(
			'Content-Disposition',
			`attachment; filename="tastesync_rgpd_${req.user.id}.json"`,
		);
		return res.json(data);
	}

	// Permanently deletes the authenticated user's account and clears active session cookies
	@Delete('account')
	async deleteAccount(@Req() req: any, @Res() res: Response) {
		const result = await this.rgpdService.deleteUserAccount(req.user.id);
		const isProduction = process.env.NODE_ENV === 'production';
		//clean cookies
		res.clearCookie('accessToken', {
			httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
			path: '/' });
		res.clearCookie('refreshToken', {
			httpOnly: true,
			secure: isProduction,
            sameSite: 'lax',
			path: '/api/auth/refresh' });

		return res.json(result);
	}
}