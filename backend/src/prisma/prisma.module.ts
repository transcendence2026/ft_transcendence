import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

//@Global Convierte a PrismaModule en un módulo global.
//pasa a estar disponible automáticax en todos los demás módulos (como AuthModule, UsersModule, etc.)
//sin necesidad de tener que importarlo explícitamente en cada uno de ellos.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}