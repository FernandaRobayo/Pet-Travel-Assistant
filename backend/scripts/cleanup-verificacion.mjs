import {PrismaClient} from '@prisma/client';

// Borra SOLO cuentas efímeras de verificación (pta-verificacion-*@example.test)
// que hayan quedado por una limpieza fallida, junto con sus registros.
// La limpieza usa DIRECT_URL (sesión, 5432): el pooler de transacciones (6543) cierra la conexión (P1017).
const client=new PrismaClient({datasourceUrl:process.env.DIRECT_URL||process.env.DATABASE_URL,log:[]});
try{
 const cuentas=await client.usuario.findMany({where:{correo:{startsWith:'pta-verificacion-',endsWith:'@example.test'}},select:{id:true,correo:true}});
 for(const {id,correo} of cuentas){
  // Sin transacción interactiva: el pooler (6543) cierra conexiones largas (P1017).
  // Se borra de hojas a raíz; si se interrumpe, basta repetir el comando.
  const tx=client;
  await tx.documentoTarea.deleteMany({where:{OR:[{tarea:{viaje:{mascota:{usuarioId:id}}}},{documento:{mascota:{usuarioId:id}}}]}});
  await tx.tarea.deleteMany({where:{viaje:{mascota:{usuarioId:id}}}});
  await tx.documento.deleteMany({where:{mascota:{usuarioId:id}}});
  await tx.viaje.deleteMany({where:{mascota:{usuarioId:id}}});
  await tx.mascota.deleteMany({where:{usuarioId:id}});
  await tx.usuario.deleteMany({where:{id,correo}});
 }
 const quedan=await client.usuario.count({where:{correo:{startsWith:'pta-verificacion-',endsWith:'@example.test'}}});
 console.log(JSON.stringify({eliminadas:cuentas.length,quedan},null,2));
}finally{await client.$disconnect();}
