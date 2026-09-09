//metemos AuthModule dentro de la AppModule, así cuando arranque la aplicacion,
//enciende tambien el modulo de autenticacion
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js'; //importas la rama

@Module({
	imports: [AuthModule], //la conectas al tronco principal de la App
	controllers: [],
	providers: [],
})
export class AppModule {}