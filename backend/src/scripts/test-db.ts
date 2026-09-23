import { PrismaClient } from '@prisma/client';

// Initialize the Prisma Client instance
const prisma = new PrismaClient();

async function main() {
  // Log the initial connection attempt
  console.log('Testing PostgreSQL connection with Prisma...');

  // Execute a raw query to verify the database connection
  const result = await prisma.$queryRaw`SELECT 1 + 1 AS result;`;

  // Log successful execution along with the query result
  console.log('Successfully connected to the database! Result:', result);
}

main()
  .catch((err) => {
    // Handle and log any connection errors, then exit with a failure code
    console.error('Connection error:', err);
    process.exit(1);
  })
  .finally(async () => {
    // Ensure the Prisma Client disconnects after execution
    await prisma.$disconnect();
  });
