'use client';

import {useState} from 'react';
import Link from 'next/link';
import ComponentCard from '@/components/common/component-card';
import ResourceState from '@/components/common/resource-state';
import RecordForm from '@/components/forms/record-form';
import {Table,TableHeader,TableBody,TableRow,TableCell} from '@/components/ui/table';
import useResource from '@/hooks/use-resource';
import {etapas,type Mascota,type Viaje} from '@/lib/types';

export default function ViajesScreen(){
  const resource=useResource<Viaje[]>('/viajes');
  const pets=useResource<Mascota[]>('/mascotas');
  const [verArchivados,setVerArchivados]=useState(false);
  const visibles=resource.data?.filter(trip=>verArchivados||!trip.archivado);
  const hayArchivados=Boolean(resource.data?.some(trip=>trip.archivado));
  return <div className="space-y-6">
    <div><p className="mb-2 text-sm text-gray-600">Preparación / Viajes</p><h1 className="text-heading-six font-semibold text-gray-800">Viajes</h1></div>
    <div className="grid gap-6 xl:grid-cols-3">
      <ComponentCard title="Crear viaje">
        <ResourceState {...pets} retry={pets.reload}/>
        {!pets.loading&&!pets.error&&(pets.data?.length?<RecordForm name="Crear viaje" path="/viajes" fields={[
          {name:'origen',label:'Origen'},{name:'destino',label:'Destino'},{name:'fechaSalida',label:'Fecha de salida',type:'date'},
          {name:'mascotaId',label:'Mascota',options:pets.data.map(p=>({value:p.id,label:p.nombre}))}
        ]} button="Guardar viaje" success="Viaje creado." onSuccess={resource.reload}/>:<p className="text-sm text-gray-600">Primero <Link href="/mascotas" className="text-brand-700 underline">registra una mascota</Link>.</p>)}
      </ComponentCard>
      <ComponentCard title="Mis viajes" className="xl:col-span-2">
        <ResourceState {...resource} retry={resource.reload}/>
        {hayArchivados&&<label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={verArchivados} onChange={event=>setVerArchivados(event.target.checked)}/>Mostrar viajes archivados</label>}
        {!resource.loading&&!resource.error&&(visibles?.length?<div className="overflow-x-auto"><Table>
          <TableHeader><TableRow>{['Recorrido','Mascota','Salida','Etapa','Preparación'].map(label=><TableCell key={label} isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-600">{label}</TableCell>)}</TableRow></TableHeader>
          <TableBody>{visibles.map(trip=><TableRow key={trip.id} className="border-t border-gray-100"><TableCell className="px-5 py-4 text-sm text-gray-800">{trip.origen} → {trip.destino}</TableCell><TableCell className="px-5 py-4 text-sm text-gray-700">{trip.mascota.nombre}</TableCell><TableCell className="px-5 py-4 text-sm text-gray-700">{trip.fechaSalida.slice(0,10)}</TableCell><TableCell className="px-5 py-4 text-sm text-gray-700">{etapas[trip.etapa??'planificado']}{trip.archivado?' (archivado)':''}</TableCell><TableCell className="px-5 py-4"><Link href={`/viajes/${trip.id}`} className="text-sm font-medium text-brand-700 underline">Abrir checklist</Link></TableCell></TableRow>)}</TableBody>
        </Table></div>:<p className="py-6 text-sm text-gray-600">Aún no tienes viajes. Crea el primero para organizar sus tareas.</p>)}
      </ComponentCard>
    </div>
  </div>;
}
