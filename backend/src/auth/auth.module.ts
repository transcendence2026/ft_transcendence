//Agrupa todas las piezas de la Autenticacion
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

//Registras y juntas el AuthController mas AuthService y se guardan en el NestJS
@Module({
	imports: [
		PrismaModule,
    	JwtModule.register({
      		secret: process.env.JWT_SECRET || 'super-secret', // O tu config de entorno
      		signOptions: { expiresIn: '1d' },
    	}),
	],
	controllers: [AuthController],
	providers: [AuthService],
})
export class AuthModule {}
//al AuthModule se exporta, luego sera importado por app.module.ts