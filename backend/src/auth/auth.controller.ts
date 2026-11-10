import { Body, Controller, HttpCode, HttpStatus, Post, Res, Inject, Get, UseGuards, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { UserPayload } from './interfaces/user-payload.interface.js';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('api/auth')
export class AuthController {
	constructor(
		@Inject(AuthService) private readonly authService: AuthService,
		@Inject(ConfigService) private readonly configService: ConfigService,
	) {}

	//Issues secure, HttpOnly authentication cookies to protect against XSS and CSRF.
	private setAuthCookie(res: Response, accessToken: string, refreshToken: string) {
		const isProduction = process.env.NODE_ENV === 'production';

		// Access token: 15-minute lifespan
		res.cookie('accessToken', accessToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			maxAge: 15 * 60 * 1000,
			path: '/',
		});
		// Refresh token: 7-day lifespan, scoped strictly to the refresh endpoint
    	res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60 * 1000,
			path: '/api/auth/refresh',
    });
	}

	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	async register(
		@Body() registerDto: RegisterUserDto,
		@Res({ passthrough: true }) res: Response,
	) {
		const result = await this.authService.register(registerDto);

    	if (result.accessToken && result.refreshToken) {
        	this.setAuthCookie(res, result.accessToken, result.refreshToken);
		}
		return result;
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	async login(
		@Body() loginDto: LoginUserDto,
		@Res({ passthrough: true }) res: Response,
	) {
		const result = await this.authService.login(loginDto);
		// Do not issue session cookies yet if 2FA verification is pending
		if(result.requiresTwoFactor) {
			return result;
		}
		if(result.accessToken && result.refreshToken) {
			this.setAuthCookie(res, result.accessToken, result.refreshToken);
		}
		return result;
	}

	@Post('logout')
	@HttpCode(HttpStatus.OK)
	async logout(@Res({ passthrough: true }) res: Response) {
		const isProduction = process.env.NODE_ENV === 'production';
		res.clearCookie('accessToken', {
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			path: '/',
		});
		res.clearCookie('refreshToken', {
            httpOnly: true,
			secure: isProduction,
            sameSite: 'lax',
            path: '/api/auth/refresh',
        });
		return { message: 'Logged out successfully'};
	}

	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	async refresh(
		@Request() req: any,
		@Res({ passthrough: true }) res: Response,
	) {
		const refreshToken = req.cookies?.refreshToken;
		const newTokens = await this. authService.refreshTokens(refreshToken);
		this.setAuthCookie(res, newTokens.accessToken, newTokens.refreshToken);
		return { message: 'Tokens refreshed successfully'};

	}

	@Get('me')
  	@UseGuards(JwtAuthGuard)
  	async getMe(@Request() req: { user: UserPayload }) {
    return this.authService.getMe(req.user.id);
  	}

	//Initiates the 42 OAuth authorization code flow
	@Get('oauth/42')
	@UseGuards(AuthGuard('42'))
	async fortyTwoAuth() {
		// Passport automatically redirects to the 42 intranet login page
	}

	//Handles the OAuth callback, persists user data, and redirects accordingly.
	@Get('oauth/42/callback')
	@UseGuards(AuthGuard('42'))
	async fortyTwoAuthCallback(@Request() req: any, @Res() res: any) {
		// Persists the user in the database and generates application tokens
		const result = await this.authService.oauthLogin(req.user);

        const frontendUrl = process.env.FRONTEND_URL || 'https://localhost:8443';

		// AuthService branches into two distinct paths depending on the user status
        //2fa is activated
		if (result.requiresTwoFactor) {
            return res.redirect(`${frontendUrl}/login?userId=${result.userId}`);
        }
        
		// If 2FA is not required or authentication has already been completed
		// Calls the setAuthCookie function to create the secure cookies
        if (result.accessToken && result.refreshToken) {
            this.setAuthCookie(res, result.accessToken, result.refreshToken);
        }
		return res.redirect(`${frontendUrl}/`);
	}

}
