import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'; //importamos Servicio de tokens
import * as bcrypt from 'bcrypt'; //importamos libreria de cifrado
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TwoFactorService } from './2fa/two-factor.service.js';

//declara y exporta la clase de servicio dd reside la logica de autenticacion
@Injectable()
export class AuthService {
	//define la complejidad con la que bcrypt revuelve y cifra las contraseñas
	private readonly saltRounds = 10;

	//constructor inyecta el servicio de JWT dentro del serv. de autenticacion par poder firmar tokens
	constructor(
		@Inject(JwtService) private readonly jwtService: JwtService,
		@Inject(PrismaService) private readonly prisma: PrismaService,
		private readonly twoFactorService: TwoFactorService,
	) {}

	//REGISTER: Recibe los datos validados del registro
	async register(registerDto: RegisterUserDto) {
		const { email, username, password } = registerDto;

	//Comprobamos si ya existe el usuario por email o username
    // 1. Comprobamos si el email ya existe
	const existingEmail = await this.prisma.user.findUnique({ where: { email } });
	if (existingEmail) {
    	throw new ConflictException('Email already registered');
	}

	// 2. Comprobamos si el username ya está ocupado
	const existingUsername = await this.prisma.user.findUnique({ where: { username } });
	if (existingUsername) {
		throw new ConflictException('Username already taken');
	}

		//Ciframos contraseña con bcrypt
		const hashedPassword = await bcrypt.hash(password, this.saltRounds);
		
		// Guardamos usando passwordHash como marca el schema.prisma
		//le dice a Prisma que cree una nnueva linea user con el contenido de data
        const user = await this.prisma.user.create({
            data: {
                email,
                username,
                passwordHash: hashedPassword,
				profile: {
                    create: {}, // Genera su fila en Profile con avatarUrl por defecto
				}
            },
        });

		// 1. Creamos el payload para el nuevo usuario (igual que en el login)
        const payload = { 
            email: user.email, 
            id: user.id,
            username: user.username, 
            role: user.role 
        };
        
        // 2. Firmamos el token con el JwtService
        const accessToken = await this.jwtService.signAsync(payload);
		//Una vez el usuario esta guardado, devuelve respuesta al controlador para q sepa quien se acaba de registrar
		return {
			message: 'User registered successfully',
			token:accessToken,
			accessToken: accessToken,
			user: {
				id: user.id,
				username: user.username,
                email: user.email,
			},
		};
	}

	// LOGIN: Recibe las credeciales para logearse e intentar entrar en la aplicacion
	async login(loginUserDto: LoginUserDto) {
		const { email, password } = loginUserDto;
		// 1. Buscamos al usuario en la BD por email
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

		//COMPROBACIÓN DE DOBLE FACTOR
        if (user.isTwoFactorEnabled) {
            // Si tiene 2FA, NO le damos el token todavía. 
            // Devolvemos un aviso para que el frontend sepa que tiene que pedir el código de 6 dígitos.
            return {
                requiresTwoFactor: true,
                userId: user.id,
                message: 'Please provide your 2FA code',
            };
        }
		
		// Si NO tiene 2FA, generamos el token normal como hasta ahora
		//3. Si todo es correcto, generamos y devolvemos el token JWT
		//se crea un payload con datos que viajan y el wtService.signAsync firma digitalmente el token
		const payload = { 
			email: user.email, 
			id: user.id,
			username: user.username, 
		    role: user.role
 		};
		const accessToken = await this.jwtService.signAsync(payload);
		return {
			message: 'Login successful',
			token: accessToken, //yo tenia accesToken perohay otra configuracion y esta dando problemas
			accessToken: accessToken,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
  			},
		};
	}

	// Responde al /api/auth/me del frontend al recargar la página
    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
			include: { profile: true },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            user: {
				id: user.id,
                username: user.username,
                email: user.email,
				avatarUrl: user.profile?.avatarUrl,
            },
        };
    }

	// Método auxiliar preparado para cuando se integre la base de datos
    private async findUserByEmail(email: string) {
        return await this.prisma.user.findUnique({
            where: { email },
        });
    }

	//Una vez que el proveedor externo nos da los datos del usuario en el req.user (callback),
	//  el servicio hace lo siguiente: BUSCA en la BD con prisma si exite el usuario
	//si existe, GENERA EL TOKEN
	//si no, lo crea en al BD y luego emite token
	//por ultimo redirige al us al frontend pasando el token para que la interfaz lo guarde
    async oauthLogin(userDto: { email: string; username: string; avatarUrl: string }) {
        // 1. Buscamos si el usuario ya existe en la base de datos por su email
        let user = await this.prisma.user.findUnique({
            where: { email: userDto.email },
			include: { profile: true },
        });

        // 2. Si no existe, lo creamos automáticamente en la BD
        if (!user) {
			let finalUsername = userDto.username;
            const existingUsername = await this.prisma.user.findUnique({
                where: { username: finalUsername },
            });

            if (existingUsername) {
                finalUsername = `${userDto.username}_42`;
            }
            user = await this.prisma.user.create({
                data: {
                    email: userDto.email,
                    username: finalUsername,
                    profile: {
                        create: {
                            avatarUrl: userDto.avatarUrl || 'default-avatar.png',
						},
					},
                },
				include: { profile: true },
            });
        }

        // 3. Creamos el payload exactamente igual que en el login o registro normal
        const payload = { 
            email: user.email, 
            id: user.id,
            username: user.username, 
            role: user.role 
        };

        // 4. Firmamos el token JWT con el JwtService
        const accessToken = await this.jwtService.signAsync(payload);

        // 5. Devolvemos el token y los datos del usuario al cliente
        return {
            message: 'OAuth login successful',
            token: accessToken,
			accessToken: accessToken,
            user: {
				id: user.id,
                username: user.username,
                email: user.email,
            },
        };
    }
	// COMPLETAR LOGIN CON 2FA: Recibe el ID de usuario y el código de 6 dígitos
	// Si requiresTwoFactor: true
	//frontend muestra al usuario una ventanita para que introduzca los 6 dígitos de su aplicación de autenticación.
    async authenticate2faLogin(userId: string, code: string) {
        // 1. Validamos el código usando el TwoFactorService (en concreto con verifyCode)
        await this.twoFactorService.verifyCode(userId, code);

        // 2. Buscamos al usuario para sacar sus datos y firmar el token
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // 3. Generamos el token JWT definitivo
        const payload = { 
            email: user.email, 
            id: user.id,
            username: user.username, 
            role: user.role 
        };
        const accessToken = await this.jwtService.signAsync(payload);

        return {
            message: 'Login with 2FA successful',
            token: accessToken,
            accessToken: accessToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        };
    }
}