import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {appendFileSync} from 'node:fs';
import {resolve} from 'node:path';
const backend=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);
// Both inputs are local datamodels. This command does not connect to a database.
const result=spawnSync(process.execPath,[require.resolve('prisma/build/index.js'),'migrate','diff','--from-empty','--to-schema-datamodel','prisma/schema.prisma','--script','--output','prisma/bootstrap.sql'],{cwd:backend,windowsHide:true,stdio:'ignore'});
if(result.status!==0){console.error('No se pudo generar el SQL de inicialización.');process.exit(1);}
appendFileSync(resolve(backend,'prisma/bootstrap.sql'),`\n-- Custom invariant: Prisma datamodel does not encode CHECK constraints.\nALTER TABLE "Documento" ADD CONSTRAINT "Documento_vigencia_check" CHECK (("vigencia" = 'fecha' AND "fechaVencimiento" IS NOT NULL) OR ("vigencia" <> 'fecha' AND "fechaVencimiento" IS NULL));\n`);
console.log('SQL generado en backend/prisma/bootstrap.sql. No se ejecutó contra ninguna base.');
