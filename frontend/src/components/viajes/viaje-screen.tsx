'use client';

import {useState} from 'react';
import Link from 'next/link';
import ComponentCard from '@/components/common/component-card';
import ResourceState from '@/components/common/resource-state';
import RecordForm from '@/components/forms/record-form';
import TaskList from '@/components/checklist/task-list';
import PlantillasChecklist from '@/components/checklist/plantillas-checklist';
import useResource from '@/hooks/use-resource';
import {useAuth} from '@/components/auth/auth-provider';
import {Button} from '@/components/ui/button';
import {descargar} from '@/lib/files';
import {etapas,type Tarea,type Viaje,type Seguimiento} from '@/lib/types';
import DocumentosPanel from '@/components/documentos/documentos-panel';
import SeguimientoCard from '@/components/seguimiento/seguimiento-card';
import EditarViaje from '@/components/viajes/editar-viaje';
import DatosViaje from '@/components/viajes/datos-viaje';
import TramosViaje from '@/components/viajes/tramos-viaje';
import ReglasViaje from '@/components/viajes/reglas-viaje';

export default function ViajeScreen({id}: {id:string}){
  const {token}=useAuth();
  const trip=useResource<Viaje>(`/viajes/${id}`);
  const tasks=useResource<Tarea[]>(`/viajes/${id}/tareas`);
  const seguimiento=useResource<Seguimiento>(`/viajes/${id}/seguimiento`);
  const [pdfError,setPdfError]=useState('');
  function refresh(){tasks.reload();seguimiento.reload();}
  async function exportar(){
    setPdfError('');
    try{await descargar(`/viajes/${id}/checklist/pdf`,token,'checklist.pdf');}
    catch(reason){setPdfError(reason instanceof Error?reason.message:'No se pudo exportar el PDF.');}
  }
  return <div className="space-y-6">
    <div><Link href="/viajes" className="text-sm text-gray-600 underline">Viajes</Link><h1 className="mt-2 text-heading-six font-semibold text-gray-800">Checklist del viaje</h1></div>
    <ResourceState {...trip} retry={trip.reload}/>
    {trip.data&&<>
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5"><h2 className="text-lg font-semibold text-gray-800">{trip.data.origen} → {trip.data.destino}</h2><p className="mt-1 text-sm text-gray-600">{trip.data.mascota.nombre} · Salida: {trip.data.fechaSalida.slice(0,10)} · Etapa: {etapas[trip.data.etapa??'planificado']}</p>
        <div className="mt-4 flex flex-wrap items-start gap-3"><EditarViaje viaje={trip.data} onSaved={()=>{trip.reload();seguimiento.reload();}}/><Button type="button" variant="outline" size="sm" onClick={()=>void exportar()}>Exportar checklist a PDF</Button></div>
        {pdfError&&<p role="alert" className="mt-3 text-sm text-red-700">{pdfError}</p>}</div>
      <ResourceState {...seguimiento} retry={seguimiento.reload}/>
      {seguimiento.data&&<SeguimientoCard data={seguimiento.data}/>}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <ComponentCard title="Agregar tarea"><RecordForm name="Agregar tarea" path={`/viajes/${id}/tareas`} fields={[{name:'descripcion',label:'Descripción de la tarea'}]} button="Agregar tarea" success="Tarea agregada en estado pendiente." onSuccess={refresh}/></ComponentCard>
          <ComponentCard title="Crear desde una plantilla"><PlantillasChecklist viajeId={id} onApplied={refresh}/></ComponentCard>
        </div>
        <ComponentCard title="Tareas de preparación" className="xl:col-span-2"><ResourceState {...tasks} retry={tasks.reload}/>{tasks.data&&<TaskList tareas={tasks.data} onChange={refresh}/>}</ComponentCard>
      </div>
      <ComponentCard title="Transporte y alojamiento" desc="Datos opcionales del viaje."><DatosViaje viaje={trip.data} onSaved={trip.reload}/></ComponentCard>
      <div className="grid gap-6 xl:grid-cols-2">
        <ComponentCard title="Tramos del viaje" desc="Agrega los tramos adicionales de la ruta."><TramosViaje viajeId={id} tramos={trip.data.tramos??[]} onChange={trip.reload}/></ComponentCard>
        <ComponentCard title="Reglas del transportador (PDF)" desc="Adjunta como referencia el PDF del transportador."><ReglasViaje viajeId={id} reglas={trip.data.reglas} onChange={trip.reload}/></ComponentCard>
      </div>
      <DocumentosPanel mascotaId={trip.data.mascotaId} tareas={tasks.data||[]} onLink={refresh}/>
    </>}
  </div>;
}
