//Agrupa todas las piezas de la Autenticacion
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

//Registras y juntas el AuthController mas AuthService y se guardan en el NestJS
@Module({
	controllers: [AuthController],
	providers: [AuthService],
})
export class AuthModule {}
//al AuthModule se exporta, luego sera importado por app.module.ts