'use client';

import Link from 'next/link';
import ComponentCard from '@/components/common/component-card';
import ResourceState from '@/components/common/resource-state';
import RecordForm from '@/components/forms/record-form';
import {Table,TableHeader,TableBody,TableRow,TableCell} from '@/components/ui/table';
import useResource from '@/hooks/use-resource';
import type {Mascota} from '@/lib/types';

export default function MascotasScreen(){
  const resource=useResource<Mascota[]>('/mascotas');
  return <div className="space-y-6">
    <div><p className="mb-2 text-sm text-gray-600">Preparación / Mascotas</p><h1 className="text-heading-six font-semibold text-gray-800">Mascotas</h1></div>
    <div className="grid gap-6 xl:grid-cols-3">
      <ComponentCard title="Registrar mascota"><RecordForm name="Registrar mascota" path="/mascotas" fields={[{name:'nombre',label:'Nombre o identificador visible'}]} button="Guardar mascota" success="Mascota registrada." onSuccess={resource.reload}/></ComponentCard>
      <ComponentCard title="Mis mascotas" className="xl:col-span-2">
        <ResourceState {...resource} retry={resource.reload}/>
        {!resource.loading&&!resource.error&&(resource.data?.length?<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-600">Nombre o identificador</TableCell><TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-600">Preparación</TableCell></TableRow></TableHeader><TableBody>{resource.data.map(pet=><TableRow key={pet.id} className="border-t border-gray-100"><TableCell className="px-5 py-4 text-sm text-gray-800">{pet.nombre}</TableCell><TableCell className="px-5 py-4"><Link href="/viajes" className="text-sm font-medium text-brand-700 underline">Crear viaje</Link></TableCell></TableRow>)}</TableBody></Table></div>:<p className="py-6 text-sm text-gray-600">Aún no tienes mascotas. Registra la primera para preparar un viaje.</p>)}
      </ComponentCard>
    </div>
  </div>;
}
