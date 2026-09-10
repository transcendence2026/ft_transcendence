import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';

//declara y exporta la clase de servicio dd reside la logica de autenticacion
@Injectable()
export class AuthService {
	//Numero de rondas de salt estandar
	private readonly saltRounds = 10;
	//Recibe los datos validados del registro
	async register(registerDto: RegisterUserDto) {
		const { email, username, password } = registerDto;

		//Ciframos contraseña con bcrypt
		const hashedPassword = await bcrypt.hashSync(password, this.saltRounds);
		
		// Más adelante aquí llamaremos a la base de datos para guardar el usuario
		//exige q registerDto contenga campos validados por class-validator
		return {
			message: 'User registered successfully',
			user: {
				email,
				username,
				hashedPassword, // Lo devolvemos temporalmente para verificar el hash en las pruebas
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