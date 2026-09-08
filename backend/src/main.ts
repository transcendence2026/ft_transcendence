import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });
  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(Number(process.env.PORT ?? 3000));
  
  console.log(`Backend listening on port ${process.env.PORT ?? 3000}`);
}

void bootstrap();