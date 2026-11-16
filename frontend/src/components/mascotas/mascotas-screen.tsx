'use client';

import React,{useState} from 'react';
import Link from 'next/link';
import InlineEdit from '@/components/forms/inline-edit';
import MascotaFichaVista from './mascota-ficha-vista';
import Modal from '@/components/ui/modal';
import {Button} from '@/components/ui/button';
import ComponentCard from '@/components/common/component-card';
import ResourceState from '@/components/common/resource-state';
import RecordForm from '@/components/forms/record-form';
import {Table,TableHeader,TableBody,TableRow,TableCell} from '@/components/ui/table';
import useResource from '@/hooks/use-resource';
import type {Mascota} from '@/lib/types';

export default function MascotasScreen(){
  const resource=useResource<Mascota[]>('/mascotas');
  const [editing,setEditing]=useState<string|null>(null);
  const [ficha,setFicha]=useState<string|null>(null);
  return <div className="space-y-6">
    <div><p className="mb-2 text-sm text-gray-600">Preparación / Mascotas</p><h1 className="text-heading-six font-semibold text-gray-800">Mascotas</h1></div>
    <div className="grid gap-6 xl:grid-cols-3">
      <ComponentCard title="Registrar mascota"><RecordForm name="Registrar mascota" path="/mascotas" fields={[{name:'nombre',label:'Nombre o identificador visible'}]} button="Guardar mascota" success="Mascota registrada." onSuccess={resource.reload}/></ComponentCard>
      <ComponentCard title="Mis mascotas" className="xl:col-span-2">
        <ResourceState {...resource} retry={resource.reload}/>
        {!resource.loading&&!resource.error&&(resource.data?.length?<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-600">Nombre o identificador</TableCell><TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-600">Preparación</TableCell></TableRow></TableHeader><TableBody>{resource.data.map(pet=><React.Fragment key={pet.id}><TableRow className="border-t border-gray-100 transition-colors hover:bg-gray-50"><TableCell className="px-5 py-4 text-sm text-gray-800">{editing===pet.id?<InlineEdit label={`Nombre de la mascota ${pet.nombre}`} initial={pet.nombre} path={`/mascotas/${pet.id}`} field="nombre" onSaved={()=>{setEditing(null);resource.reload();}} onCancel={()=>setEditing(null)}/>:<span className="flex items-center gap-3"><span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">{pet.nombre.trim().charAt(0).toUpperCase()}</span>{pet.nombre}</span>}</TableCell><TableCell className="px-5 py-4"><div className="flex flex-wrap items-center gap-3"><Link href="/viajes" className="text-sm font-medium text-brand-700 underline">Crear viaje</Link><Button type="button" variant="outline" size="xs" aria-label={`Editar mascota ${pet.nombre}`} onClick={()=>setEditing(pet.id)}>Editar</Button><Button type="button" size="xs" aria-expanded={ficha===pet.id} aria-label={`${ficha===pet.id?'Ocultar':'Ver'} ficha de ${pet.nombre}`} onClick={()=>setFicha(ficha===pet.id?null:pet.id)}>Ficha</Button></div></TableCell></TableRow></React.Fragment>)}</TableBody></Table></div>:<p className="py-6 text-sm text-gray-600">Aún no tienes mascotas. Registra la primera para preparar un viaje.</p>)}
      </ComponentCard>
    </div>
    {(()=>{const pet=resource.data?.find(item=>item.id===ficha);return pet?<Modal etiqueta={`Ventana de ficha de ${pet.nombre}`} onClose={()=>setFicha(null)}><MascotaFichaVista mascota={pet} onSaved={resource.reload} onClose={()=>setFicha(null)}/></Modal>:null;})()}
  </div>;
}
