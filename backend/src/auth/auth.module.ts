//Agrupa todas las piezas de la Autenticacion
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
//PrismaModule da acceso a la Base de Datos
import { PrismaModule } from '../prisma/prisma.module.js';

//Registras y juntas el AuthController mas AuthService y se guardan en el NestJS
@Module({
	imports: [
		PrismaModule,
    	JwtModule.register({
      		secret: process.env.JWT_SECRET || 'super-secret', // define contraseña maestra para firmar token
      		signOptions: { expiresIn: '1d' }, //token caduca tras 1 día
    	}),
	],
	//Registras el controler y el service para que NestJS sepa de su existencia
	controllers: [AuthController],
	providers: [AuthService],
})
export class AuthModule {}
//al AuthModule se exporta, luego sera importado por app.module.ts
//Cuando arranca el servidor, NestJS lee appModule que a su vez importa AuthModule
//si no lo hiciera no sabria las rutas de registro y login