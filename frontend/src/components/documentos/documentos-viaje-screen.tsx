'use client';
import Link from 'next/link';
import ComponentCard from '@/components/common/component-card';
import ResourceState from '@/components/common/resource-state';
import useResource from '@/hooks/use-resource';
import {textoVigencia,type ProximoViaje} from '@/lib/types';

// SWR-DOC-017: vista única con los documentos del viaje de salida más cercana.
export default function DocumentosViajeScreen(){
  const resource=useResource<ProximoViaje>('/documentos/proximo-viaje');
  const viaje=resource.data?.viaje;
  return <div className="space-y-6">
    <div><p className="mb-2 text-sm text-gray-600">Preparación / Documentos</p><h1 className="text-heading-six font-semibold text-gray-800">Documentos del próximo viaje</h1></div>
    <ResourceState {...resource} retry={resource.reload}/>
    {resource.data&&!viaje&&<p className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">No tienes viajes próximos. Crea un viaje para ver aquí los documentos de tu mascota. <Link href="/viajes" className="text-brand-700 underline">Ir a viajes</Link></p>}
    {viaje&&resource.data&&<ComponentCard title={`${viaje.origen} → ${viaje.destino}`} desc={`${viaje.mascota.nombre} · Salida: ${viaje.fechaSalida}`}>
      {resource.data.documentos.length?<ul aria-label="Documentos del próximo viaje" className="divide-y divide-gray-100">{resource.data.documentos.map(doc=><li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
        <span className="min-w-0 break-words font-medium text-gray-800">{doc.identificacion}</span>
        <span className="flex flex-wrap items-center gap-2 text-gray-600"><span>{textoVigencia(doc)}</span>
          <span className="rounded-full border border-gray-300 px-2 py-0.5 text-xs">{doc.vinculado?'Vinculado al checklist':'Sin vincular'}</span>
          {doc.porVencer&&<span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">Por vencer</span>}
          <span className="text-xs">{doc.archivos===1?'1 archivo':`${doc.archivos} archivos`}</span></span></li>)}</ul>
        :<p className="text-sm text-gray-600">Tu mascota aún no tiene documentos registrados.</p>}
      <Link href={`/viajes/${viaje.id}`} className="text-sm font-medium text-brand-700 underline">Abrir checklist del viaje</Link>
    </ComponentCard>}
  </div>;
}
