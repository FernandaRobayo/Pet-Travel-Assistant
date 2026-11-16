'use client';
import {FormEvent,useState} from 'react';
import FormField from '@/components/forms/form-field';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/components/auth/auth-provider';
import {api} from '@/lib/api';
import type {Viaje} from '@/lib/types';

// Incremento extra (SWR-VIA-006). Al cambiar la fecha de salida, el seguimiento se recalcula (SWR-SEG-014).
export default function EditarViaje({viaje,onSaved}: {viaje:Viaje;onSaved:()=>void}){
  const {token}=useAuth();
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [errors,setErrors]=useState<Record<string,string>>({});
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    const payload={origen:String(data.get('origen')||'').trim(),destino:String(data.get('destino')||'').trim(),fechaSalida:String(data.get('fechaSalida')||'')};
    const next:Record<string,string>={};
    for(const [key,value] of Object.entries(payload))if(!value)next[key]='Este campo es obligatorio.';
    setErrors(next);if(Object.keys(next).length)return;
    setBusy(true);
    try{await api(`/viajes/${viaje.id}`,token,{method:'PATCH',body:JSON.stringify(payload)});setOpen(false);onSaved();}
    catch(reason){setErrors({general:reason instanceof Error?reason.message:'No se pudo guardar.'});}
    finally{setBusy(false);}
  }
  if(!open)return <Button type="button" variant="outline" size="sm" onClick={()=>setOpen(true)}>Editar viaje</Button>;
  return <form aria-label="Editar viaje" noValidate onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-3">
    <FormField id="origen" name="origen" label="Origen" defaultValue={viaje.origen} error={errors.origen} required/>
    <FormField id="destino" name="destino" label="Destino" defaultValue={viaje.destino} error={errors.destino} required/>
    <FormField id="fechaSalida" name="fechaSalida" label="Fecha de salida" type="date" defaultValue={viaje.fechaSalida.slice(0,10)} error={errors.fechaSalida} required/>
    {errors.general&&<p role="alert" className="text-sm text-red-700 sm:col-span-3">{errors.general}</p>}
    <div className="flex gap-3 sm:col-span-3"><Button type="submit" disabled={busy}>{busy?'Guardando…':'Guardar cambios'}</Button><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Cancelar</Button></div>
  </form>;
}
