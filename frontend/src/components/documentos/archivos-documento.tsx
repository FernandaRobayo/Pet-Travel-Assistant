'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/components/auth/auth-provider';
import useResource from '@/hooks/use-resource';
import {api} from '@/lib/api';
import {LIMITE_MB,abrirEnPestana,obtenerArchivo,subirArchivo,validarCliente} from '@/lib/files';
import {textoTamano,type ArchivoDocumento} from '@/lib/types';

const EXTENSIONES=['.pdf','.jpg','.jpeg','.png'];
const fecha=(iso:string)=>iso.slice(0,10);

// SWR-DOC-008..016: archivos adjuntos con vista previa, reemplazo y versiones. Un documento puede existir sin archivo (SWR-DOC-009).
// El software no interpreta el contenido del archivo (SWR-DOC-012).
export default function ArchivosDocumento({documentoId,identificacion}: {documentoId:string;identificacion:string}){
  const {token}=useAuth();
  const lista=useResource<ArchivoDocumento[]>(`/documentos/${documentoId}/archivos`);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [previa,setPrevia]=useState<{url:string;tipo:string;nombre:string}|null>(null);
  const [confirmar,setConfirmar]=useState<string|null>(null);
  const [versiones,setVersiones]=useState<{archivoId:string;items:ArchivoDocumento[]}|null>(null);
  useEffect(()=>()=>{if(previa)URL.revokeObjectURL(previa.url);},[previa]);

  async function accion(fn:()=>Promise<unknown>,exito:string,fallo:string){
    setBusy(true);setError('');setMessage('');
    try{await fn();if(exito)setMessage(exito);}catch(reason){setError(reason instanceof Error?reason.message:fallo);}finally{setBusy(false);}
  }
  function validar(archivo:File|undefined):File|null{
    if(!archivo)return null;
    const problema=validarCliente(archivo,EXTENSIONES,LIMITE_MB.documento);
    if(problema){setError(problema);setMessage('');return null;}
    return archivo;
  }
  const adjuntar=(archivo:File|undefined)=>{const ok=validar(archivo);if(ok)void accion(async()=>{await subirArchivo(`/documentos/${documentoId}/archivos`,token,ok);lista.reload();},'Archivo adjuntado.','No se pudo adjuntar el archivo.');};
  const reemplazar=(id:string,archivo:File|undefined)=>{const ok=validar(archivo);if(ok)void accion(async()=>{await subirArchivo(`/archivos/${id}/reemplazo`,token,ok);setVersiones(null);lista.reload();},'Archivo reemplazado. La versión anterior se conserva.','No se pudo reemplazar el archivo.');};
  const eliminar=(id:string)=>void accion(async()=>{await api(`/archivos/${id}`,token,{method:'DELETE'});setConfirmar(null);setVersiones(null);lista.reload();},'Archivo eliminado.','No se pudo eliminar el archivo.');
  const abrir=(id:string)=>void accion(()=>abrirEnPestana(`/archivos/${id}/contenido`,token),'','No se pudo abrir el archivo.');
  const vistaPrevia=(a:ArchivoDocumento)=>void accion(async()=>{const blob=await obtenerArchivo(`/archivos/${a.id}/contenido`,token);setPrevia({url:URL.createObjectURL(blob),tipo:a.tipo,nombre:a.nombre});},'','No se pudo mostrar la vista previa.');
  const verVersiones=(a:ArchivoDocumento)=>void accion(async()=>{
    if(versiones?.archivoId===a.id){setVersiones(null);return;}
    const items=await api<ArchivoDocumento[]>(`/archivos/${a.id}/versiones`,token);setVersiones({archivoId:a.id,items});
  },'','No se pudieron cargar las versiones.');

  return <div className="space-y-4 rounded-xl bg-gray-50 p-4">
    {lista.loading&&<p className="text-sm text-gray-600">Cargando archivos…</p>}
    {lista.error&&<p role="alert" className="text-sm text-red-700">{lista.error}</p>}
    {lista.data&&!lista.data.length&&<p className="text-sm text-gray-600">Este documento no tiene archivos adjuntos.</p>}
    {!!lista.data?.length&&<ul aria-label={`Archivos de ${identificacion}`} className="space-y-3">{lista.data.map(a=><li key={a.id} className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="min-w-0 break-words font-medium text-gray-800">{a.nombre}</span><span className="text-xs text-gray-600">Versión {a.version} · {textoTamano(a.tamano)} · {fecha(a.creadoEn)}</span></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="xs" disabled={busy} aria-label={`Abrir ${a.nombre}`} onClick={()=>abrir(a.id)}>Abrir</Button>
        <Button type="button" variant="outline" size="xs" disabled={busy} aria-label={`Vista previa de ${a.nombre}`} onClick={()=>vistaPrevia(a)}>Vista previa</Button>
        <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-700 focus-within:ring-2 focus-within:ring-brand-300">Reemplazar<input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" disabled={busy} aria-label={`Reemplazar ${a.nombre}`} onChange={event=>{reemplazar(a.id,event.target.files?.[0]);event.target.value='';}}/></label>
        <Button type="button" variant="outline" size="xs" disabled={busy} aria-label={`Eliminar ${a.nombre}`} onClick={()=>setConfirmar(a.id)} className="text-red-700">Eliminar</Button>
        {(a.versiones??1)>1&&<Button type="button" variant="outline" size="xs" disabled={busy} aria-expanded={versiones?.archivoId===a.id} aria-label={`Versiones de ${a.nombre}`} onClick={()=>verVersiones(a)}>Versiones ({a.versiones})</Button>}
      </div>
      {confirmar===a.id&&<div role="alertdialog" aria-label={`Confirmar eliminación de ${a.nombre}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-gray-800"><span>¿Eliminar «{a.nombre}»{(a.versiones??1)>1?` (versión ${a.version})`:''}? No se puede deshacer.</span><span className="flex gap-2"><Button type="button" size="xs" disabled={busy} onClick={()=>eliminar(a.id)}>Sí, eliminar</Button><Button type="button" variant="outline" size="xs" onClick={()=>setConfirmar(null)}>Cancelar</Button></span></div>}
      {versiones?.archivoId===a.id&&<ul aria-label={`Historial de ${a.nombre}`} className="space-y-1 border-t border-gray-100 pt-2">{versiones.items.map(v=><li key={v.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-700"><span className="min-w-0 break-words">Versión {v.version}: {v.nombre} · {textoTamano(v.tamano)} · {fecha(v.creadoEn)}</span><Button type="button" variant="outline" size="xs" disabled={busy} aria-label={`Abrir versión ${v.version} de ${a.nombre}`} onClick={()=>abrir(v.id)}>Abrir</Button></li>)}</ul>}
    </li>)}</ul>}
    {previa&&<div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="min-w-0 break-words text-sm font-medium text-gray-800">Vista previa: {previa.nombre}</p><Button type="button" variant="outline" size="xs" onClick={()=>setPrevia(null)}>Cerrar vista previa</Button></div>
      {previa.tipo.startsWith('image/')
        // eslint-disable-next-line @next/next/no-img-element
        ?<img src={previa.url} alt={`Vista previa de ${previa.nombre}`} className="max-h-96 max-w-full rounded-lg"/>
        :<iframe src={previa.url} title={`Vista previa de ${previa.nombre}`} className="h-96 w-full rounded-lg border border-gray-200"/>}</div>}
    <div className="space-y-2"><label htmlFor={`adjuntar-${documentoId}`} className="block text-sm font-medium text-gray-700">Adjuntar archivo (PDF, JPG o PNG, máx. {LIMITE_MB.documento} MB)</label>
      <input id={`adjuntar-${documentoId}`} type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={busy} aria-label={`Adjuntar archivo a ${identificacion}`} onChange={event=>{adjuntar(event.target.files?.[0]);event.target.value='';}} className="block w-full text-sm text-gray-700"/>
      <p className="text-xs text-gray-600">El archivo es solo evidencia: la aplicación no lee su contenido ni cambia la vigencia a partir de él.</p></div>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {message&&<p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{message}</p>}
  </div>;
}
