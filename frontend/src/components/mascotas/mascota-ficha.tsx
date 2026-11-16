'use client';
import {FormEvent,useEffect,useState} from 'react';
import FormField from '@/components/forms/form-field';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/components/auth/auth-provider';
import {api} from '@/lib/api';
import {LIMITE_MB,obtenerArchivo,subirArchivo,validarCliente} from '@/lib/files';
import type {Mascota} from '@/lib/types';

const area='w-full rounded-[10px] border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20';

// SWR-MAS-005..010: datos opcionales de la mascota. El software no deduce requisitos de viaje a partir de ellos (SWR-MAS-011).
export default function MascotaFicha({mascota,onSaved}: {mascota:Mascota;onSaved:()=>void}){
  const {token}=useAuth();
  const [busy,setBusy]=useState(false),[errors,setErrors]=useState<Record<string,string>>({}),[message,setMessage]=useState('');
  const [foto,setFoto]=useState(''),[fotoError,setFotoError]=useState('');
  useEffect(()=>{
    if(!mascota.tieneFoto){setFoto('');return;}
    let url='',activo=true;
    obtenerArchivo(`/mascotas/${mascota.id}/foto`,token).then(blob=>{if(activo){url=URL.createObjectURL(blob);setFoto(url);}}).catch(()=>{if(activo)setFoto('');});
    return ()=>{activo=false;if(url)URL.revokeObjectURL(url);};
  },[mascota.id,mascota.tieneFoto,token]);

  async function guardar(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setMessage('');
    const data=new FormData(event.currentTarget);
    const texto=(name:string)=>String(data.get(name)||'').trim();
    const edad=texto('edad'),peso=texto('peso');
    const next:Record<string,string>={};
    if(edad&&(!/^\d+$/.test(edad)||Number(edad)>60))next.edad='Ingresa una edad entera entre 0 y 60.';
    if(peso&&(!(Number(peso)>=0)||Number(peso)>500))next.peso='Ingresa un peso entre 0 y 500 kg.';
    setErrors(next);if(Object.keys(next).length)return;
    setBusy(true);
    try{
      await api(`/mascotas/${mascota.id}`,token,{method:'PATCH',body:JSON.stringify({
        especie:texto('especie'),raza:texto('raza'),edad:edad?Number(edad):null,peso:peso?Number(peso):null,notas:texto('notas'),
        veterinarioNombre:texto('veterinarioNombre'),veterinarioTelefono:texto('veterinarioTelefono'),contactoEmergencia:texto('contactoEmergencia'),medicacion:texto('medicacion')})});
      setMessage('Ficha actualizada.');onSaved();
    }catch(reason){setErrors({general:reason instanceof Error?reason.message:'No se pudo guardar la ficha.'});}
    finally{setBusy(false);}
  }
  async function subir(archivo:File|undefined){
    if(!archivo)return;setFotoError('');
    const problema=validarCliente(archivo,['.jpg','.jpeg','.png'],LIMITE_MB.foto);
    if(problema){setFotoError(problema);return;}
    try{await subirArchivo(`/mascotas/${mascota.id}/foto`,token,archivo);setMessage('Foto actualizada.');onSaved();}
    catch(reason){setFotoError(reason instanceof Error?reason.message:'No se pudo subir la foto.');}
  }
  return <div className="space-y-5 rounded-xl bg-gray-50 p-4">
    <div className="flex flex-wrap items-center gap-4">
      {foto
        // eslint-disable-next-line @next/next/no-img-element
        ?<img src={foto} alt={`Foto de ${mascota.nombre}`} className="h-24 w-24 rounded-xl object-cover"/>
        :<div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-gray-300 text-xs text-gray-500">Sin foto</div>}
      <div className="space-y-2"><label htmlFor={`foto-${mascota.id}`} className="block text-sm font-medium text-gray-700">Foto (JPG o PNG, máx. {LIMITE_MB.foto} MB)</label>
        <input id={`foto-${mascota.id}`} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" aria-label={`Subir foto de ${mascota.nombre}`} onChange={event=>{void subir(event.target.files?.[0]);event.target.value='';}} className="block w-full text-sm text-gray-700"/>
        {fotoError&&<p role="alert" className="text-sm text-red-700">{fotoError}</p>}</div>
    </div>
    <form aria-label={`Ficha de ${mascota.nombre}`} noValidate onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
      <FormField id={`especie-${mascota.id}`} name="especie" label="Especie" defaultValue={mascota.especie??''} maxLength={60}/>
      <FormField id={`raza-${mascota.id}`} name="raza" label="Raza" defaultValue={mascota.raza??''} maxLength={60}/>
      <FormField id={`edad-${mascota.id}`} name="edad" label="Edad (años)" inputMode="numeric" defaultValue={mascota.edad??''} error={errors.edad}/>
      <FormField id={`peso-${mascota.id}`} name="peso" label="Peso (kg)" inputMode="decimal" defaultValue={mascota.peso??''} error={errors.peso}/>
      <FormField id={`vet-${mascota.id}`} name="veterinarioNombre" label="Veterinario" defaultValue={mascota.veterinarioNombre??''} maxLength={120}/>
      <FormField id={`vettel-${mascota.id}`} name="veterinarioTelefono" label="Teléfono del veterinario" type="tel" defaultValue={mascota.veterinarioTelefono??''} maxLength={30}/>
      <div className="sm:col-span-2"><FormField id={`emerg-${mascota.id}`} name="contactoEmergencia" label="Contacto de emergencia (nombre y teléfono)" defaultValue={mascota.contactoEmergencia??''} maxLength={200}/></div>
      <div className="space-y-2 sm:col-span-2"><label htmlFor={`med-${mascota.id}`} className="block text-sm font-medium text-gray-700">Medicación y cuidados durante el viaje</label><textarea id={`med-${mascota.id}`} name="medicacion" rows={3} maxLength={1000} defaultValue={mascota.medicacion??''} className={area}/></div>
      <div className="space-y-2 sm:col-span-2"><label htmlFor={`notas-${mascota.id}`} className="block text-sm font-medium text-gray-700">Notas</label><textarea id={`notas-${mascota.id}`} name="notas" rows={3} maxLength={1000} defaultValue={mascota.notas??''} className={area}/></div>
      {errors.general&&<p role="alert" className="text-sm text-red-700 sm:col-span-2">{errors.general}</p>}
      {message&&<p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700 sm:col-span-2">{message}</p>}
      <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy?'Guardando…':'Guardar ficha'}</Button></div>
    </form>
  </div>;
}
