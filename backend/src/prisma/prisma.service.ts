// OnModuleInit and OnModuleDestroy: interfaces that force the class to react
// when the module starts up and when it shuts down.
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// Imports the main Prisma class (PrismaClient),
// which knows how to talk to the PostgreSQL database.
import { PrismaClient } from '@prisma/client';
// Class that can do everything Prisma does.
// implements OnModuleInit, OnModuleDestroy: a formal promise that this class
// will implement two specific functions to control the connection lifecycle.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ log: ['error'] });
  }
  async onModuleInit() {
    await this.$connect(); // Tells Prisma to open the database connection (runs automatically)
  }

  async onModuleDestroy() {
    await this.$disconnect(); // Runs when the application shuts down
  }
}