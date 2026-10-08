import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Configura el prefijo global para que todas las rutas respondan bajo /api
  //app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(cookieParser()); //parsear cookies entrantes
  app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:8443', //le dice al backend q acepte lo que le llega de ese puerto
      credentials: true, //aceptas que el navegador guarde cookies y credenciales de sesion.
  });
  
  await app.listen(Number(process.env.PORT ?? 3000));
  
  console.log(`Backend listening on port ${process.env.PORT ?? 3000}`);
}

void bootstrap();
