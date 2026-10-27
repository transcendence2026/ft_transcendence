import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import type { WebSocketAdapter } from '@nestjs/common/interfaces/websockets/web-socket-adapter.interface.js';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

class CompatibleWsAdapter extends WsAdapter {
  bindClientConnect(server: { on: (event: string, callback: Function) => unknown }, callback: Function) {
    server.on('connection', callback);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Aplicar Helmet a nivel de servidor HTTP
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  // Configura el prefijo global para que todas las rutas respondan bajo /api
  //app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, //Aborta peticion (400) si alguien intenta colar un campo no predeterminado
      transform: true, //evita que el servidor interprete números o booleanos como simples palabras, previniendo errores de lógica y validación.
    }),
  );
  app.use(cookieParser()); //parsear cookies entrantes
  app.enableCors({
      origin: process.env.FRONTEND_URL || 'https://localhost:8443', //le dice al backend q acepte lo que le llega de ese puerto
      credentials: true, //aceptas que el navegador guarde cookies y credenciales de sesion.
  });
  
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Backend listening on port ${port}`);
}

void bootstrap();
