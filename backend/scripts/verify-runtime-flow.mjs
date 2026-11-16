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
const correo2=`pta-verificacion-${randomUUID()}@example.test`;
const correosCreados=[];
const contrasena=randomBytes(24).toString('hex');
const report={incremento2:'No ejecutado',source:'DATABASE_URL',connected:false,apiConnected:false,flowCompleted:false,createdTestAccount:false,cleanup:'No necesaria: no se crearon datos.'};
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

 // ---- Incremento 2: SWR que estaban fuera del MVP evaluado (mismas reglas, datos temporales) ----
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64');
 const pdf=Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n');
 const pdf2=Buffer.concat([pdf,Buffer.from('% segunda version\n')]);
 const fail=(texto)=>{throw new Error('Incremento 2: '+texto);};
 const ok=(condicion,texto)=>{if(!condicion)fail(texto);};
 async function form(path,campos,archivo,token,expected=201,method='POST'){
  const body=new FormData();for(const [k,v] of Object.entries(campos))body.append(k,v);
  if(archivo)body.append('archivo',new Blob([archivo.datos],{type:archivo.tipo}),archivo.nombre);
  const response=await fetch(base+path,{method,headers:token?{Authorization:'Bearer '+token}:{},body,signal:AbortSignal.timeout(20000)});
  const data=await response.json().catch(()=>({}));
  if(response.status!==expected)fail(`${method} ${path} devolvió HTTP ${response.status} (se esperaba ${expected}).`);
  return data;
 }
 async function raw(path,token,expected=200){
  const response=await fetch(base+path,{headers:token?{Authorization:'Bearer '+token}:{},signal:AbortSignal.timeout(20000)});
  if(response.status!==expected)fail(`GET ${path} devolvió HTTP ${response.status} (se esperaba ${expected}).`);
  return {tipo:response.headers.get('content-type')||'',bytes:Buffer.from(await response.arrayBuffer())};
 }
 const A=accessToken;
 // MAS-005..010
 const ficha=await call(`/mascotas/${pet.id}`,'PATCH',{especie:'Perro',raza:'Criollo',edad:4,peso:12.5,notas:'Nota',veterinarioNombre:'Dra. Prueba',veterinarioTelefono:'3000000000',contactoEmergencia:'Ana 3000000001',medicacion:'Ninguna'},A);
 ok(ficha.especie==='Perro'&&ficha.edad===4&&ficha.peso===12.5&&ficha.medicacion==='Ninguna','La ficha de la mascota no guardó los datos.');
 await call(`/mascotas/${pet.id}`,'PATCH',{edad:-1},A,400);
 // MAS-007 / DATA-006
 await form(`/mascotas/${pet.id}/foto`,{},{datos:Buffer.from('no es una imagen'),tipo:'image/png',nombre:'x.png'},A,400);
 await form(`/mascotas/${pet.id}/foto`,{},{datos:png,tipo:'image/png',nombre:'luna.png'},A);
 ok((await raw(`/mascotas/${pet.id}/foto`,A)).tipo.startsWith('image/png'),'La foto no se devolvió como imagen.');
 ok((await call('/mascotas','GET',undefined,A))[0].tieneFoto===true,'La mascota no indica que tiene foto.');
 // VIA-007..013
 const viajeDatos=await call(`/viajes/${trip.id}`,'PATCH',{origen:'Neiva',destino:'Bogotá',fechaSalida:departure,transporte:'avion',aerolinea:'Aerolínea Prueba',numeroVuelo:'AB123',horaSalida:'08:30',aeropuerto:'Aeropuerto Prueba',alojamientoNombre:'Hotel Pet',alojamientoDireccion:'Calle 1',alojamientoConfirmacion:'CONF1',etapa:'en_preparacion'},A);
 ok(viajeDatos.transporte==='avion'&&viajeDatos.horaSalida==='08:30'&&viajeDatos.etapa==='en_preparacion','El viaje no guardó transporte, hora o etapa.');
 await call(`/viajes/${trip.id}`,'PATCH',{origen:'Neiva',destino:'Bogotá',fechaSalida:departure,horaSalida:'25:99'},A,400);
 await call(`/viajes/${trip.id}/archivo`,'PATCH',{archivado:true},A,400);
 const tramo=await call(`/viajes/${trip.id}/tramos`,'POST',{origen:'Bogotá',destino:'Medellín',fecha:departure},A,201);
 ok((await call(`/viajes/${trip.id}`,'GET',undefined,A)).tramos.length===1,'El tramo no aparece en el viaje.');
 // REG-001..006 / DATA-004
 await form(`/viajes/${trip.id}/reglas`,{},{datos:pdf,tipo:'application/pdf',nombre:'reglas.pdf'},A,400);
 await form(`/viajes/${trip.id}/reglas`,{transportador:'Aerolínea Prueba'},{datos:png,tipo:'image/png',nombre:'reglas.png'},A,400);
 await form(`/viajes/${trip.id}/reglas`,{transportador:'Aerolínea Prueba'},{datos:pdf,tipo:'application/pdf',nombre:'reglas.pdf'},A);
 await form(`/viajes/${trip.id}/reglas`,{transportador:'Otra Aerolínea'},{datos:pdf2,tipo:'application/pdf',nombre:'reglas-v2.pdf'},A);
 const reglas=await raw(`/viajes/${trip.id}/reglas`,A);
 ok(reglas.tipo.startsWith('application/pdf')&&reglas.bytes.equals(pdf2),'El PDF de reglas no se reemplazó.');
 ok((await call(`/viajes/${trip.id}`,'GET',undefined,A)).reglas.transportador==='Otra Aerolínea','El viaje no muestra el transportador.');
 ok((await call(`/viajes/${trip.id}/tareas`,'GET',undefined,A)).length===1,'El PDF de reglas generó tareas.');
 await call(`/viajes/${trip.id}`,'PATCH',{origen:'Neiva',destino:'Bogotá',fechaSalida:departure,etapa:'finalizado'},A);
 ok((await call(`/viajes/${trip.id}/archivo`,'PATCH',{archivado:true},A)).archivado===true,'No se archivó el viaje finalizado.');
 await call(`/viajes/${trip.id}/archivo`,'PATCH',{archivado:false},A);
 // DOC-008..016
 await form(`/documentos/${doc.id}/archivos`,{},{datos:Buffer.from('MZ programa'),tipo:'application/pdf',nombre:'falso.pdf'},A,400);
 const archivo1=await form(`/documentos/${doc.id}/archivos`,{},{datos:pdf,tipo:'application/pdf',nombre:'certificado.pdf'},A);
 ok(archivo1.version===1,'El archivo no nació en versión 1.');
 await form(`/documentos/${doc.id}/archivos`,{},{datos:png,tipo:'image/png',nombre:'carne.png'},A);
 const archivo2=await form(`/archivos/${archivo1.id}/reemplazo`,{},{datos:pdf2,tipo:'application/pdf',nombre:'certificado-v2.pdf'},A);
 ok(archivo2.version===2,'El reemplazo no creó la versión 2.');
 const lista=await call(`/documentos/${doc.id}/archivos`,'GET',undefined,A);
 ok(lista.length===2&&lista.find(a=>a.nombre==='certificado-v2.pdf')?.versiones===2,'La lista no agrupa las versiones.');
 ok((await call(`/archivos/${archivo2.id}/versiones`,'GET',undefined,A)).length===2,'No se conserva el historial de versiones.');
 ok((await raw(`/archivos/${archivo1.id}/contenido`,A)).bytes.equals(pdf)&&(await raw(`/archivos/${archivo2.id}/contenido`,A)).bytes.equals(pdf2),'El contenido de las versiones no coincide.');
 await raw(`/archivos/${archivo1.id}/contenido`,null,401);
 const unico=await call(`/mascotas/${pet.id}/documentos`,'POST',{identificacion:'Documento sin archivo',vigencia:'desconocida'},A,201);
 ok((await call(`/documentos/${unico.id}/archivos`,'GET',undefined,A)).length===0,'Un documento sin archivo debería listar cero archivos.');
 const proximo=await call('/documentos/proximo-viaje','GET',undefined,A);
 ok(proximo.viaje?.id===trip.id&&proximo.documentos.some(d=>d.id===doc.id&&d.vinculado&&d.archivos===2),'La vista de documentos del próximo viaje no coincide.');
 // CHK-006..014
 const conPlantilla=await call(`/viajes/${trip.id}/tareas/plantilla`,'POST',{plantillaId:'avion'},A,201);
 ok(conPlantilla.length>=7&&conPlantilla.every(t=>t.estado==='pendiente'||t.id===task.id),'La plantilla no creó tareas pendientes.');
 await call(`/viajes/${trip.id}/tareas/plantilla`,'POST',{plantillaId:'no-existe'},A,404);
 const limite=new Date(Date.now()+10*86400000).toISOString().slice(0,10);
 const editada=await call(`/tareas/${task.id}`,'PATCH',{descripcion:'Comprobar documento de viaje (editado)',fechaLimite:limite,responsable:'Ana',comentario:'Con cuidado',recurrente:true},A);
 ok(editada.responsable==='Ana'&&editada.recurrente===true&&String(editada.fechaLimite).slice(0,10)===limite&&editada.comentario==='Con cuidado','La tarea no guardó sus detalles.');
 const antes=await call(`/viajes/${trip.id}/seguimiento`,'GET',undefined,A);
 const sub=await call(`/tareas/${task.id}/subtareas`,'POST',{descripcion:'Subtarea temporal'},A,201);
 await call(`/subtareas/${sub.id}`,'PATCH',{completa:true},A);
 const despues=await call(`/viajes/${trip.id}/seguimiento`,'GET',undefined,A);
 ok(despues.totalTareas===antes.totalTareas&&despues.progreso===antes.progreso,'Las subtareas alteraron el progreso.');
 ok((await call(`/viajes/${trip.id}/tareas`,'GET',undefined,A)).find(t=>t.id===task.id).subtareas.length===1,'La subtarea no aparece en la tarea.');
 const ids=(await call(`/viajes/${trip.id}/tareas`,'GET',undefined,A)).map(t=>t.id);
 const invertido=[...ids].reverse();
 const reordenadas=await call(`/viajes/${trip.id}/tareas/orden`,'PATCH',{ids:invertido},A);
 ok(JSON.stringify(reordenadas.map(t=>t.id))===JSON.stringify(invertido),'El nuevo orden no se guardó.');
 await call(`/viajes/${trip.id}/tareas/orden`,'PATCH',{ids:ids.slice(1)},A,400);
 await call(`/subtareas/${sub.id}`,'DELETE',undefined,A);
 const viaje2=await call('/viajes','POST',{origen:'Cali',destino:'Cartagena',fechaSalida:departure,mascotaId:pet.id},A,201);
 const heredadas=await call(`/viajes/${viaje2.id}/tareas`,'GET',undefined,A);
 ok(heredadas.length===1&&heredadas[0].recurrente===true&&heredadas[0].estado==='pendiente'&&heredadas[0].descripcion.includes('editado'),'La tarea recurrente no se copió al viaje nuevo.');
 await call(`/viajes/${viaje2.id}/archivo`,'PATCH',{archivado:true},A,400);
 // SEG-018..021 y CHK-015
 const seg=await call(`/viajes/${trip.id}/seguimiento`,'GET',undefined,A);
 ok(seg.diasRestantes>=29&&seg.diasRestantes<=31&&['rojo','amarillo','verde','gris'].includes(seg.semaforo)&&Array.isArray(seg.lista)&&seg.resumen&&Array.isArray(seg.pendientes),'El seguimiento ampliado no trae días, semáforo, lista y resumen.');
 const exportado=await raw(`/viajes/${trip.id}/checklist/pdf`,A);
 ok(exportado.tipo.startsWith('application/pdf')&&exportado.bytes.subarray(0,5).toString()==='%PDF-'&&exportado.bytes.length>500,'El checklist no se exportó como PDF.');
 // ACC-004
 ok(typeof user.codigoRecuperacion==='string'&&/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/.test(user.codigoRecuperacion),'El registro no entregó código de recuperación.');
 const nuevaContrasena=randomBytes(24).toString('hex');
 await call('/auth/recuperar','POST',{correo,codigo:'AAAA-BBBB-CCCC-DDDD',contrasena:nuevaContrasena},null,401);
 const renovado=await call('/auth/recuperar','POST',{correo,codigo:user.codigoRecuperacion.toLowerCase(),contrasena:nuevaContrasena},null,200);
 ok(renovado.codigoRecuperacion&&renovado.codigoRecuperacion!==user.codigoRecuperacion,'La recuperación no renovó el código.');
 await call('/auth/recuperar','POST',{correo,codigo:user.codigoRecuperacion,contrasena:nuevaContrasena},null,401);
 await call('/auth/login','POST',{correo,contrasena},null,401);
 const sesionNueva=await call('/auth/login','POST',{correo,contrasena:nuevaContrasena});
 const generado=await call('/auth/codigo-recuperacion','POST',undefined,sesionNueva.accessToken,200);
 ok(generado.codigoRecuperacion&&generado.codigoRecuperacion!==renovado.codigoRecuperacion,'No se pudo renovar el código desde la sesión.');
 // ACC-003 / SEC-001: otra cuenta no ve ni modifica nada de lo anterior
 correosCreados.push(correo2);
 await call('/auth/register','POST',{correo:correo2,contrasena},null,201);
 const B=(await call('/auth/login','POST',{correo:correo2,contrasena})).accessToken;
 const sub2=await call(`/tareas/${task.id}/subtareas`,'POST',{descripcion:'Subtarea para aislamiento'},A,201);
 const intentos=[
  ['GET',`/viajes/${trip.id}`,404],['PATCH',`/viajes/${trip.id}`,404,{origen:'x',destino:'y',fechaSalida:departure}],['PATCH',`/viajes/${trip.id}/archivo`,404,{archivado:false}],
  ['POST',`/viajes/${trip.id}/tramos`,404,{origen:'x',destino:'y',fecha:departure}],['DELETE',`/viajes/${trip.id}/tramos/${tramo.id}`,404],
  ['GET',`/viajes/${trip.id}/tareas`,404],['POST',`/viajes/${trip.id}/tareas`,404,{descripcion:'x'}],['PATCH',`/viajes/${trip.id}/tareas/orden`,404,{ids:ids}],
  ['POST',`/viajes/${trip.id}/tareas/plantilla`,404,{plantillaId:'avion'}],['GET',`/viajes/${trip.id}/seguimiento`,404],['GET',`/viajes/${trip.id}/checklist/pdf`,404],
  ['PATCH',`/tareas/${task.id}`,404,{descripcion:'x'}],['PATCH',`/tareas/${task.id}/estado`,404,{estado:'completa'}],['POST',`/tareas/${task.id}/subtareas`,404,{descripcion:'x'}],
  ['PATCH',`/subtareas/${sub2.id}`,404,{completa:true}],['DELETE',`/subtareas/${sub2.id}`,404],
  ['PATCH',`/mascotas/${pet.id}`,404,{nombre:'x'}],['GET',`/mascotas/${pet.id}/foto`,404],['GET',`/mascotas/${pet.id}/documentos`,404],
  ['PATCH',`/documentos/${doc.id}`,404,{identificacion:'x',vigencia:'desconocida'}],['GET',`/documentos/${doc.id}/archivos`,404],
  ['GET',`/archivos/${archivo1.id}/contenido`,404],['GET',`/archivos/${archivo1.id}/versiones`,404],['GET',`/viajes/${trip.id}/reglas`,404]
 ];
 for(const [metodo,ruta,esperado,cuerpo] of intentos){
  const response=await fetch(base+ruta,{method:metodo,headers:{'Content-Type':'application/json',Authorization:'Bearer '+B},body:cuerpo?JSON.stringify(cuerpo):undefined,signal:AbortSignal.timeout(15000)});
  if(response.status!==esperado)fail(`Aislamiento: ${metodo} ${ruta} devolvió HTTP ${response.status} (se esperaba ${esperado}).`);
 }
 await form(`/archivos/${archivo1.id}/reemplazo`,{},{datos:pdf,tipo:'application/pdf',nombre:'ajeno.pdf'},B,404);
 await form(`/viajes/${trip.id}/reglas`,{transportador:'Ajeno'},{datos:pdf,tipo:'application/pdf',nombre:'ajeno.pdf'},B,404);
 await form(`/documentos/${doc.id}/archivos`,{},{datos:pdf,tipo:'application/pdf',nombre:'ajeno.pdf'},B,404);
 await form(`/mascotas/${pet.id}/foto`,{},{datos:png,tipo:'image/png',nombre:'ajena.png'},B,404);
 ok((await call('/documentos/proximo-viaje','GET',undefined,B)).viaje===null,'La otra cuenta ve documentos ajenos.');
 report.incremento2=`Completado: ${intentos.length+4} intentos de acceso ajeno bloqueados; ficha, foto, viaje, tramos, reglas PDF, archivos versionados, plantilla, subtareas, orden, recurrentes, PDF, seguimiento ampliado y recuperación verificados.`;
}catch(error){report.error=safeError(error);process.exitCode=1;}
finally{
 if(mayHaveCreated){
  try{
   // Sin transacción interactiva: el pooler (6543) cierra conexiones largas (P1017).
   // Se borra de hojas a raíz y solo la cuenta efímera creada por esta ejecución.
   // DIRECT_URL (sesión, 5432): el pooler de transacciones (6543) cierra la conexión (P1017).
   const tx=new PrismaClient({datasourceUrl:process.env.DIRECT_URL||process.env.DATABASE_URL,log:[]});
   try{
   for(const c of [correo,...correosCreados]){
   const own=await tx.usuario.findUnique({where:{correo:c},select:{id:true}});
   if(own){
    if(c===correo&&usuarioId&&own.id!==usuarioId)throw new Error('La identidad de limpieza no coincide; no se borraron datos.');
    const id=own.id;
    await tx.documentoTarea.deleteMany({where:{OR:[{tarea:{viaje:{mascota:{usuarioId:id}}}},{documento:{mascota:{usuarioId:id}}}]}});
    await tx.tarea.deleteMany({where:{viaje:{mascota:{usuarioId:id}}}});
    await tx.documento.deleteMany({where:{mascota:{usuarioId:id}}});
    await tx.viaje.deleteMany({where:{mascota:{usuarioId:id}}});
    await tx.mascota.deleteMany({where:{usuarioId:id}});
    await tx.usuario.deleteMany({where:{id,correo:c}});
   }
   }
   }finally{await tx.$disconnect();}
   if(await client.usuario.count({where:{correo:{in:[correo,...correosCreados]}}}))throw new Error('Quedó la cuenta de prueba.');
   report.cleanup='Completada: se eliminó únicamente la cuenta efímera creada por esta ejecución y sus registros.';
  }catch(error){report.cleanup='Falló; revisar la cuenta de prueba creada por esta ejecución.';report.cleanupAccount={id:usuarioId??null,correo};report.cleanupError=safeError(error);process.exitCode=1;}
 }
 api?.kill();await client?.$disconnect();
 // Never export credentials, access tokens or raw HTTP responses. A test account
 // identifier is reported only if needed to recover from failed cleanup.
 console.log(JSON.stringify(report,null,2));
}
