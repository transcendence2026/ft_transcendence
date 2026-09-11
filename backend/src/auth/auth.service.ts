import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'; //importamos Servicio de tokens
import * as bcrypt from 'bcrypt'; //importamos libreria de cifrado
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

//declara y exporta la clase de servicio dd reside la logica de autenticacion
@Injectable()
export class AuthService {
	//define la complejidad con la que bcrypt revuelve y cifra las contraseñas
	private readonly saltRounds = 10;

	//constructor inyecta el servicio de JWT dentro del serv. de autenticacion par poder firmar tokens
	constructor(
		@Inject(JwtService) private readonly jwtService: JwtService,
		@Inject(PrismaService) private readonly prisma: PrismaService,
	) {}

	//Recibe los datos validados del registro
	async register(registerDto: RegisterUserDto) {
		const { email, username, password } = registerDto;

		//Comprobamos si ya existe el usuario por email o username
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

		//Ciframos contraseña con bcrypt
		const hashedPassword = await bcrypt.hash(password, this.saltRounds);
		
		// OJO!!!! Más adelante aquí llamaremos a la base de datos para guardar el usuario
		// Guardamos usando passwordHash como marca el schema.prisma
        const user = await this.prisma.user.create({
            data: {
                email,
                username,
                passwordHash: hashedPassword, 
            },
        });
		//OJO!!! lo q devuelva luego se guardara en la Base de Datos
		return {
			message: 'User registered successfully',
			user: {
				email,
				username: user.username,
			},
		};
	}
	// Recibe las credeciales para logearse e intentar entrar en la aplicacion
	async login(loginUserDto: LoginUserDto) {
		const { email, password } = loginUserDto;
		// 1. Buscamos al usuario (punto de enganche para la base de datos)
		const user = await this.findUserByEmail(email);
		//si no lo encuentra, lanza error 401
		if(!user || !user.passwordHash) {
			throw new UnauthorizedException('Invalid credentials');
		}

		//2. Comparamos la contraseña con el hash usando bcrypt.compare
		const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
		if(!isPasswordValid) {
			throw new UnauthorizedException('Invalid credentials');
		}

		//3. Si todo es correcto, generamos y devolvemos el token JWT
		//se crea un payload con datos que viajan y el wtService.signAsync firma digitalmente el token
		const payload = { email: user.email, sub: user.id };
		const accessToken = await this.jwtService.signAsync(payload);
		return {
			message: 'Login successful',
			accessToken,
		};
	}
	// Simulacion de consulta a Base de Datos:
	// Método auxiliar preparado para cuando se integre la base de datos
    private async findUserByEmail(email: string) {
        return await this.prisma.user.findUnique({
            where: { email },
        });
    }
}