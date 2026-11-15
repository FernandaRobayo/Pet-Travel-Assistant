import {PrismaClient} from '@prisma/client';
import {safeError} from './redact-diagnostic.mjs';

// dotenv-cli loads the environment. Check only the runtime datasource used by
// the API; DIRECT_URL is not contacted and no migration is run.
let client;
try {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no está configurada.');
  client = new PrismaClient({datasourceUrl: process.env.DATABASE_URL, log: []});
  await client.$queryRaw`SELECT 1`;
  console.log(JSON.stringify({ok: true, source: 'DATABASE_URL'}));
} catch (error) {
  console.log(JSON.stringify({ok: false, source: 'DATABASE_URL', error: safeError(error)}));
  process.exitCode = 1;
} finally {
  await client?.$disconnect();
}
