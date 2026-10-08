import { Body, Controller, HttpCode, HttpStatus, Post, Res, Inject, Get, UseGuards, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { UserPayload } from './interfaces/user-payload.interface.js';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('api/auth') //Define ruta base (cualquier ruta empezara por /auth)
//Declara y publica clase relativa a la autenticacion
export class AuthController {
	//Inyectamos el servicio en el constructor
	//constructor(private readonly authService: AuthService) {}
	constructor(
		@Inject(AuthService) private readonly authService: AuthService,
		@Inject(ConfigService) private readonly configService: ConfigService,
	) {}

	//Fumcion para configurar cookies segura
	private setAuthCookie(res: Response, accessToken: string, refreshToken: string) {
		const isProduction = process.env.NODE_ENV === 'production';

		//Cookie 1: AccessToken (15 minutos de vida)
		res.cookie('accessToken', accessToken, {
			httpOnly: true, // Prohibe a JavaScript leer la cookie (blindaje ante XSS)
			secure: isProduction, //solo viaje si conexion es cifrada (HTTPS)
			//evita peticiones maliciosas externas al backend
			sameSite: 'strict', //Solo se envía si la petición nace dentro de nuestra propia web (blindaje anti-CSRF)
			maxAge: 15 * 60 * 1000, //15 minuntos calidez AccessToken
			path: '/', //cookie funciona en toda la app
		});
		// Cookie 2: RefreshToken (7 días de vida)
    	res.cookie('refreshToken', refreshToken, {
			httpOnly: true, //JavaScripts no puede leerla ni manipularla
			secure: isProduction, //Solo viaja bajo conexiones HTTPS cifradas
			sameSite: 'strict', // No se envía desde sitios de terceros (mitiga ataques CSRF)
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
			path: '/api/auth/refresh',       // Solo se envía al endpoint de refresco
    });
	}

	@Post('register') //Indica que el metodo responde peticiones http con metodo POST  a la url
	@HttpCode(HttpStatus.CREATED) //codigo de estado que debe devolver la respuesto (201 registro)
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
	@HttpCode(HttpStatus.OK) //Codigo HTTP 200 (login)
	async login(
		@Body() loginDto: LoginUserDto,
		//{ passthrough: true } le avisa a NestJS: "Solo quiero res para meter la cookie; 
		// passthrough evita que al meter la cookie, NestJS no se apague
		@Res({ passthrough: true }) res: Response,
	) {
		const result = await this.authService.login(loginDto);
		//si doble factor acativado y no se emite cookie todavía
		if(result.requiresTwoFactor) {
			return result;
		}
		//si login es sin 2fa o ya completado, metemos token en la cookie
		if(result.accessToken && result.refreshToken) {
			this.setAuthCookie(res, result.accessToken, result.refreshToken);
		}
		return result;
	}

	@Post('logout')
	@HttpCode(HttpStatus.OK)
	async logout(@Res({ passthrough: true }) res: Response) {
		//Si salimos, borramos la cookie y limpiamos la sesion
		res.clearCookie('accessToken', {
			httpOnly: true,
			sameSite: 'strict',
			path: '/',
		});
		res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: 'strict',
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
    // req.user.id viene directamente del payload del token tipado con tu interfaz
    return this.authService.getMe(req.user.id);
  	}

	// Endpoint que redirige al usuario a la página oficial de login de 42
	//AuthGuard('42') de Passport: Es una clase prehecha por la librería de Passport 
	//que interactúa con un servicio externo (la Intra de 42)
	// maneja redirecciones web y redirige el tráfico hacia el proveedor.
	//El AuthGuard intercepta la petición del usuario.
	// Al ver que usa la estrategia '42', 
	// llama automáticamente a tu FortyTwoStrategy
	//que fuerza la redirección inmediata hacia la página oficial de la Intra de 42.
	@Get('oauth/42')
	@UseGuards(AuthGuard('42'))
	async fortyTwoAuth() {
		//Passport redirige al usuario directamente a la Intra de 42
		//aunq aqui no se ejecuta codigo, NestJS lo necesita asi
	}

	//Endpoint de vuelta (callback) de la intra al usuario con el codigo de autenticacion
	//AuthGuard vuelve a interceptar la petición.
	//habla por detrás con la API de 42, 
	// intercambia ese código por el token de acceso real,
	// descarga el perfil del usuario, 
	// ejecuta el método validate de FortyTwoStrategy 
	// y mete el resultado dentro de req.user
	//cuando el guard comprueba que todo ha salido bien,
	//da luz verde a la petición para que entre finalmente a tu controlador (fortyTwoAuthCallback).
	@Get('oauth/42/callback')
	@UseGuards(AuthGuard('42'))
	async fortyTwoAuthCallback(@Request() req: any, @Res() res: any) {
		// 1. Guarda al usuario en la BD y genera el token
		const result = await this.authService.oauthLogin(req.user);

		// 2. Lee la URL del entorno, si no existe usa la estándar por defecto
        const frontendUrl = process.env.FRONTEND_URL || 'https://localhost:8443';

		//AuthService hace dos caminos distintos según el usuario
		//1.- activado 2fa
		if (result.requiresTwoFactor) {
            return res.redirect(`${frontendUrl}/login?userId=${result.userId}`);
        }
        
		// 2.- Si no requiere 2F o el login se completo
		// entonces entra la funcion setAuthCookie y se crea la cookie segura
        if (result.token) {
            this.setAuthCookie(res, result.accessToken, result.refreshToken);
        }

        // 3. Redirige dinámicamente
		return res.redirect(`${frontendUrl}/`);
	}

}
