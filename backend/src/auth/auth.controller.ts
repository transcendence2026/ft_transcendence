import { Body, Controller, HttpCode, HttpStatus, Post, Res, Inject, Get, UseGuards, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { UserPayload } from './interfaces/user-payload.interface.js';
import { AuthGuard } from '@nestjs/passport';
import type { Request as ExpressRequest } from 'express';

@Controller('api/auth') //Define ruta base (cualquier ruta empezara por /auth)
//Declara y publica clase relativa a la autenticacion
export class AuthController {
	//Inyectamos el servicio en el constructor
	//constructor(private readonly authService: AuthService) {}
	constructor(
		@Inject(AuthService) private readonly authService: AuthService,
		@Inject(ConfigService) private readonly configService: ConfigService,
	) {}

	@Post('register') //Indica que el metodo responde peticiones http con metodo POST  a la url
	@HttpCode(HttpStatus.CREATED) //codigo de estado que debe devolver la respuesto (201 registro)
	async register(@Body() registerDto: RegisterUserDto) {
		//service genera la respuesta pero controller la empaqueta (pone codigo HTTP correcto) y se la da al cliente
		//controlador es como si tradujera la respuesta al idioma de internet
		return this.authService.register(registerDto);
	}

	@Post('login')
	@HttpCode(HttpStatus.OK) //Codigo HTTP 200 (login)
	async login(@Body() loginDto: LoginUserDto) {
		return this.authService.login(loginDto);
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

		// 2. Redirige al navegador de vuelta a la página web con el token
		//return res.redirect(`https://localhost:8443/?token=${result.token}`);

		// 2. Lee la URL del entorno, si no existe usa la estándar por defecto
        const frontendUrl = process.env.FRONTEND_URL || 'https://localhost';
        
        // 3. Redirige dinámicamente
        return res.redirect(`${frontendUrl}/?token=${result.token}`);
	}

}