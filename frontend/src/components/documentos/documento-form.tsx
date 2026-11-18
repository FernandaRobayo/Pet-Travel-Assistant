'use client';
import {FormEvent,useState} from 'react';
import {useAuth} from '@/components/auth/auth-provider';
import FormField from '@/components/forms/form-field';
import {Button} from '@/components/ui/button';
import {api} from '@/lib/api';
import {LIMITE_MB,subirArchivo,validarCliente} from '@/lib/files';
import type {Documento} from '@/lib/types';

// Con `documento` funciona en modo edición (incremento extra, SWR-DOC-004).
export default function DocumentoForm({mascotaId,onSuccess,documento,onCancel}: {mascotaId:string;onSuccess:()=>void;documento?:Documento;onCancel?:()=>void}) {
  const {token}=useAuth();
  const [vigencia,setVigencia]=useState<string>(documento?.vigencia??'fecha');
  const [busy,setBusy]=useState(false);
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [message,setMessage]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setMessage('');
    const form=event.currentTarget,data=new FormData(form);
    const identificacion=String(data.get('identificacion')||'').trim();
    const fechaVencimiento=String(data.get('fechaVencimiento')||'');
    const archivo=!documento?data.get('archivo'):null;
    const adjunto=archivo instanceof File&&archivo.size>0?archivo:null;
    const next:Record<string,string>={};
    if(adjunto){const problema=validarCliente(adjunto,['.pdf','.jpg','.jpeg','.png'],LIMITE_MB.documento);if(problema)next.archivo=problema;}
    if(!identificacion)next.identificacion='Este campo es obligatorio.';
    if(vigencia==='fecha'&&!fechaVencimiento)next.fechaVencimiento='Indica la fecha de vencimiento.';
    setErrors(next);if(Object.keys(next).length)return;
    setBusy(true);
    try{
      const body=JSON.stringify({identificacion,vigencia,...(vigencia==='fecha'?{fechaVencimiento}:{})});
      if(documento){await api(`/documentos/${documento.id}`,token,{method:'PATCH',body});setMessage('Documento actualizado.');onSuccess();}
      else{
        const creado=await api<{id:string}>(`/mascotas/${mascotaId}/documentos`,token,{method:'POST',body});
        form.reset();setVigencia('fecha');onSuccess();
        if(adjunto){
          try{await subirArchivo(`/documentos/${creado.id}/archivos`,token,adjunto);setMessage('Documento registrado con su archivo. Vincúlalo a una tarea para evaluarlo.');}
          catch(reason){setMessage(`Documento registrado, pero no se pudo adjuntar el archivo (${reason instanceof Error?reason.message:'error desconocido'}). Puedes adjuntarlo desde «Archivos».`);}
        }else setMessage('Documento registrado. Vincúlalo a una tarea para evaluarlo.');
      }
    }catch(error){setErrors({general:error instanceof Error?error.message:'No se pudo registrar el documento.'});}
    finally{setBusy(false);}
  }
  return <form aria-label={documento?"Editar documento":"Registrar documento"} noValidate onSubmit={submit} className="space-y-5">
    <FormField id="identificacion" name="identificacion" label="Identificación del documento" defaultValue={documento?.identificacion} error={errors.identificacion} required/>
    <div className="space-y-2"><label htmlFor="vigencia" className="block text-sm font-medium text-gray-700">Vigencia</label><select id="vigencia" value={vigencia} onChange={event=>setVigencia(event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800"><option value="fecha">Con fecha de vencimiento</option><option value="sin_vencimiento">Sin vencimiento</option><option value="desconocida">Desconocida</option></select></div>
    {vigencia==='fecha'&&<FormField id="fechaVencimiento" name="fechaVencimiento" label="Fecha de vencimiento" type="date" defaultValue={documento?.fechaVencimiento?.slice(0,10)} error={errors.fechaVencimiento} required/>}
    {!documento&&<div className="space-y-2"><label htmlFor="archivo-documento" className="block text-sm font-medium text-gray-700">Archivo adjunto (opcional)</label>
      <input id="archivo-documento" name="archivo" type="file" accept=".pdf,.jpg,.jpeg,.png" aria-invalid={Boolean(errors.archivo)} className="block w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"/>
      <p className="text-xs text-gray-500">PDF, JPG o PNG, máx. {LIMITE_MB.documento} MB. Solo es evidencia: la aplicación no lee su contenido.</p>
      {errors.archivo&&<p role="alert" className="text-sm text-red-700">{errors.archivo}</p>}</div>}
    {errors.general&&<p role="alert" className="text-sm text-red-700">{errors.general}</p>}
    {message&&<p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{message}</p>}
    <div className="flex gap-3"><Button type="submit" disabled={busy}>{busy?'Guardando…':documento?'Guardar cambios':'Guardar documento'}</Button>{documento&&<Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}</div>
  </form>;
}
