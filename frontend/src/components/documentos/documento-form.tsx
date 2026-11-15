'use client';
import {FormEvent,useState} from 'react';
import {useAuth} from '@/components/auth/auth-provider';
import FormField from '@/components/forms/form-field';
import {Button} from '@/components/ui/button';
import {api} from '@/lib/api';

export default function DocumentoForm({mascotaId,onSuccess}: {mascotaId:string;onSuccess:()=>void}) {
  const {token}=useAuth();
  const [vigencia,setVigencia]=useState('fecha');
  const [busy,setBusy]=useState(false);
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [message,setMessage]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setMessage('');
    const form=event.currentTarget,data=new FormData(form);
    const identificacion=String(data.get('identificacion')||'').trim();
    const fechaVencimiento=String(data.get('fechaVencimiento')||'');
    const next:Record<string,string>={};
    if(!identificacion)next.identificacion='Este campo es obligatorio.';
    if(vigencia==='fecha'&&!fechaVencimiento)next.fechaVencimiento='Indica la fecha de vencimiento.';
    setErrors(next);if(Object.keys(next).length)return;
    setBusy(true);
    try{
      await api(`/mascotas/${mascotaId}/documentos`,token,{method:'POST',body:JSON.stringify({identificacion,vigencia,...(vigencia==='fecha'?{fechaVencimiento}:{})})});
      form.reset();setVigencia('fecha');setMessage('Documento registrado. Vincúlalo a una tarea para evaluarlo.');onSuccess();
    }catch(error){setErrors({general:error instanceof Error?error.message:'No se pudo registrar el documento.'});}
    finally{setBusy(false);}
  }
  return <form aria-label="Registrar documento" noValidate onSubmit={submit} className="space-y-5">
    <FormField id="identificacion" name="identificacion" label="Identificación del documento" error={errors.identificacion} required/>
    <div className="space-y-2"><label htmlFor="vigencia" className="block text-sm font-medium text-gray-700">Vigencia</label><select id="vigencia" value={vigencia} onChange={event=>setVigencia(event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800"><option value="fecha">Con fecha de vencimiento</option><option value="sin_vencimiento">Sin vencimiento</option><option value="desconocida">Desconocida</option></select></div>
    {vigencia==='fecha'&&<FormField id="fechaVencimiento" name="fechaVencimiento" label="Fecha de vencimiento" type="date" error={errors.fechaVencimiento} required/>}
    {errors.general&&<p role="alert" className="text-sm text-red-700">{errors.general}</p>}
    {message&&<p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{message}</p>}
    <Button type="submit" disabled={busy}>{busy?'Guardando…':'Guardar documento'}</Button>
  </form>;
}
