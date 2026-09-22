//OnModuleInit y OnModuleDestroy: Son interfaces que obligan a tu código a reaccionar 
//cuando el módulo arranca y cuando se apaga.
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
//Importa la clase principal de Prisma (PrismaClient)
// que es la que sabe hablar con la base de datos PostgreSQL.
import { PrismaClient } from '@prisma/client';
//Clase que sabe hacer todo lo que hace Prisma
//implements OnModuleInit, OnModuleDestroy: Es una promesa formal de que la clase va a implementar 
// dos funciones concretas para controlar el ciclo de vida de la conexión.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect(); //Ordena a Prisma que abra la conexión con la base datos (se ejecuta automax)
  }

  async onModuleDestroy() {
    await this.$disconnect(); //se ejecuta cuando la aplicacion se desconecta
  }
}