import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Probando conexión a PostgreSQL con Prisma...');
  const result = await prisma.$queryRaw`SELECT 1 + 1 AS resultado;`;
  console.log('✅ Conexión exitosa a la base de datos! Resultado:', result);
}

main()
  .catch((err) => {
    console.error('❌ Error de conexión:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
