import ComponentCard from '@/components/common/component-card';
import {textoDias, type Seguimiento} from '@/lib/types';

const SEMAFORO={
  rojo:{texto:'Rojo: requiere revisión',clase:'bg-red-500'},amarillo:{texto:'Amarillo: con pendientes',clase:'bg-amber-400'},
  verde:{texto:'Verde: checklist completo',clase:'bg-green-500'},gris:{texto:'Gris: sin elementos',clase:'bg-gray-400'}
} as const;
const ETIQUETA={pendiente:'Pendiente',revision:'En revisión',advertencia:'Aviso'} as const;

export default function SeguimientoCard({data}: {data:Seguimiento}){
  const semaforo=data.semaforo?SEMAFORO[data.semaforo]:null;
  return <ComponentCard title="Seguimiento del viaje">
    <div className="grid gap-6 sm:grid-cols-3">
      <div><p className="text-sm text-gray-600">Estado general</p><p className="mt-2 text-xl font-semibold text-gray-800" role="status">{data.estadoGeneral}</p>
        {semaforo&&<p className="mt-2 flex items-center gap-2 text-sm text-gray-700"><span aria-hidden="true" className={`inline-block h-3 w-3 rounded-full ${semaforo.clase}`}/>Semáforo: {semaforo.texto}</p>}</div>
      <div><p className="text-sm text-gray-600">Progreso del checklist</p><p className="mt-2 text-2xl font-semibold text-gray-800">{data.progreso===null?'Sin elementos':`${data.progreso}%`}</p>{data.progreso!==null&&<p className="mt-1 text-sm text-gray-600">{data.tareasCompletas} de {data.totalTareas} tareas completas</p>}</div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-gray-800">{data.aviso}</div>
    </div>
    {data.resumen&&<dl aria-label="Resumen del viaje" className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-3">
      <div><dt className="text-gray-600">Salida</dt><dd className="font-medium text-gray-800">{textoDias(data.resumen.diasRestantes)||'Sin fecha'}</dd></div>
      <div><dt className="text-gray-600">Avisos de documentos</dt><dd className="font-medium text-gray-800">{data.resumen.advertencias}</dd></div>
      <div><dt className="text-gray-600">Documentos por vencer</dt><dd className="font-medium text-gray-800">{data.resumen.porVencer}</dd></div>
    </dl>}
    {!!data.porVencer?.length&&<section aria-label="Documentos por vencer" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="mb-2 font-medium text-gray-800">Documentos por vencer</h3><ul className="space-y-2">{data.porVencer.map(item=><li key={item.documentoId} className="text-sm text-gray-800"><strong>{item.identificacion}:</strong> vence el {item.fechaVencimiento} ({item.diasParaVencer===0?'hoy':`en ${item.diasParaVencer} días`}). Es solo un recordatorio; no cambia el estado.</li>)}</ul></section>}
    {!!data.advertencias.length&&<section aria-label="Advertencias" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="mb-2 font-medium text-gray-800">Advertencias documentales</h3><ul className="space-y-2">{data.advertencias.map(item=><li key={item.documentoId} className="text-sm text-gray-800"><strong>{item.identificacion}:</strong> {item.motivo}</li>)}</ul></section>}
    {!!data.revisiones.length&&<section aria-label="Revisiones" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="mb-2 font-medium text-gray-800">Documentos que requieren revisión</h3><ul className="space-y-2">{data.revisiones.map(item=><li key={item.documentoId} className="text-sm text-gray-800"><strong>{item.identificacion}:</strong> {item.motivo}</li>)}</ul></section>}
    {!data.advertencias.length&&!data.revisiones.length&&<p className="text-sm text-gray-600">Sin advertencias documentales.</p>}
    {!!data.lista?.length&&<section aria-label="Pendientes y avisos del viaje" className="rounded-xl border border-gray-200 p-4"><h3 className="mb-2 font-medium text-gray-800">Qué falta por revisar</h3><ul className="space-y-2">{data.lista.map((item,index)=><li key={`${item.tipo}-${item.referenciaId}-${index}`} className="flex flex-wrap gap-2 text-sm text-gray-800"><span className="rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-700">{ETIQUETA[item.tipo]}</span><span className="min-w-0 break-words">{item.texto}</span></li>)}</ul></section>}
  </ComponentCard>;
}
