'use client';
import {ReactNode,useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/components/auth/auth-provider';
import {obtenerArchivo} from '@/lib/files';
import type {Mascota} from '@/lib/types';
import MascotaFicha from './mascota-ficha';

function Dato({etiqueta,children,ancho=false}:{etiqueta:string;children:ReactNode;ancho?:boolean}){
  return <div className={ancho?'sm:col-span-2':''}><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{etiqueta}</dt>
    <dd className="mt-1 whitespace-pre-line text-sm text-gray-800">{children}</dd></div>;
}
const vacio=<span className="text-gray-400">No registrado</span>;
const texto=(v:unknown)=>{const s=v===null||v===undefined?'':String(v).trim();return s?s:null;};

// Vista de solo lectura de la ficha. «Editar ficha» abre el formulario (MascotaFicha) y al guardar vuelve aquí.
export default function MascotaFichaVista({mascota,onSaved,onClose}:{mascota:Mascota;onSaved:()=>void;onClose:()=>void}){
  const {token}=useAuth();
  const [editando,setEditando]=useState(false),[foto,setFoto]=useState('');
  useEffect(()=>{
    if(!mascota.tieneFoto){setFoto('');return;}
    let url='',activo=true;
    obtenerArchivo(`/mascotas/${mascota.id}/foto`,token).then(blob=>{if(activo){url=URL.createObjectURL(blob);setFoto(url);}}).catch(()=>{if(activo)setFoto('');});
    return ()=>{activo=false;if(url)URL.revokeObjectURL(url);};
  },[mascota.id,mascota.tieneFoto,token]);

  if(editando)return <div className="space-y-3">
    <Button type="button" variant="outline" size="xs" onClick={()=>setEditando(false)}>← Volver a la ficha</Button>
    <MascotaFicha mascota={mascota} onSaved={()=>{onSaved();setEditando(false);}}/>
  </div>;

  const inicial=(mascota.nombre||'?').trim().charAt(0).toUpperCase();
  const subtitulo=[texto(mascota.especie),texto(mascota.raza)].filter(Boolean).join(' · ');
  const edad=mascota.edad,peso=mascota.peso;
  const tel=texto(mascota.veterinarioTelefono);
  return <article aria-label={`Ficha de ${mascota.nombre}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm">
    <header className="flex flex-col items-center gap-5 bg-gradient-to-br from-brand-50 via-white to-white p-6 text-center sm:flex-row sm:text-left">
      {foto
        // eslint-disable-next-line @next/next/no-img-element
        ?<img src={foto} alt={`Foto de ${mascota.nombre}`} className="h-28 w-28 shrink-0 rounded-full object-cover shadow-theme-md ring-4 ring-white"/>
        :<div aria-hidden="true" className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-4xl font-semibold text-white shadow-theme-md ring-4 ring-white">{inicial}</div>}
      <div className="min-w-0 flex-1 space-y-3">
        <div><h2 className="truncate text-2xl font-semibold text-gray-800">{mascota.nombre}</h2>
          <p className="text-sm text-gray-500">{subtitulo||'Sin especie ni raza registradas'}</p></div>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          {edad!==null&&edad!==undefined&&<span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">{edad} {edad===1?'año':'años'}</span>}
          {peso!==null&&peso!==undefined&&<span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">{peso} kg</span>}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="xs" onClick={()=>setEditando(true)}>Editar ficha</Button>
        <Button type="button" variant="outline" size="xs" onClick={onClose}>Cerrar</Button>
      </div>
    </header>
    <div className="grid gap-px bg-gray-100 sm:grid-cols-2">
      <section className="space-y-4 bg-white p-5"><h3 className="text-sm font-semibold text-gray-800">Datos generales</h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Dato etiqueta="Especie">{texto(mascota.especie)??vacio}</Dato>
          <Dato etiqueta="Raza">{texto(mascota.raza)??vacio}</Dato>
          <Dato etiqueta="Edad">{edad!==null&&edad!==undefined?`${edad} ${edad===1?'año':'años'}`:vacio}</Dato>
          <Dato etiqueta="Peso">{peso!==null&&peso!==undefined?`${peso} kg`:vacio}</Dato>
        </dl></section>
      <section className="space-y-4 bg-white p-5"><h3 className="text-sm font-semibold text-gray-800">Veterinario y emergencia</h3>
        <dl className="grid gap-4">
          <Dato etiqueta="Veterinario">{texto(mascota.veterinarioNombre)??vacio}</Dato>
          <Dato etiqueta="Teléfono del veterinario">{tel?<a href={`tel:${tel}`} className="font-medium text-brand-700 underline">{tel}</a>:vacio}</Dato>
          <Dato etiqueta="Contacto de emergencia">{texto(mascota.contactoEmergencia)??vacio}</Dato>
        </dl></section>
      <section className="space-y-4 bg-white p-5 sm:col-span-2"><h3 className="text-sm font-semibold text-gray-800">Salud y notas</h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Dato etiqueta="Medicación y cuidados durante el viaje">{texto(mascota.medicacion)??vacio}</Dato>
          <Dato etiqueta="Notas">{texto(mascota.notas)??vacio}</Dato>
        </dl></section>
    </div>
  </article>;
}
