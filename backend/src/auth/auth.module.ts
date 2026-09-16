//Agrupa todas las piezas de la Autenticacion
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
//ConfigModule: Es el encargado de ir a buscar el archivo .env, leerlo y
// y cargar variables de entorno en la aplicacion
//ConfigService: Es la herramienta que inyectas en tus clases
//para buscar y consultar esas variables desde el código.
import { ConfigModule, ConfigService } from '@nestjs/config';
//Libreria para gestionar la identificacion de los usuarios
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
//JwtStrategy dice a Passport las reglas de cómo debe interceptar, leer y validar un token JWT
//cuando llega una petición HTTP
import { JwtStrategy } from './strategies/jwt.strategy.js';
//PrismaModule da acceso a la Base de Datos
import { PrismaModule } from '../prisma/prisma.module.js';

//Registras y juntas el AuthController mas AuthService y se guardan en el NestJS
@Module({
	imports: [
		ConfigModule,
		PrismaModule,
		PassportModule,
    	JwtModule.registerAsync({
    	imports: [ConfigModule],
    	inject: [ConfigService],
   		useFactory: (configService: ConfigService) => ({
        	secret: configService.get<string>('JWT_SECRET') || 'super-secret',
        	signOptions: { expiresIn: '15m' },
    		}),
		}),
	],
	//Registras el controler y el service para que NestJS sepa de su existencia
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy], // Registramos el servicio y la estrategia de Passport
})
export class AuthModule {}
//al AuthModule se exporta, luego sera importado por app.module.ts
//Cuando arranca el servidor, NestJS lee appModule que a su vez importa AuthModule
//si no lo hiciera no sabria las rutas de registro y login