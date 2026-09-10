//metemos AuthModule dentro de la AppModule, así cuando arranque la aplicacion,
//enciende tambien el modulo de autenticacion
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js'; //importas la rama

@Module({
	imports: [
		AuthModule, //Importa el Modulo de Autenticación
		//Modulos siguientes que importaremos cuando se hagan
		//UsersModule,  //Modulo para gesrionar perfiles y datos usuarios
		//ProductsModule, //Modulo para catálogo de tienda
		//OrdersModule, //Modulo para compras y carritos
	],
	controllers: [],
	providers: [],
})
export class AppModule {}