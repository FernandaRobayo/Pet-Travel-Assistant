'use client';

import {FormEvent, useState} from 'react';
import {Button} from '@/components/ui/button';
import FormField from './form-field';
import {useAuth} from '@/components/auth/auth-provider';
import {api} from '@/lib/api';

interface Field {name: string; label: string; type?: string; options?: {value: string; label: string}[]}
interface Props {
  name: string;
  path: string;
  fields: Field[];
  button: string;
  success: string;
  onSuccess: ()=>void;
  disabled?: boolean;
}

export default function RecordForm({name,path,fields,button,success,onSuccess,disabled}: Props) {
  const {token}=useAuth();
  const [busy,setBusy]=useState(false);
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [message,setMessage]=useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('');
    const form=event.currentTarget;
    const data=new FormData(form);
    const payload: Record<string,string>={};
    const next: Record<string,string>={};
    for(const field of fields){
      const value=String(data.get(field.name)||'').trim(); payload[field.name]=value;
      if(!value)next[field.name]='Este campo es obligatorio.';
    }
    setErrors(next);
    if(Object.keys(next).length)return;
    setBusy(true);
    try{
      await api(path,token,{method:'POST',body:JSON.stringify(payload)});
      form.reset(); setMessage(success); onSuccess();
    }catch(reason){setErrors({general:reason instanceof Error?reason.message:'No se pudo guardar.'});}
    finally{setBusy(false);}
  }
  return <form onSubmit={submit} noValidate aria-label={name} className="space-y-5">
    {fields.map(field=>field.options?<div className="space-y-2" key={field.name}>
      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">{field.label}</label>
      <select id={field.name} name={field.name} required aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name]?`${field.name}-error`:undefined} className="h-11 w-full rounded-[10px] border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200">
        <option value="">Selecciona una opción</option>{field.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
      </select>{errors[field.name]&&<p id={`${field.name}-error`} className="text-sm text-red-700">{errors[field.name]}</p>}
    </div>:<FormField key={field.name} id={field.name} name={field.name} label={field.label} type={field.type||'text'} error={errors[field.name]} required/>)}
    {errors.general&&<p role="alert" className="text-sm text-red-700">{errors.general}</p>}
    {message&&<p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{message}</p>}
    <Button type="submit" disabled={busy||disabled}>{busy?'Guardando…':button}</Button>
  </form>;
}
