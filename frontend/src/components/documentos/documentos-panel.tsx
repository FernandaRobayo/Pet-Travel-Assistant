'use client';
import {FormEvent,useState} from 'react';
import ComponentCard from '@/components/common/component-card';
import ResourceState from '@/components/common/resource-state';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/components/auth/auth-provider';
import useResource from '@/hooks/use-resource';
import {api} from '@/lib/api';
import type {Documento,Tarea} from '@/lib/types';
import DocumentoForm from './documento-form';
import ArchivosDocumento from './archivos-documento';
import {textoVigencia} from '@/lib/types';

export default function DocumentosPanel({mascotaId,tareas,onLink}: {mascotaId:string;tareas:Tarea[];onLink:()=>void}){
  const docs=useResource<Documento[]>(`/mascotas/${mascotaId}/documentos`);
  const {token}=useAuth();
  const [editing,setEditing]=useState<string|null>(null);
  const [archivos,setArchivos]=useState<string|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  async function link(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');setMessage('');
    const data=new FormData(event.currentTarget);
    const tareaId=String(data.get('tareaId')||''),documentoId=String(data.get('documentoId')||'');
    if(!tareaId||!documentoId){setError('Selecciona una tarea y un documento.');return;}
    setBusy(true);
    try{await api(`/tareas/${tareaId}/documentos`,token,{method:'POST',body:JSON.stringify({documentoId})});setMessage('Documento vinculado. El seguimiento se actualizó.');onLink();}
    catch(reason){setError(reason instanceof Error?reason.message:'No se pudo vincular.');}
    finally{setBusy(false);}
  }
  const selectClass='h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800';
  return <div className="grid gap-6 xl:grid-cols-3">
    <ComponentCard title="Registrar documento"><DocumentoForm mascotaId={mascotaId} onSuccess={docs.reload}/></ComponentCard>
    <ComponentCard title="Documentos de la mascota" className="xl:col-span-2" desc="Se evalúan únicamente los documentos vinculados a tareas de este viaje.">
      <ResourceState {...docs} retry={docs.reload}/>
      {docs.data&&!docs.data.length&&<p className="text-sm text-gray-600">Aún no hay documentos para esta mascota.</p>}
      {!!docs.data?.length&&<ul aria-label="Documentos registrados" className="divide-y divide-gray-100">{docs.data.map(doc=><li key={doc.id} className="py-3 text-sm">{editing===doc.id
      ?<DocumentoForm mascotaId={mascotaId} documento={doc} onCancel={()=>setEditing(null)} onSuccess={()=>{setEditing(null);docs.reload();onLink();}}/>
      :<div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium text-gray-800">{doc.identificacion}</span><span className="flex items-center gap-3"><span className="text-gray-600">{doc.vigencia==='fecha'?doc.fechaVencimiento?.slice(0,10):textoVigencia(doc)}</span><Button type="button" variant="outline" size="xs" aria-label={`Editar documento ${doc.identificacion}`} onClick={()=>setEditing(doc.id)}>Editar</Button><Button type="button" variant="outline" size="xs" aria-expanded={archivos===doc.id} aria-label={`Archivos de ${doc.identificacion}`} onClick={()=>setArchivos(archivos===doc.id?null:doc.id)}>Archivos</Button></span></div>}{editing!==doc.id&&archivos===doc.id&&<div className="mt-3"><ArchivosDocumento documentoId={doc.id} identificacion={doc.identificacion}/></div>}</li>)}</ul>}
      {!!docs.data?.length&&!!tareas.length&&<form aria-label="Vincular documento" onSubmit={link} noValidate className="space-y-4 border-t border-gray-100 pt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><label htmlFor="documentoId" className="block text-sm font-medium text-gray-700">Documento a vincular</label><select id="documentoId" name="documentoId" className={selectClass}><option value="">Selecciona un documento</option>{docs.data.map(doc=><option key={doc.id} value={doc.id}>{doc.identificacion}</option>)}</select></div>
          <div className="space-y-2"><label htmlFor="tareaId" className="block text-sm font-medium text-gray-700">Tarea a vincular</label><select id="tareaId" name="tareaId" className={selectClass}><option value="">Selecciona una tarea</option>{tareas.map(task=><option key={task.id} value={task.id}>{task.descripcion}</option>)}</select></div>
        </div><Button type="submit" disabled={busy}>{busy?'Vinculando…':'Vincular documento'}</Button>
      </form>}
      {!!docs.data?.length&&!tareas.length&&<p className="text-sm text-gray-600">Agrega una tarea para vincular un documento.</p>}
      {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
      {message&&<p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{message}</p>}
    </ComponentCard>
  </div>;
}
