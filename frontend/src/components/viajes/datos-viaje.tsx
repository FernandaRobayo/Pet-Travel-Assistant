'use client';
import {FormEvent,useState} from 'react';
import FormField from '@/components/forms/form-field';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/components/auth/auth-provider';
import {api} from '@/lib/api';
import {etapas,transportes,type EtapaViaje,type Transporte,type Viaje} from '@/lib/types';

const select='h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800';

// SWR-VIA-007, 008, 009, 011, 012, 013: transporte, vuelo, hora, alojamiento, etapa y archivado.
export default function DatosViaje({viaje,onSaved}: {viaje:Viaje;onSaved:()=>void}){
  const {token}=useAuth();
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const etapa=viaje.etapa??'planificado';
  const filas:[string,string|null|undefined][]=[
    ['Etapa',etapas[etapa]],['Transporte',viaje.transporte?transportes[viaje.transporte]:null],['Aerolínea',viaje.aerolinea],['Número de vuelo',viaje.numeroVuelo],
    ['Hora de salida',viaje.horaSalida],['Aeropuerto',viaje.aeropuerto],['Alojamiento',viaje.alojamientoNombre],['Dirección',viaje.alojamientoDireccion],['Confirmación',viaje.alojamientoConfirmacion]];
  async function guardar(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');setMessage('');
    const data=new FormData(event.currentTarget);
    const texto=(name:string)=>String(data.get(name)||'').trim();
    setBusy(true);
    try{
      await api(`/viajes/${viaje.id}`,token,{method:'PATCH',body:JSON.stringify({
        origen:viaje.origen,destino:viaje.destino,fechaSalida:viaje.fechaSalida.slice(0,10),
        transporte:texto('transporte'),aerolinea:texto('aerolinea'),numeroVuelo:texto('numeroVuelo'),horaSalida:texto('horaSalida'),aeropuerto:texto('aeropuerto'),
        alojamientoNombre:texto('alojamientoNombre'),alojamientoDireccion:texto('alojamientoDireccion'),alojamientoConfirmacion:texto('alojamientoConfirmacion'),etapa:texto('etapa')})});
      setOpen(false);setMessage('Datos del viaje actualizados.');onSaved();
    }catch(reason){setError(reason instanceof Error?reason.message:'No se pudieron guardar los datos.');}
    finally{setBusy(false);}
  }
  async function archivar(archivado:boolean){
    setError('');setMessage('');setBusy(true);
    try{await api(`/viajes/${viaje.id}/archivo`,token,{method:'PATCH',body:JSON.stringify({archivado})});setMessage(archivado?'Viaje archivado.':'Viaje restaurado.');onSaved();}
    catch(reason){setError(reason instanceof Error?reason.message:'No se pudo cambiar el archivo del viaje.');}
    finally{setBusy(false);}
  }
  return <div className="space-y-4">
    {viaje.archivado&&<p className="rounded-lg bg-gray-100 p-3 text-sm text-gray-700">Este viaje está archivado.</p>}
    <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">{filas.filter(([,valor])=>valor).map(([nombre,valor])=><div key={nombre} className="min-w-0"><dt className="text-gray-600">{nombre}</dt><dd className="break-words font-medium text-gray-800">{valor}</dd></div>)}</dl>
    {!open&&<div className="flex flex-wrap gap-3">
      <Button type="button" variant="outline" size="sm" onClick={()=>setOpen(true)}>Editar datos del transporte y alojamiento</Button>
      {viaje.archivado
        ?<Button type="button" variant="outline" size="sm" disabled={busy} onClick={()=>void archivar(false)}>Quitar de archivados</Button>
        :<Button type="button" variant="outline" size="sm" disabled={busy||etapa!=='finalizado'} onClick={()=>void archivar(true)}>Archivar viaje</Button>}
    </div>}
    {!open&&!viaje.archivado&&etapa!=='finalizado'&&<p className="text-xs text-gray-600">Solo se puede archivar un viaje en etapa «Finalizado».</p>}
    {open&&<form aria-label="Datos del transporte y alojamiento" noValidate onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><label htmlFor="etapa" className="block text-sm font-medium text-gray-700">Etapa del viaje</label><select id="etapa" name="etapa" defaultValue={etapa} className={select}>{(Object.keys(etapas) as EtapaViaje[]).map(key=><option key={key} value={key}>{etapas[key]}</option>)}</select></div>
      <div className="space-y-2"><label htmlFor="transporte" className="block text-sm font-medium text-gray-700">Tipo de transporte</label><select id="transporte" name="transporte" defaultValue={viaje.transporte??''} className={select}><option value="">Sin indicar</option>{(Object.keys(transportes) as Transporte[]).map(key=><option key={key} value={key}>{transportes[key]}</option>)}</select></div>
      <FormField id="aerolinea" name="aerolinea" label="Aerolínea" defaultValue={viaje.aerolinea??''} maxLength={80}/>
      <FormField id="numeroVuelo" name="numeroVuelo" label="Número de vuelo" defaultValue={viaje.numeroVuelo??''} maxLength={20}/>
      <FormField id="horaSalida" name="horaSalida" label="Hora de salida" type="time" defaultValue={viaje.horaSalida??''}/>
      <FormField id="aeropuerto" name="aeropuerto" label="Aeropuerto" defaultValue={viaje.aeropuerto??''} maxLength={120}/>
      <FormField id="alojamientoNombre" name="alojamientoNombre" label="Alojamiento que acepta mascotas" defaultValue={viaje.alojamientoNombre??''} maxLength={120}/>
      <FormField id="alojamientoConfirmacion" name="alojamientoConfirmacion" label="Confirmación de la reserva" defaultValue={viaje.alojamientoConfirmacion??''} maxLength={60}/>
      <div className="sm:col-span-2"><FormField id="alojamientoDireccion" name="alojamientoDireccion" label="Dirección del alojamiento" defaultValue={viaje.alojamientoDireccion??''} maxLength={200}/></div>
      <div className="flex gap-3 sm:col-span-2"><Button type="submit" disabled={busy}>{busy?'Guardando…':'Guardar datos'}</Button><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Cancelar</Button></div>
    </form>}
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {message&&<p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{message}</p>}
  </div>;
}
