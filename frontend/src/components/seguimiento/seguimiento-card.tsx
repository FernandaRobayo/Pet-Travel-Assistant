import {textoDias, type Seguimiento} from '@/lib/types';

const SEMAFORO={
  rojo:{texto:'Rojo: requiere revisión',clase:'bg-red-500'},amarillo:{texto:'Amarillo: con pendientes',clase:'bg-amber-400'},
  verde:{texto:'Verde: checklist completo',clase:'bg-green-500'},gris:{texto:'Gris: sin elementos',clase:'bg-gray-400'}
} as const;
const ETIQUETA={pendiente:'Pendiente',revision:'En revisión',advertencia:'Aviso'} as const;
const BARRA={rojo:'bg-red-500',amarillo:'bg-amber-400',verde:'bg-green-500',gris:'bg-gray-300'} as const;

// Seguimiento compacto: estado, progreso y resumen en una sola franja. Las alertas documentales siguen visibles; el detalle de pendientes se pliega si es largo.
export default function SeguimientoCard({data}: {data:Seguimiento}){
  const semaforo=data.semaforo?SEMAFORO[data.semaforo]:null;
  const relleno=data.semaforo?BARRA[data.semaforo]:'bg-brand-500';
  return <section aria-label="Seguimiento del viaje" className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
    <div className="grid items-center gap-5 lg:grid-cols-[1fr_1.3fr_auto]">
      <div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Estado general</p>
        <p className="mt-1 text-lg font-semibold text-gray-800" role="status">{data.estadoGeneral}</p>
        {semaforo&&<p className="mt-1 flex items-center gap-2 text-xs text-gray-600"><span aria-hidden="true" className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${semaforo.clase}`}/><span>Semáforo: {semaforo.texto}</span></p>}</div>
      <div><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Progreso del checklist</p>
        <div className="mt-1 flex items-center gap-3">
          <p className="text-2xl font-semibold text-gray-800">{data.progreso===null?'Sin elementos':`${data.progreso}%`}</p>
          {data.progreso!==null&&<div role="progressbar" aria-label="Avance del checklist" aria-valuemin={0} aria-valuemax={100} aria-valuenow={data.progreso} className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200"><div className={`h-full rounded-full transition-all duration-500 ${relleno}`} style={{width:`${data.progreso}%`}}/></div>}
        </div>
        {data.progreso!==null&&<p className="mt-1 text-xs text-gray-600">{data.tareasCompletas} de {data.totalTareas} tareas completas</p>}</div>
      {data.resumen&&<dl aria-label="Resumen del viaje" className="flex gap-2 text-center">
        <div className="flex flex-col-reverse rounded-xl bg-gray-50 px-3 py-2"><dt className="text-[11px] text-gray-500">Salida</dt><dd className="text-sm font-semibold text-gray-800">{textoDias(data.resumen.diasRestantes)||'Sin fecha'}</dd></div>
        <div className="flex flex-col-reverse rounded-xl bg-gray-50 px-3 py-2"><dt className="text-[11px] text-gray-500">Avisos de documentos</dt><dd className="text-sm font-semibold text-gray-800">{data.resumen.advertencias}</dd></div>
        <div className="flex flex-col-reverse rounded-xl bg-gray-50 px-3 py-2"><dt className="text-[11px] text-gray-500">Documentos por vencer</dt><dd className="text-sm font-semibold text-gray-800">{data.resumen.porVencer}</dd></div>
      </dl>}
    </div>
    <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-gray-700"><span aria-hidden="true">ⓘ</span><span>{data.aviso}</span></p>
    {!!data.porVencer?.length&&<section aria-label="Documentos por vencer" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="mb-2 text-sm font-medium text-gray-800">Documentos por vencer</h3><ul className="space-y-2">{data.porVencer.map(item=><li key={item.documentoId} className="text-sm text-gray-800"><strong>{item.identificacion}:</strong> vence el {item.fechaVencimiento} ({item.diasParaVencer===0?'hoy':`en ${item.diasParaVencer} días`}). Es solo un recordatorio; no cambia el estado.</li>)}</ul></section>}
    {!!data.advertencias.length&&<section aria-label="Advertencias" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="mb-2 text-sm font-medium text-gray-800">Advertencias documentales</h3><ul className="space-y-2">{data.advertencias.map(item=><li key={item.documentoId} className="text-sm text-gray-800"><strong>{item.identificacion}:</strong> {item.motivo}</li>)}</ul></section>}
    {!!data.revisiones.length&&<section aria-label="Revisiones" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="mb-2 text-sm font-medium text-gray-800">Documentos que requieren revisión</h3><ul className="space-y-2">{data.revisiones.map(item=><li key={item.documentoId} className="text-sm text-gray-800"><strong>{item.identificacion}:</strong> {item.motivo}</li>)}</ul></section>}
    {!data.advertencias.length&&!data.revisiones.length&&<p className="text-xs text-gray-500">Sin advertencias documentales.</p>}
    {!!data.lista?.length&&<details open={data.lista.length<=3} className="group rounded-xl border border-gray-200">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 [&::-webkit-details-marker]:hidden"><span>Qué falta por revisar ({data.lista.length})</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg></summary>
      <section aria-label="Pendientes y avisos del viaje" className="border-t border-gray-100 p-4"><ul className="space-y-2">{data.lista.map((item,index)=><li key={`${item.tipo}-${item.referenciaId}-${index}`} className="flex flex-wrap gap-2 text-sm text-gray-800"><span className="rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-700">{ETIQUETA[item.tipo]}</span><span className="min-w-0 break-words">{item.texto}</span></li>)}</ul></section>
    </details>}
  </section>;
}
