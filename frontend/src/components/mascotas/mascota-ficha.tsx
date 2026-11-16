'use client';
import {DragEvent,FormEvent,ReactNode,useEffect,useRef,useState} from 'react';
import FormField from '@/components/forms/form-field';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/components/auth/auth-provider';
import {api} from '@/lib/api';
import {LIMITE_MB,obtenerArchivo,subirArchivo,validarCliente} from '@/lib/files';
import type {Mascota} from '@/lib/types';

const area='w-full resize-none rounded-[10px] border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20';
const CAMPOS=['especie','raza','edad','peso','veterinarioNombre','veterinarioTelefono','contactoEmergencia','medicacion','notas'] as const;
const TOTAL=CAMPOS.length+1; // + foto

function contarMascota(m:Mascota){return CAMPOS.filter(c=>{const v=(m as unknown as Record<string,unknown>)[c];return v!==null&&v!==undefined&&String(v).trim()!=='';}).length+(m.tieneFoto?1:0);}
function Icono({d}:{d:string}){return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;}
function Seccion({icono,titulo,ayuda,children}:{icono:string;titulo:string;ayuda:string;children:ReactNode}){
  return <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs sm:p-5 sm:col-span-2">
    <div className="mb-4 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icono d={icono}/></span>
      <div><h3 className="text-sm font-semibold text-gray-800">{titulo}</h3><p className="text-xs text-gray-500">{ayuda}</p></div></div>
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  </section>;
}
function Chip({children}:{children:ReactNode}){return <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">{children}</span>;}

// SWR-MAS-005..010: datos opcionales de la mascota. El software no deduce requisitos de viaje a partir de ellos (SWR-MAS-011).
export default function MascotaFicha({mascota,onSaved}: {mascota:Mascota;onSaved:()=>void}){
  const {token}=useAuth();
  const formRef=useRef<HTMLFormElement>(null);
  const [busy,setBusy]=useState(false),[errors,setErrors]=useState<Record<string,string>>({}),[message,setMessage]=useState('');
  const [foto,setFoto]=useState(''),[fotoError,setFotoError]=useState(''),[subiendo,setSubiendo]=useState(false),[arrastrando,setArrastrando]=useState(false);
  const [llenos,setLlenos]=useState(()=>contarMascota(mascota)),[cambios,setCambios]=useState(false);
  const [largo,setLargo]=useState({medicacion:(mascota.medicacion??'').length,notas:(mascota.notas??'').length});
  useEffect(()=>{
    if(!mascota.tieneFoto){setFoto('');return;}
    let url='',activo=true;
    obtenerArchivo(`/mascotas/${mascota.id}/foto`,token).then(blob=>{if(activo){url=URL.createObjectURL(blob);setFoto(url);}}).catch(()=>{if(activo)setFoto('');});
    return ()=>{activo=false;if(url)URL.revokeObjectURL(url);};
  },[mascota.id,mascota.tieneFoto,token]);

  function alCambiar(){
    const form=formRef.current;if(!form)return;
    const data=new FormData(form);
    const n=CAMPOS.filter(c=>String(data.get(c)||'').trim()!=='').length+(mascota.tieneFoto||foto?1:0);
    setLlenos(n);setCambios(true);setMessage('');
    setLargo({medicacion:String(data.get('medicacion')||'').length,notas:String(data.get('notas')||'').length});
  }
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
      setMessage('Ficha actualizada.');setCambios(false);onSaved();
    }catch(reason){setErrors({general:reason instanceof Error?reason.message:'No se pudo guardar la ficha.'});}
    finally{setBusy(false);}
  }
  async function subir(archivo:File|undefined){
    if(!archivo)return;setFotoError('');
    const problema=validarCliente(archivo,['.jpg','.jpeg','.png'],LIMITE_MB.foto);
    if(problema){setFotoError(problema);return;}
    setSubiendo(true);
    try{await subirArchivo(`/mascotas/${mascota.id}/foto`,token,archivo);setMessage('Foto actualizada.');onSaved();}
    catch(reason){setFotoError(reason instanceof Error?reason.message:'No se pudo subir la foto.');}
    finally{setSubiendo(false);}
  }
  function soltar(event:DragEvent<HTMLElement>){event.preventDefault();setArrastrando(false);void subir(event.dataTransfer.files?.[0]);}

  const porcentaje=Math.round((llenos/TOTAL)*100);
  const inicial=(mascota.nombre||'?').trim().charAt(0).toUpperCase();
  const datos=[mascota.especie,mascota.raza].filter(Boolean).join(' · ');
  return <div className="space-y-4 rounded-2xl bg-gray-50 p-3 sm:p-5">
    <header className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-50 via-white to-white">
      <div className="flex flex-col items-center gap-5 p-5 text-center sm:flex-row sm:items-center sm:text-left">
        <div onDragOver={e=>{e.preventDefault();setArrastrando(true);}} onDragLeave={()=>setArrastrando(false)} onDrop={soltar}
          className={`group relative h-28 w-28 shrink-0 overflow-hidden rounded-full ring-4 transition ${arrastrando?'ring-brand-500':'ring-white'} shadow-theme-md`}>
          {foto
            // eslint-disable-next-line @next/next/no-img-element
            ?<img src={foto} alt={`Foto de ${mascota.nombre}`} className="h-full w-full object-cover"/>
            :<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-4xl font-semibold text-white" aria-hidden="true">{inicial}</div>}
          <label htmlFor={`foto-${mascota.id}`} className="absolute inset-x-0 bottom-0 flex cursor-pointer items-center justify-center gap-1 bg-black/55 py-1.5 text-xs font-medium text-white opacity-90 transition group-hover:bg-black/70">
            <Icono d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 100-8 4 4 0 000 8z"/>{subiendo?'Subiendo…':foto?'Cambiar':'Subir foto'}
          </label>
          <input id={`foto-${mascota.id}`} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" aria-label={`Subir foto de ${mascota.nombre}`} disabled={subiendo}
            onChange={event=>{void subir(event.target.files?.[0]);event.target.value='';}} className="sr-only"/>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div><p className="truncate text-xl font-semibold text-gray-800">{mascota.nombre}</p>
            <p className="text-sm text-gray-500">{datos||'Completa los datos para tener todo a mano al viajar'}</p></div>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            {mascota.edad!==null&&mascota.edad!==undefined&&<Chip>{mascota.edad} {mascota.edad===1?'año':'años'}</Chip>}
            {mascota.peso!==null&&mascota.peso!==undefined&&<Chip>{mascota.peso} kg</Chip>}
            {mascota.veterinarioNombre&&<Chip>Vet: {mascota.veterinarioNombre}</Chip>}
          </div>
          <div aria-label={`Ficha completa al ${porcentaje}%`}>
            <div className="mb-1 flex items-center justify-between text-xs text-gray-600"><span>Ficha completa</span><span className="font-medium">{llenos} de {TOTAL} datos</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{width:`${porcentaje}%`}}/></div>
          </div>
        </div>
      </div>
      <p className="border-t border-gray-100 bg-white/60 px-5 py-2 text-center text-xs text-gray-500 sm:text-left">JPG o PNG, máx. {LIMITE_MB.foto} MB. También puedes arrastrar la foto sobre el círculo.</p>
      {fotoError&&<p role="alert" className="bg-red-50 px-5 py-2 text-sm text-red-700">{fotoError}</p>}
    </header>

    <form ref={formRef} aria-label={`Ficha de ${mascota.nombre}`} noValidate onSubmit={guardar} onChange={alCambiar} className="grid gap-4">
      <Seccion icono="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z" titulo="Datos generales" ayuda="Todos los campos son opcionales.">
        <FormField id={`especie-${mascota.id}`} name="especie" label="Especie" placeholder="Perro, gato…" defaultValue={mascota.especie??''} maxLength={60}/>
        <FormField id={`raza-${mascota.id}`} name="raza" label="Raza" defaultValue={mascota.raza??''} maxLength={60}/>
        <FormField id={`edad-${mascota.id}`} name="edad" label="Edad (años)" inputMode="numeric" placeholder="Ej. 4" defaultValue={mascota.edad??''} error={errors.edad}/>
        <FormField id={`peso-${mascota.id}`} name="peso" label="Peso (kg)" inputMode="decimal" placeholder="Ej. 8.5" defaultValue={mascota.peso??''} error={errors.peso}/>
      </Seccion>
      <Seccion icono="M12 5v14M5 12h14" titulo="Salud y cuidados" ayuda="Medicación e indicaciones para el trayecto.">
        <div className="space-y-2 sm:col-span-2"><label htmlFor={`med-${mascota.id}`} className="block text-sm font-medium text-gray-700">Medicación y cuidados durante el viaje</label>
          <textarea id={`med-${mascota.id}`} name="medicacion" rows={3} maxLength={1000} defaultValue={mascota.medicacion??''} className={area}/>
          <p className="text-right text-xs text-gray-400">{largo.medicacion}/1000</p></div>
      </Seccion>
      <Seccion icono="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" titulo="Veterinario y emergencia" ayuda="Para contactar rápido si algo pasa en el camino.">
        <FormField id={`vet-${mascota.id}`} name="veterinarioNombre" label="Veterinario" defaultValue={mascota.veterinarioNombre??''} maxLength={120}/>
        <FormField id={`vettel-${mascota.id}`} name="veterinarioTelefono" label="Teléfono del veterinario" type="tel" defaultValue={mascota.veterinarioTelefono??''} maxLength={30}/>
        <div className="sm:col-span-2"><FormField id={`emerg-${mascota.id}`} name="contactoEmergencia" label="Contacto de emergencia (nombre y teléfono)" defaultValue={mascota.contactoEmergencia??''} maxLength={200}/></div>
      </Seccion>
      <Seccion icono="M5 4h14v16H5zM9 9h6M9 13h6" titulo="Notas" ayuda="Cualquier detalle que quieras recordar.">
        <div className="space-y-2 sm:col-span-2"><label htmlFor={`notas-${mascota.id}`} className="block text-sm font-medium text-gray-700">Notas</label>
          <textarea id={`notas-${mascota.id}`} name="notas" rows={3} maxLength={1000} defaultValue={mascota.notas??''} className={area}/>
          <p className="text-right text-xs text-gray-400">{largo.notas}/1000</p></div>
      </Seccion>
      {errors.general&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.general}</p>}
      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-theme-md backdrop-blur">
        <div className="min-h-5 text-sm">
          {message?<p role="status" className="font-medium text-brand-700">✓ {message}</p>:cambios?<p className="text-amber-700">Tienes cambios sin guardar.</p>:<p className="text-gray-500">Sin cambios pendientes.</p>}
        </div>
        <Button type="submit" disabled={busy}>{busy?'Guardando…':'Guardar ficha'}</Button>
      </div>
    </form>
  </div>;
}
