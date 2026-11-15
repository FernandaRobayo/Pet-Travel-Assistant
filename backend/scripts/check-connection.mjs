import {PrismaClient} from '@prisma/client';

// dotenv-cli supplies environment variables; no file content or URL is printed.
if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.error('Falta configuración.');
  process.exit(1);
}

for (const datasourceUrl of [process.env.DATABASE_URL, process.env.DIRECT_URL]) {
  const client = new PrismaClient({datasourceUrl, log: []});
  try {
    await client.$queryRaw`SELECT 1`;
  } catch (error) {
    if (typeof error?.code === 'string' && /^P\d{4}$/.test(error.code)) console.error(error.code);
    process.exitCode = 1;
  } finally {
    await client.$disconnect();
  }
}
