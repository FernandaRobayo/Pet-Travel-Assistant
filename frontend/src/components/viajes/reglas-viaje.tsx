'use client';
import {FormEvent,useState} from 'react';
import FormField from '@/components/forms/form-field';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/components/auth/auth-provider';
import {LIMITE_MB,abrirEnPestana,subirArchivo,validarCliente} from '@/lib/files';
import {textoTamano,type ReglasViaje} from '@/lib/types';

// SWR-REG-001..005: PDF con las reglas del transportador. El software no lee su contenido (SWR-REG-006).
export default function ReglasViaje({viajeId,reglas,onChange}: {viajeId:string;reglas:ReglasViaje|null|undefined;onChange:()=>void}){
  const {token}=useAuth();
  const [busy,setBusy]=useState(false),[errors,setErrors]=useState<Record<string,string>>({}),[message,setMessage]=useState('');
  async function enviar(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setMessage('');
    const form=event.currentTarget,data=new FormData(form);
    const transportador=String(data.get('transportador')||'').trim();
    const archivo=(form.elements.namedItem('archivo') as HTMLInputElement).files?.[0];
    const next:Record<string,string>={};
    if(!transportador)next.transportador='Indica el nombre del transportador.';
    if(!archivo)next.archivo='Selecciona un archivo PDF.';
    else{const problema=validarCliente(archivo,['.pdf'],LIMITE_MB.documento);if(problema)next.archivo=problema;}
    setErrors(next);if(Object.keys(next).length||!archivo)return;
    setBusy(true);
    try{await subirArchivo(`/viajes/${viajeId}/reglas`,token,archivo,{transportador});form.reset();setMessage(reglas?'PDF de reglas reemplazado.':'PDF de reglas adjuntado.');onChange();}
    catch(reason){setErrors({general:reason instanceof Error?reason.message:'No se pudo adjuntar el PDF.'});}
    finally{setBusy(false);}
  }
  async function abrir(){
    try{await abrirEnPestana(`/viajes/${viajeId}/reglas`,token);}
    catch(reason){setErrors({general:reason instanceof Error?reason.message:'No se pudo abrir el PDF.'});}
  }
  return <div className="space-y-4">
    {reglas?<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3 text-sm"><span className="min-w-0 break-words text-gray-800"><strong>{reglas.transportador}</strong> · {reglas.nombre} ({textoTamano(reglas.tamano)})</span><Button type="button" variant="outline" size="sm" onClick={()=>void abrir()}>Abrir PDF de reglas</Button></div>
      :<p className="text-sm text-gray-600">Aún no adjuntas el PDF de reglas del transportador.</p>}
    <form aria-label={reglas?'Reemplazar PDF de reglas':'Adjuntar PDF de reglas'} noValidate onSubmit={enviar} className="space-y-4">
      <FormField id="transportador" name="transportador" label="Nombre del transportador" key={reglas?.transportador??'nuevo'} defaultValue={reglas?.transportador??''} maxLength={80} error={errors.transportador} required/>
      <div className="space-y-2"><label htmlFor="archivo-reglas" className="block text-sm font-medium text-gray-700">Archivo PDF de reglas (máx. {LIMITE_MB.documento} MB)</label>
        <input id="archivo-reglas" name="archivo" type="file" accept=".pdf,application/pdf" aria-invalid={Boolean(errors.archivo)} className="block w-full text-sm text-gray-700"/>
        {errors.archivo&&<p role="alert" className="text-sm text-red-700">{errors.archivo}</p>}</div>
      <Button type="submit" disabled={busy}>{busy?'Subiendo…':reglas?'Reemplazar PDF':'Adjuntar PDF'}</Button>
    </form>
    <p className="text-xs text-gray-600">El PDF es solo una referencia: la aplicación no lee su contenido ni genera tareas o avisos a partir de él.</p>
    {errors.general&&<p role="alert" className="text-sm text-red-700">{errors.general}</p>}
    {message&&<p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{message}</p>}
  </div>;
}
