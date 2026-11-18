'use client';

import {useState} from 'react';
import Link from 'next/link';
import ComponentCard from '@/components/common/component-card';
import Plegable from '@/components/common/plegable';
import ResourceState from '@/components/common/resource-state';
import RecordForm from '@/components/forms/record-form';
import TaskList from '@/components/checklist/task-list';
import PlantillasChecklist from '@/components/checklist/plantillas-checklist';
import useResource from '@/hooks/use-resource';
import {useAuth} from '@/components/auth/auth-provider';
import {Button} from '@/components/ui/button';
import {descargar} from '@/lib/files';
import {etapas,type Tarea,type Viaje,type Seguimiento} from '@/lib/types';
import DocumentosResumen from '@/components/documentos/documentos-resumen';
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
  const tramos=trip.data?.tramos??[];
  const sinTareas=tasks.data?.length===0;
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
      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <ComponentCard title="Tareas de preparación" desc="Agrega, completa y ordena lo que falta antes de viajar.">
            <RecordForm name="Agregar tarea" path={`/viajes/${id}/tareas`} fields={[{name:'descripcion',label:'Descripción de la tarea'}]} button="Agregar tarea" success="Tarea agregada en estado pendiente." onSuccess={refresh}/>
            <ResourceState {...tasks} retry={tasks.reload}/>{tasks.data&&<TaskList tareas={tasks.data} onChange={refresh}/>}
          </ComponentCard>
          <DocumentosResumen viajeId={id} mascotaId={trip.data.mascotaId} nombre={trip.data.mascota.nombre}/>
        </div>
        <div className="space-y-3">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Más herramientas</h2>
          <Plegable key={sinTareas?'vacio':'con'} titulo="Crear desde una plantilla" resumen="Avión, carretera o bus" abierto={sinTareas}><PlantillasChecklist viajeId={id} onApplied={refresh}/></Plegable>
          <Plegable titulo="Transporte y alojamiento" resumen={trip.data.transporte||trip.data.alojamientoNombre?[trip.data.transporte,trip.data.alojamientoNombre].filter(Boolean).join(' · '):'Datos opcionales del viaje'}><DatosViaje viaje={trip.data} onSaved={trip.reload}/></Plegable>
          <Plegable titulo="Tramos del viaje" resumen={tramos.length?`${tramos.length} ${tramos.length===1?'tramo':'tramos'}`:'Sin tramos adicionales'}><TramosViaje viajeId={id} tramos={tramos} onChange={trip.reload}/></Plegable>
          <Plegable titulo="Reglas del transportador (PDF)" resumen={trip.data.reglas?`${trip.data.reglas.transportador}`:'Sin PDF adjunto'}><ReglasViaje viajeId={id} reglas={trip.data.reglas} onChange={trip.reload}/></Plegable>
        </div>
      </div>
    </>}
  </div>;
}
