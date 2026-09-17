import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from '../database/database.module'; // O la ruta donde tengas tu PrismaModule

@Module({
  imports: [DatabaseModule],        // 1. Módulos externos que este módulo necesita consumir
  controllers: [UsersController], // 2. Controladores que escuchan peticiones HTTP
  providers: [UsersService],     // 3. Servicios con la lógica de negocio y base de datos
  exports: [UsersService],        // 4. (Opcional) Exporta el servicio si otros módulos lo necesitan
})
export class UsersModule {}