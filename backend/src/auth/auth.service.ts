import {
	ConflictException,
	Inject,
	Injectable,
	ServiceUnavailableException,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'; //importamos Servicio de tokens
import * as bcrypt from 'bcrypt'; //importamos libreria de cifrado
import { Prisma } from '@prisma/client';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TwoFactorService } from './2fa/two-factor.service.js';

@Injectable()
export class AuthService {
	private readonly saltRounds = 10;

	constructor(
		@Inject(JwtService) private readonly jwtService: JwtService,
		@Inject(PrismaService) private readonly prisma: PrismaService,
		private readonly twoFactorService: TwoFactorService,
	) {}

    // Issues access and refresh tokens with different expiration windows.
    async generateTokens(user: { id: string; email: string; username: string; role?: string }) {
        const payload = {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_SECRET || 'super-secret',
                expiresIn: '15m', //vida corta
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET || 'super-refresh-secret',
                expiresIn: '7d', //vida larga
            }),
        ]);
        return { accessToken, refreshToken};
    }

	// Hashes and persists the active refresh token in PostgreSQL
	private async updateRefreshTokenHash(userID: string, refreshToken: string) {
		const hash = await bcrypt.hash(refreshToken, this.saltRounds);
		await this.prisma.user.update({
			where: { id: userID },
			data: { hashedRefreshToken: hash },
		});
	}

	// Handles local user registration, credential hashing, and profile creation
	async register(registerDto: RegisterUserDto) {
		const { email, username, password } = registerDto;

    // Checks if the email is already registered
	const existingEmail = await this.prisma.user.findUnique({ where: { email } });
	if (existingEmail) {
    	throw new ConflictException('Email already registered');
	}

	// Checks if the username is already taken
	const existingUsername = await this.prisma.user.findUnique({ where: { username } });
	if (existingUsername) {
		throw new ConflictException('Username already taken');
	}

		// Hashes the password using bcrypt
		const hashedPassword = await bcrypt.hash(password, this.saltRounds);
		
        const user = await this.prisma.user.create({
            data: {
                email,
                username,
                passwordHash: hashedPassword,
                status: 'ONLINE',
				profile: {
                    create: {},
				}
            },
        });
        // If validation succeeds, generates and returns the JWT tokens
        const tokens = await this.generateTokens(user);
		await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
		// Once the user is persisted, returns the payload to the controller with registration details
		return {
			message: 'User registered successfully',
			token:tokens.accessToken,
			accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
			user: {
				id: user.id,
				username: user.username,
                email: user.email,
			},
		};
	}

	// Authenticates credentials; requires a TOTP code if 2FA is active.
	async login(loginUserDto: LoginUserDto) {
		const { email, password } = loginUserDto;
		// look for user by mail
		const user = await this.findUserByEmail(email);
		if(!user || !user.passwordHash) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Compares the plain password against the stored hash using bcrypt.compare
		const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
		if(!isPasswordValid) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// 2fa check
        if (user.isTwoFactorEnabled) {
            return {
                requiresTwoFactor: true,
                userId: user.id,
                message: 'Please provide your 2FA code',
            };
        }
		
		// If everything is valid, generates and returns the JWT tokens
		const tokens = await this.generateTokens(user);
		await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

		return {
			message: 'Login successful',
			token: tokens.accessToken,
			accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
  			},
		};
	}

	// Retrieves current session user info along with profile details.
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
				isTwoFactorEnabled: user.isTwoFactorEnabled,
            },
        };
    }

	// Database lookup helper catching missing migrations/table schema errors.
    private async findUserByEmail(email: string) {
        try {
            return await this.prisma.user.findUnique({
                where: { email },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError
                && (error.code === 'P2021' || error.code === 'P2022')
            ) {
                throw new ServiceUnavailableException(
                    'The authentication database is not ready. Run the database schema setup first.',
                );
            }
            throw error;
        }
    }

	// Synchronizes 42 OAuth profiles, sets ONLINE status, and checks 2FA requirements.
    async oauthLogin(userDto: { email: string; username: string; avatarUrl: string }) {
        let user = await this.prisma.user.findUnique({
            where: { email: userDto.email },
			include: { profile: true },
        });
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
                    status: 'ONLINE',
                    profile: {
                        create: {
                            avatarUrl: userDto.avatarUrl || 'default-avatar.png',
						},
					},
                },
				include: { profile: true },
            });
        }

        if (user.status !== 'ONLINE') {
			user = await this.prisma.user.update({
				where: { id: user.id },
				data: { status: 'ONLINE' },
				include: { profile: true },
			});
        }

		//Check 2fa
		if (user.isTwoFactorEnabled) {
            return {
                requiresTwoFactor: true,
                userId: user.id,
                message: 'Please provide your 2FA code',
            };
        }
        // If everything is valid, generates and returns the JWT tokens
        const tokens = await this.generateTokens(user);
		await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
       
        return {
            message: 'OAuth login successful',
            token: tokens.accessToken,
			accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
				id: user.id,
                username: user.username,
                email: user.email,
				isTwoFactorEnabled: user.isTwoFactorEnabled,
            },
        };
    }

	//Completes 2FA login by verifying the 6-digit TOTP code and issuing session tokens.
    async authenticate2faLogin(userId: string, code: string) {
        //Validates that the user ID is provided
        if(!userId) {
            throw new UnauthorizedException('User ID is required')
        }
        // Verifies the TOTP code against the user's secret
        await this.twoFactorService.verifyCode(userId, code);

        // Fetches user data to generate the JWT payload
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Generates the final JWT token pair
        const tokens = await this.generateTokens(user);
		await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

        return {
            message: 'Login with 2FA successful',
            token: tokens.accessToken,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
				isTwoFactorEnabled: user.isTwoFactorEnabled,
            },
        };
    }

    // Validates the refresh token and issues a new token pair
    async refreshTokens(refreshToken: string) {
        if(!refreshToken) {
            throw new UnauthorizedException('Refresh token missing');
        }
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret:process.env.JWT_REFRESH_SECRET || 'super-refresh-secret',
            });
            const user = await this.prisma.user.findUnique({ where: { id:payload.id } });
            if(!user || !user.hashedRefreshToken) {
                throw new UnauthorizedException('Access Denied');
            }
			const isTokenValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
            if (!isTokenValid) {
                throw new UnauthorizedException('Access Denied');
            }

            const tokens = await this.generateTokens(user);
            await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

            return tokens;
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

// Revokes the active refresh token in PostgreSQL upon logout
    async logout(userId: string) {
        await this.prisma.user.updateMany({
            where: {
                id: userId,
                hashedRefreshToken: { not: null },
            },
            data: { hashedRefreshToken: null },
        });
    }
}