'use client';

import Link from 'next/link';
import ComponentCard from '@/components/common/component-card';
import ResourceState from '@/components/common/resource-state';
import RecordForm from '@/components/forms/record-form';
import TaskList from '@/components/checklist/task-list';
import useResource from '@/hooks/use-resource';
import type {Tarea,Viaje,Seguimiento} from '@/lib/types';
import DocumentosPanel from '@/components/documentos/documentos-panel';
import SeguimientoCard from '@/components/seguimiento/seguimiento-card';

export default function ViajeScreen({id}: {id:string}){
  const trip=useResource<Viaje>(`/viajes/${id}`);
  const tasks=useResource<Tarea[]>(`/viajes/${id}/tareas`);
  const seguimiento=useResource<Seguimiento>(`/viajes/${id}/seguimiento`);
  function refresh(){tasks.reload();seguimiento.reload();}
  return <div className="space-y-6">
    <div><Link href="/viajes" className="text-sm text-gray-600 underline">Viajes</Link><h1 className="mt-2 text-heading-six font-semibold text-gray-800">Checklist del viaje</h1></div>
    <ResourceState {...trip} retry={trip.reload}/>
    {trip.data&&<>
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5"><h2 className="text-lg font-semibold text-gray-800">{trip.data.origen} → {trip.data.destino}</h2><p className="mt-1 text-sm text-gray-600">{trip.data.mascota.nombre} · Salida: {trip.data.fechaSalida.slice(0,10)}</p></div>
      <div className="grid gap-6 xl:grid-cols-3">
        <ComponentCard title="Agregar tarea"><RecordForm name="Agregar tarea" path={`/viajes/${id}/tareas`} fields={[{name:'descripcion',label:'Descripción de la tarea'}]} button="Agregar tarea" success="Tarea agregada en estado pendiente." onSuccess={refresh}/></ComponentCard>
        <ComponentCard title="Tareas de preparación" className="xl:col-span-2"><ResourceState {...tasks} retry={tasks.reload}/>{tasks.data&&<TaskList tareas={tasks.data} onChange={refresh}/>}</ComponentCard>
      </div>
      <DocumentosPanel mascotaId={trip.data.mascotaId} tareas={tasks.data||[]} onLink={refresh}/>
      <ResourceState {...seguimiento} retry={seguimiento.reload}/>
      {seguimiento.data&&<SeguimientoCard data={seguimiento.data}/>}
    </>}
  </div>;
}
