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
    const code = error?.code || error?.errorCode;
    if (typeof code === 'string' && /^P\d{4}$/.test(code)) console.error(code);
    else {
      // Classify inside the process; never print the original message or URL.
      const message = String(error?.message || '');
      const category = /tenant or user not found/i.test(message) ? 'DB_TENANT'
        : /authentication failed|password authentication/i.test(message) ? 'DB_AUTH'
        : /certificate|\bTLS\b|\bSSL\b/i.test(message) ? 'DB_TLS'
        : /can.t reach|timeout|timed out|ENOTFOUND|ECONNREFUSED|ENETUNREACH/i.test(message) ? 'DB_CONNECTION'
        : 'DB_CONFIGURATION';
      console.error(category);
    }
    process.exitCode = 1;
  } finally {
    await client.$disconnect();
  }
}
