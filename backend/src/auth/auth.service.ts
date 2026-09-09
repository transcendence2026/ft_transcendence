import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';

//declara y exporta la clase de servicio dd reside la logica de autenticacion
@Injectable()
export class AuthService {
	//Recibe los datos validados del registro
	async register(registerDto: RegisterUserDto) {
		// Más adelante aquí llamaremos a la base de datos para guardar el usuario
		//exige q registerDto contenga campos validados por class-validator
		return {
			message: 'User registered successfully',
			user: {
				email: registerDto.email,
				username: registerDto.username,
			},
		};
	}
	// Recibe los datos validados del login
	async login(loginDto: LoginUserDto) {
		// Más adelante aquí comprobaremos si la contraseña coincide
		return {
			message: 'Login successful',
			accessToken: 'temp-jwt-token-placeholder', //simula token que frontend guardara para peticiones siguientes
			user: {
				email: loginDto.email,
			},
		};
	}
}