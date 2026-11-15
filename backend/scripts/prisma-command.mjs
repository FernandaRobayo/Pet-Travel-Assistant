import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const backend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const operation = process.argv[2];

// Only inspect existence here. Prisma/dotenv loads the configuration in the child;
// this wrapper never reads or prints the environment file or child diagnostics.
if (!['check', 'dev', 'deploy'].includes(operation)) {
  console.error('Operación no válida.');
  process.exit(1);
}
if (!existsSync(resolve(backend, '.env')) && !(process.env.DATABASE_URL && process.env.DIRECT_URL)) {
  console.error('No se pudo verificar la conexión: falta backend/.env o la configuración del proceso.');
  process.exit(1);
}

let args;
if (operation === 'check') {
  args = [require.resolve('dotenv-cli/cli.js'), '-e', '.env', '--', process.execPath, resolve(backend, 'scripts/check-connection.mjs')];
} else {
  args = [require.resolve('prisma/build/index.js'), 'migrate', operation, ...(operation === 'dev' ? ['--name', 'mvp_base'] : [])];
}
const child = spawn(process.execPath, args, {cwd: backend, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe']});
let errorCode = '';
let missingConfiguration = false;
let shadowDatabaseFailure = false;
const collect = chunk => {
  const text = chunk.toString();
  errorCode ||= text.match(/\b(?:P\d{4}|DB_(?:TENANT|AUTH|TLS|CONNECTION|CONFIGURATION))\b/)?.[0] || '';
  missingConfiguration ||= /Falta configuración|Environment variable not found/.test(text);
  shadowDatabaseFailure ||= /P3014|shadow database/i.test(text);
};
child.stdout.on('data', collect);
child.stderr.on('data', collect);
// No reset, data-loss acceptance or interactive approval is sent to Prisma.
child.stdin.end();
child.on('error', () => {
  console.error('No se pudo iniciar la comprobación de base de datos.');
  process.exitCode = 1;
});
child.on('close', code => {
  if (code === 0) console.log(operation === 'check' ? 'Conexión al pooler y a la conexión de migraciones: correcta.' : 'Migración finalizada correctamente.');
  else if (missingConfiguration) console.error('No se pudo verificar la conexión: falta configuración.');
  else if (shadowDatabaseFailure) console.error('migrate dev no pudo completar la operación: necesita una base shadow permitida. No se ejecutó reset.');
  else console.error(`${operation === 'check' ? 'Comprobación de conexión' : 'Migración'} no completada${errorCode ? ` (${errorCode})` : ''}. No se muestran detalles de conexión ni secretos.`);
  process.exitCode = code === 0 ? 0 : 1;
});
