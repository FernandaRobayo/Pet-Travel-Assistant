'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/components/auth/auth-provider';
import useResource from '@/hooks/use-resource';
import {api} from '@/lib/api';
import type {Plantilla} from '@/lib/types';

// SWR-CHK-006 / SWR-CHK-007: crear tareas desde una plantilla y modificarlas libremente después.
export default function PlantillasChecklist({viajeId,onApplied}: {viajeId:string;onApplied:()=>void}){
  const {token}=useAuth();
  const plantillas=useResource<Plantilla[]>('/plantillas');
  const [elegida,setElegida]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const actual=plantillas.data?.find(p=>p.id===elegida);
  async function aplicar(){
    if(!elegida){setError('Selecciona una plantilla.');return;}
    setBusy(true);setError('');setMessage('');
    try{await api(`/viajes/${viajeId}/tareas/plantilla`,token,{method:'POST',body:JSON.stringify({plantillaId:elegida})});setMessage('Plantilla aplicada. Las tareas quedaron pendientes y puedes editarlas.');onApplied();}
    catch(reason){setError(reason instanceof Error?reason.message:'No se pudo aplicar la plantilla.');}
    finally{setBusy(false);}
  }
  if(!plantillas.data?.length)return null;
  return <div className="space-y-3">
    <div className="space-y-2"><label htmlFor="plantilla" className="block text-sm font-medium text-gray-700">Plantilla de checklist</label>
      <select id="plantilla" value={elegida} onChange={event=>setElegida(event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800"><option value="">Selecciona una plantilla</option>{plantillas.data.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
    {actual&&<p className="text-xs text-gray-600">Agrega {actual.tareas.length} tareas pendientes.</p>}
    <Button type="button" variant="outline" disabled={busy} onClick={()=>void aplicar()}>{busy?'Aplicando…':'Usar plantilla'}</Button>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {message&&<p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{message}</p>}
  </div>;
}
