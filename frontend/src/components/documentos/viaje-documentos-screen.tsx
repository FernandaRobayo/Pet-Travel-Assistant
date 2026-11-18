'use client';
import Link from 'next/link';
import ResourceState from '@/components/common/resource-state';
import useResource from '@/hooks/use-resource';
import type {Tarea,Viaje} from '@/lib/types';
import DocumentosPanel from './documentos-panel';

// Pantalla propia de los documentos de la mascota de un viaje: registrar (con archivo), editar, adjuntar y vincular a tareas.
export default function ViajeDocumentosScreen({id}: {id:string}){
  const trip=useResource<Viaje>(`/viajes/${id}`);
  const tasks=useResource<Tarea[]>(`/viajes/${id}/tareas`);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="mb-2 text-sm text-gray-600"><Link href="/viajes" className="underline">Viajes</Link> / <Link href={`/viajes/${id}`} className="underline">Checklist</Link> / Documentos</p>
        <h1 className="text-heading-six font-semibold text-gray-800">Documentos{trip.data?` de ${trip.data.mascota.nombre}`:''}</h1>
        {trip.data&&<p className="mt-1 text-sm text-gray-600">{trip.data.origen} → {trip.data.destino} · Salida: {trip.data.fechaSalida.slice(0,10)}</p>}</div>
      <Link href={`/viajes/${id}`} className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50">← Volver al checklist</Link>
    </div>
    <ResourceState {...trip} retry={trip.reload}/>
    {trip.data&&<DocumentosPanel mascotaId={trip.data.mascotaId} tareas={tasks.data||[]} onLink={tasks.reload}/>}
  </div>;
}
