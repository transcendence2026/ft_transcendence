import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Configura el prefijo global para que todas las rutas respondan bajo /api
  //app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(new ValidationPipe());
  
  await app.listen(Number(process.env.PORT ?? 3000));
  
  console.log(`Backend listening on port ${process.env.PORT ?? 3000}`);
}

void bootstrap();
