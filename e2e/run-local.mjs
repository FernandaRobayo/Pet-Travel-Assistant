import {spawn,spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import fs from 'node:fs/promises';
import {createServer} from 'node:net';

const root=fileURLToPath(new URL('../',import.meta.url));
const name='pta-tests-'+randomBytes(4).toString('hex');
const password=randomBytes(24).toString('hex');
const secret=randomBytes(48).toString('hex');
const url=`postgresql://postgres:${password}@127.0.0.1:55439/pta_tests`;
const env={...process.env,DATABASE_URL:url,DIRECT_URL:url,JWT_SECRET:secret,POSTGRES_PASSWORD:password,PTA_MIGRATION_TARGET:'temporary',PORT:'3001',FRONTEND_ORIGIN:'http://127.0.0.1:3000'};
const results={database:'PostgreSQL 16 efímero; no Supabase',unitarias:'Pendiente',rtl:'Pendiente',postman:'Pendiente',playwright:'Pendiente'};
const children=[];let started=false;
let suite;
const clean=text=>String(text).replaceAll(password,'[redacted]').replaceAll(secret,'[redacted]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[token redacted]');
function execute(exe,args){const r=spawnSync(exe,args,{cwd:root,env,encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});if(r.status!==0)throw new Error(clean(r.stderr||r.stdout||r.error));return r.stdout;}
async function runNode(args){
 return new Promise((ok,fail)=>{const child=spawn(process.execPath,args,{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});let logs='';child.stdout.on('data',v=>logs+=v);child.stderr.on('data',v=>logs+=v);child.on('error',fail);child.on('close',code=>{console.log(clean(logs));if(code===0)ok();else fail(new Error('Una suite no pasó; revisar el reporte.'));});});
}
function server(args){const child=spawn(process.execPath,args,{cwd:root,env,windowsHide:true,stdio:'ignore'});children.push(child);}
async function ready(url,expected){for(let i=0;i<100;i++){try{if((await fetch(url,{signal:AbortSignal.timeout(2000)})).status===expected)return;}catch{}await delay(300);}throw new Error('No inició el servicio local.');}
async function free(port){await new Promise((ok,fail)=>{const server=createServer();server.once('error',()=>fail(new Error(`Puerto ${port} ocupado; no se usarán servicios ajenos para las pruebas.`)));server.listen(port,'127.0.0.1',()=>server.close(ok));});}
try{
 await Promise.all([3000,3001,55439].map(free));
 execute('docker',['run','--rm','-d','--name',name,'-p','127.0.0.1:55439:5432','-e','POSTGRES_PASSWORD','-e','POSTGRES_DB=pta_tests','--tmpfs','/var/lib/postgresql/data','postgres:16-alpine']);started=true;
 for(let i=0;i<60;i++){if(spawnSync('docker',['exec',name,'pg_isready','-U','postgres','-d','pta_tests'],{windowsHide:true,stdio:'ignore'}).status===0)break;await delay(300);}
 execute(process.execPath,['backend/scripts/prisma-command.mjs','deploy']);
 server(['backend/dist/main.js']);server(['node_modules/next/dist/bin/next','start','frontend','--hostname','127.0.0.1','--port','3000']);
 await Promise.all([ready('http://127.0.0.1:3001/auth/me',401),ready('http://127.0.0.1:3000/login',200)]);
 suite='unitarias';await runNode(['node_modules/vitest/vitest.mjs','run','--config','backend/vitest.config.ts']);results.unitarias='23/23';
 suite='rtl';await runNode(['node_modules/vitest/vitest.mjs','run','--config','frontend/vitest.config.ts']);results.rtl='26/26';
 suite='postman';await runNode(['node_modules/newman/bin/newman.js','run','postman/Pet-Travel-Assistant.postman_collection.json','-e','postman/local.postman_environment.json']);results.postman='8/8 requests';
 suite='playwright';await runNode(['node_modules/@playwright/test/cli.js','test']);results.playwright='5/5';
}catch(error){if(suite)results[suite]='Falló';console.error(clean(error.message));process.exitCode=1;}
finally{
 for(const child of children)child.kill();
 if(started)spawnSync('docker',['rm','-f',name],{windowsHide:true,stdio:'ignore'});
 const dest=resolve(root,'docs/calidad/resultados-automatizados.json');await fs.mkdir(resolve(root,'docs/calidad'),{recursive:true});
 await fs.writeFile(dest,JSON.stringify(results,null,2));
}
