import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
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
 // Apply Helmet at the HTTP server level
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.enableCors({ origin: true, credentials: true });
  app.useWebSocketAdapter(new CompatibleWsAdapter(app));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, //Abort request (400) if someone attempts to include a non-default field
      transform: true,
    }),
  );
  //Parsing incoming cookies
  app.use(cookieParser());
  // Allow requests and cookies only from the authorized frontend origin
  app.enableCors({
      origin: process.env.FRONTEND_URL || 'https://localhost:8443',
      credentials: true,
  });
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Backend listening on port ${port}`);
}

void bootstrap();
