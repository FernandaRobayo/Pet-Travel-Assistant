'use client';
import {FormEvent,useId,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {useAuth} from '@/components/auth/auth-provider';
import {api} from '@/lib/api';

// Incremento extra: edición en línea de un campo de texto (MAS-004, CHK-003).
export default function InlineEdit({label,initial,path,field,onSaved,onCancel}: {label:string;initial:string;path:string;field:string;onSaved:()=>void;onCancel:()=>void}){
  const {token}=useAuth();
  const id=useId();
  const [value,setValue]=useState(initial);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');
    const text=value.trim();
    if(!text){setError('Este campo es obligatorio.');return;}
    setBusy(true);
    try{await api(path,token,{method:'PATCH',body:JSON.stringify({[field]:text})});onSaved();}
    catch(reason){setError(reason instanceof Error?reason.message:'No se pudo guardar.');}
    finally{setBusy(false);}
  }
  return <form aria-label={label} noValidate onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
    <div className="flex-1 space-y-1"><label htmlFor={id} className="sr-only">{label}</label>
      <Input id={id} value={value} onChange={event=>setValue(event.target.value)} aria-invalid={Boolean(error)}/>
      {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}</div>
    <Button type="submit" size="sm" disabled={busy}>{busy?'Guardando…':'Guardar cambios'}</Button>
    <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
  </form>;
}
