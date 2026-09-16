<<<<<<< HEAD
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
		
		// Guardamos usando passwordHash como marca el schema.prisma
		//le dice a Prisma que cree una nnueva linea user con el contenido de data
        const user = await this.prisma.user.create({
            data: {
                email,
                username,
                passwordHash: hashedPassword,
            },
        });
		//Una vez el usuario esta guardado, devuelve respuesta al controlador para q sepa quien se acaba de registrar
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
		const payload = { 
			email: user.email, 
			sub: user.id,
			username: user.username, 
		    role: user.role
 		};
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
=======
import { BadRequestException, Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuthUserInfoDto } from './dots/OAuthUserInfo.dto.js';
import { RegisterUserDto } from './dots/registerUser.dto.js';
import { LoginUserDto } from './dots/loginUser.dto.js';

@Injectable()
export class AuthService {
  private readonly oauthStateStore = new Map<string, string>();

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private createJwt(userId: string): string {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET ?? 'dev-secret-change-me', { expiresIn: '1d' });
  }

  private sanitizeUsername(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '').slice(0, 20) || 'user';
  }

  private async ensureUniqueUsername(preferredUsername: string): Promise<string> {
    const base = this.sanitizeUsername(preferredUsername);
    let candidate = base;
    let suffix = 1;
    while (await this.prisma.user.findUnique({ where: { username: candidate } })) {
      candidate = `${base}${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async register({username, email, password } : RegisterUserDto) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findFirst({ where: { OR: [{ email: normalizedEmail }, { username: username.trim() }] } });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        username: await this.ensureUniqueUsername(username),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 10),
        profile: {
          create: {}
        }
      },
    });
    return { token: this.createJwt(user.id), user: { username: user.username, email: user.email } };
  }

  async login({email, password} : LoginUserDto) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new BadRequestException('Invalid credentials');
    }

    return { token: this.createJwt(user.id), user: { username: user.username, email: user.email } };
  }

  buildOAuthUrl(): string {
    const clientId = process.env.FORTY_TWO_CLIENT_ID;
    if (!clientId) {
      throw new InternalServerErrorException('42 OAuth is not configured. Set FORTY_TWO_CLIENT_ID.');
    }

    const state = crypto.randomBytes(16).toString('hex');
    this.oauthStateStore.set(state, '42');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: process.env.FORTY_TWO_REDIRECT_URI ?? 'http://localhost:3000/api/auth/oauth/42/callback',
      response_type: 'code',
      scope: 'public',
      state,
    });
    return `https://api.intra.42.fr/oauth/authorize?${params.toString()}`;
  }

  async handleOAuthCallback(code: string, state: string): Promise<string> {
    if (!code || !state || !this.oauthStateStore.has(state)) {
      throw new BadRequestException('Invalid OAuth callback state');
    }
    this.oauthStateStore.delete(state);

    const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.FORTY_TWO_CLIENT_ID ?? '',
        client_secret: process.env.FORTY_TWO_CLIENT_SECRET ?? '',
        code,
        redirect_uri: process.env.FORTY_TWO_REDIRECT_URI ?? 'http://localhost:3000/api/auth/oauth/42/callback',
      }).toString(),
    });
    if (!tokenResponse.ok) throw new UnauthorizedException('Failed to exchange 42 authorization code');

    const tokenPayload = await tokenResponse.json() as { access_token?: string };
    if (!tokenPayload.access_token) throw new UnauthorizedException('42 token exchange returned no access token');

    const userResponse = await fetch('https://api.intra.42.fr/v2/me', { headers: { Authorization: `Bearer ${tokenPayload.access_token}` } });
    if (!userResponse.ok) throw new UnauthorizedException('Failed to fetch user details from 42 API');

    const userInfo = await userResponse.json() as OAuthUserInfoDto;
    const login = userInfo.login ?? userInfo.firstName ?? '42user';
    const email = String(userInfo.email ?? `${login}@student.42.fr`).trim().toLowerCase();
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({ 
        data: { 
          username: await this.ensureUniqueUsername(login), 
          email, 
          passwordHash: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10), 
          profile: {
            create: {}
          }
        } 
      });
    }

    const callbackUrl = new URL('/oauth/callback', process.env.FRONTEND_URL ?? 'http://localhost:8080');
    callbackUrl.searchParams.set('token', this.createJwt(user.id));
    callbackUrl.searchParams.set('username', user.username);
    callbackUrl.searchParams.set('email', user.email);
    return callbackUrl.toString();
  }

  async getCurrentUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { username: true, email: true } });
    if (!user) throw new UnauthorizedException('User not found');
    return { user: { username: user.username, email: user.email } };
  }
>>>>>>> origin/dev
}