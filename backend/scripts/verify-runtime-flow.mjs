import {PrismaClient} from '@prisma/client';
import {spawn} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import {createServer} from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {safeError,redactDiagnostic} from './redact-diagnostic.mjs';

const backend=fileURLToPath(new URL('../',import.meta.url));
let client;
const correo=`pta-verificacion-${randomUUID()}@example.test`;
const contrasena=randomBytes(24).toString('hex');
const report={source:'DATABASE_URL',connected:false,apiConnected:false,flowCompleted:false,createdTestAccount:false,cleanup:'No necesaria: no se crearon datos.'};
let api,usuarioId,mayHaveCreated=false,apiLogs='';
async function freePort(){return await new Promise((ok,fail)=>{const server=createServer();server.on('error',fail);server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>ok(port));});});}
try{
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL no está configurada.');
 client=new PrismaClient({datasourceUrl:process.env.DATABASE_URL,log:[]});
 await client.$queryRaw`SELECT 1`;report.connected=true;
 const port=await freePort();
 api=spawn(process.execPath,[resolve(backend,'dist/main.js')],{cwd:backend,env:{...process.env,PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});
 api.stdout.on('data',chunk=>apiLogs+=chunk);api.stderr.on('data',chunk=>apiLogs+=chunk);
 api.on('error',()=>{apiLogs+='No se pudo iniciar el proceso de la API.';});
 const base=`http://127.0.0.1:${port}`;
 for(let i=0;i<100;i++){
  if(api.exitCode!==null)throw new Error(redactDiagnostic(apiLogs));
  try{if((await fetch(base+'/auth/me',{signal:AbortSignal.timeout(1000)})).status===401){report.apiConnected=true;break;}}catch{}
  await delay(300);
 }
 if(!report.apiConnected)throw new Error('La API no estuvo disponible dentro del tiempo de comprobación.');
 async function call(path,method='GET',body,token,expected=200){
  const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
  const data=await response.json();
  if(response.status!==expected)throw new Error(`Recorrido detenido en ${method} ${path}: HTTP ${response.status}.`);
  return data;
 }
 if(await client.usuario.findUnique({where:{correo},select:{id:true}}))throw new Error('No se pudo reservar una cuenta única de prueba.');
 mayHaveCreated=true;
 const user=await call('/auth/register','POST',{correo,contrasena},null,201);usuarioId=user.id;report.createdTestAccount=true;
 const {accessToken}=await call('/auth/login','POST',{correo,contrasena});
 const pet=await call('/mascotas','POST',{nombre:'Mascota de verificación temporal'},accessToken,201);
 const departure=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
 const expiry=new Date(Date.now()+90*86400000).toISOString().slice(0,10);
 const trip=await call('/viajes','POST',{origen:'Neiva',destino:'Bogotá',fechaSalida:departure,mascotaId:pet.id},accessToken,201);
 const task=await call(`/viajes/${trip.id}/tareas`,'POST',{descripcion:'Comprobar documento de viaje'},accessToken,201);
 if(task.estado!=='pendiente')throw new Error('La tarea nueva no nació pendiente.');
 const doc=await call(`/mascotas/${pet.id}/documentos`,'POST',{identificacion:'Documento temporal de verificación',vigencia:'fecha',fechaVencimiento:expiry},accessToken,201);
 await call(`/tareas/${task.id}/documentos`,'POST',{documentoId:doc.id},accessToken,201);
 await call(`/tareas/${task.id}/estado`,'PATCH',{estado:'completa'},accessToken);
 const follow=await call(`/viajes/${trip.id}/seguimiento`,'GET',undefined,accessToken);
 if(follow.estadoGeneral!=='Checklist completo'||follow.progreso!==100||follow.advertencias.length)throw new Error('El seguimiento no coincide con el resultado esperado.');
 report.flowCompleted=true;report.result={estadoGeneral:follow.estadoGeneral,progreso:follow.progreso,aviso:follow.aviso};
}catch(error){report.error=safeError(error);process.exitCode=1;}
finally{
 if(mayHaveCreated){
  try{
   await client.$transaction(async tx=>{
    const own=await tx.usuario.findUnique({where:{correo},select:{id:true}});
    if(!own)return;
    if(usuarioId&&own.id!==usuarioId)throw new Error('La identidad de limpieza no coincide; no se borraron datos.');
    const id=own.id;
    await tx.documentoTarea.deleteMany({where:{OR:[{tarea:{viaje:{mascota:{usuarioId:id}}}},{documento:{mascota:{usuarioId:id}}}]}});
    await tx.tarea.deleteMany({where:{viaje:{mascota:{usuarioId:id}}}});
    await tx.documento.deleteMany({where:{mascota:{usuarioId:id}}});
    await tx.viaje.deleteMany({where:{mascota:{usuarioId:id}}});
    await tx.mascota.deleteMany({where:{usuarioId:id}});
    await tx.usuario.deleteMany({where:{id,correo}});
   });
   if(await client.usuario.count({where:{correo}}))throw new Error('Quedó la cuenta de prueba.');
   report.cleanup='Completada: se eliminó únicamente la cuenta efímera creada por esta ejecución y sus registros.';
  }catch(error){report.cleanup='Falló; revisar la cuenta de prueba creada por esta ejecución.';report.cleanupAccount={id:usuarioId??null,correo};report.cleanupError=safeError(error);process.exitCode=1;}
 }
 api?.kill();await client?.$disconnect();
 // Never export credentials, access tokens or raw HTTP responses. A test account
 // identifier is reported only if needed to recover from failed cleanup.
 console.log(JSON.stringify(report,null,2));
}
