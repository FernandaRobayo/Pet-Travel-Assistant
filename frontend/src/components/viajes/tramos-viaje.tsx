'use client';
import {FormEvent,useState} from 'react';
import FormField from '@/components/forms/form-field';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/components/auth/auth-provider';
import {api} from '@/lib/api';
import type {Tramo} from '@/lib/types';

// SWR-VIA-010: más de un tramo por viaje.
export default function TramosViaje({viajeId,tramos,onChange}: {viajeId:string;tramos:Tramo[];onChange:()=>void}){
  const {token}=useAuth();
  const [busy,setBusy]=useState(false),[errors,setErrors]=useState<Record<string,string>>({}),[message,setMessage]=useState('');
  async function agregar(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setMessage('');
    const form=event.currentTarget,data=new FormData(form);
    const payload={origen:String(data.get('origen')||'').trim(),destino:String(data.get('destino')||'').trim(),fecha:String(data.get('fecha')||'')};
    const next:Record<string,string>={};
    for(const [key,value] of Object.entries(payload))if(!value)next[key]='Este campo es obligatorio.';
    setErrors(next);if(Object.keys(next).length)return;
    setBusy(true);
    try{await api(`/viajes/${viajeId}/tramos`,token,{method:'POST',body:JSON.stringify(payload)});form.reset();setMessage('Tramo agregado.');onChange();}
    catch(reason){setErrors({general:reason instanceof Error?reason.message:'No se pudo agregar el tramo.'});}
    finally{setBusy(false);}
  }
  async function quitar(id:string){
    setBusy(true);setMessage('');
    try{await api(`/viajes/${viajeId}/tramos/${id}`,token,{method:'DELETE'});setMessage('Tramo eliminado.');onChange();}
    catch(reason){setErrors({general:reason instanceof Error?reason.message:'No se pudo eliminar el tramo.'});}
    finally{setBusy(false);}
  }
  return <div className="space-y-4">
    {tramos.length?<ul aria-label="Tramos del viaje" className="divide-y divide-gray-100">{tramos.map(tramo=><li key={tramo.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><span className="min-w-0 break-words text-gray-800">{tramo.origen} → {tramo.destino} · {tramo.fecha.slice(0,10)}</span><Button type="button" variant="outline" size="xs" disabled={busy} aria-label={`Quitar tramo ${tramo.origen} a ${tramo.destino}`} onClick={()=>void quitar(tramo.id)}>Quitar</Button></li>)}</ul>
      :<p className="text-sm text-gray-600">El viaje no tiene tramos adicionales.</p>}
    <form aria-label="Agregar tramo" noValidate onSubmit={agregar} className="grid gap-4 sm:grid-cols-3">
      <FormField id="tramo-origen" name="origen" label="Origen del tramo" error={errors.origen} required/>
      <FormField id="tramo-destino" name="destino" label="Destino del tramo" error={errors.destino} required/>
      <FormField id="tramo-fecha" name="fecha" label="Fecha del tramo" type="date" error={errors.fecha} required/>
      <div className="sm:col-span-3"><Button type="submit" disabled={busy}>{busy?'Guardando…':'Agregar tramo'}</Button></div>
    </form>
    {errors.general&&<p role="alert" className="text-sm text-red-700">{errors.general}</p>}
    {message&&<p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{message}</p>}
  </div>;
}
