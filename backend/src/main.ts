import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common'; 
import { AppModule } from './app.module.js';

//bootstrap es la funcion encargada de arrancar la aplicacion
//enciende el motor conectando el AppModule
async function bootstrap() {
    const app = await NestFactory.create(AppModule);

	// Configura el prefijo global para que todas las rutas respondan bajo /api
    app.setGlobalPrefix('api');
	
    //Habilita las reglas de validacion que hay en los DTOs (que datos esten bien formateados)
    //ValidationPipe revisa por ej que la contraseña cumple requisitos minimos de seguridad
    app.useGlobalPipes(new ValidationPipe());
    // Aquí usamos await porque crear la app y abrir el puerto de red toma unos milisegundos
    await app.listen(3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();