import ComponentCard from '@/components/common/component-card';
import type {Seguimiento} from '@/lib/types';

export default function SeguimientoCard({data}: {data:Seguimiento}){
  return <ComponentCard title="Seguimiento del viaje">
    <div className="grid gap-6 sm:grid-cols-3">
      <div><p className="text-sm text-gray-600">Estado general</p><p className="mt-2 text-xl font-semibold text-gray-800" role="status">{data.estadoGeneral}</p></div>
      <div><p className="text-sm text-gray-600">Progreso del checklist</p><p className="mt-2 text-2xl font-semibold text-gray-800">{data.progreso===null?'Sin elementos':`${data.progreso}%`}</p>{data.progreso!==null&&<p className="mt-1 text-sm text-gray-600">{data.tareasCompletas} de {data.totalTareas} tareas completas</p>}</div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-gray-800">{data.aviso}</div>
    </div>
    {!!data.advertencias.length&&<section aria-label="Advertencias" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="mb-2 font-medium text-gray-800">Advertencias documentales</h3><ul className="space-y-2">{data.advertencias.map(item=><li key={item.documentoId} className="text-sm text-gray-800"><strong>{item.identificacion}:</strong> {item.motivo}</li>)}</ul></section>}
    {!!data.revisiones.length&&<section aria-label="Revisiones" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="mb-2 font-medium text-gray-800">Documentos que requieren revisión</h3><ul className="space-y-2">{data.revisiones.map(item=><li key={item.documentoId} className="text-sm text-gray-800"><strong>{item.identificacion}:</strong> {item.motivo}</li>)}</ul></section>}
    {!data.advertencias.length&&!data.revisiones.length&&<p className="text-sm text-gray-600">Sin advertencias documentales.</p>}
  </ComponentCard>;
}
