'use client';
import Link from 'next/link';
import ComponentCard from '@/components/common/component-card';
import useResource from '@/hooks/use-resource';
import {textoVigencia,type Documento} from '@/lib/types';

// Resumen compacto de los documentos dentro del checklist; la gestión completa vive en su propia pantalla.
export default function DocumentosResumen({viajeId,mascotaId,nombre}: {viajeId:string;mascotaId:string;nombre:string}){
  const docs=useResource<Documento[]>(`/mascotas/${mascotaId}/documentos`);
  const lista=docs.data??[];
  return <ComponentCard title={`Documentos de ${nombre}`} desc="Se evalúan únicamente los documentos vinculados a tareas de este viaje.">
    {docs.error&&<p role="alert" className="text-sm text-red-700">{docs.error}</p>}
    {docs.data&&!lista.length&&<p className="text-sm text-gray-600">Aún no hay documentos para esta mascota.</p>}
    {!!lista.length&&<ul aria-label="Resumen de documentos" className="divide-y divide-gray-100">{lista.slice(0,4).map(doc=><li key={doc.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span className="min-w-0 truncate font-medium text-gray-800">{doc.identificacion}</span><span className="shrink-0 text-gray-600">{doc.vigencia==='fecha'?doc.fechaVencimiento?.slice(0,10):textoVigencia(doc)}</span></li>)}</ul>}
    {lista.length>4&&<p className="text-xs text-gray-500">y {lista.length-4} más</p>}
    <Link href={`/viajes/${viajeId}/documentos`} className="inline-flex h-11 items-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white transition hover:bg-brand-600">Gestionar documentos</Link>
  </ComponentCard>;
}
