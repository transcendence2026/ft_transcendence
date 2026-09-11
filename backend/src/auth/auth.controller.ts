//import { Body, Controller, HttpCode, HttpStatus, Post, Get, UseGuards, Req } from '@nestjs/common';
import { Body, Controller, HttpCode, HttpStatus, Post, Get, Inject } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Controller('auth') //Define ruta base (cualquier ruta empezara por /auth)
//Declara y publica clase relativa a la autenticacion
export class AuthController {
	//Inyectamos el servicio en el constructor
	//constructor(private readonly authService: AuthService) {}
	constructor(@Inject(AuthService) private readonly authService: AuthService) {}

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

	/* Ruta de prueba temporal para ver el guard en acción
    @Get('test-guard')
    @UseGuards(JwtAuthGuard)
    testGuard(@Req() req: any) {
        return {
            message: '¡El guard dejó pasar la petición!',
            userEncontrado: req.user,
        };
    }*/
}