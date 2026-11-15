'use client';

import {useState} from 'react';
import {useAuth} from '@/components/auth/auth-provider';
import {api} from '@/lib/api';
import {estados,EstadoTarea,Tarea} from '@/lib/types';

export default function TaskList({tareas,onChange}: {tareas:Tarea[];onChange:()=>void}){
  const {token}=useAuth();
  const [busy,setBusy]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  async function change(id:string,estado:EstadoTarea){
    setBusy(id);setError('');setMessage('');
    try{await api(`/tareas/${id}/estado`,token,{method:'PATCH',body:JSON.stringify({estado})});setMessage('Estado actualizado.');onChange();}
    catch(reason){setError(reason instanceof Error?reason.message:'No se pudo actualizar.');}
    finally{setBusy(null);}
  }
  if(!tareas.length)return <p className="py-6 text-sm text-gray-600">Sin elementos. Agrega la primera tarea.</p>;
  return <div className="space-y-4">
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{message&&<p role="status" className="text-sm text-brand-700">{message}</p>}
    <ul className="divide-y divide-gray-100">{tareas.map(task=><li key={task.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"><span className="text-sm font-medium text-gray-800">{task.descripcion}</span><div><label className="sr-only" htmlFor={`estado-${task.id}`}>Estado de tarea {task.descripcion}</label><select id={`estado-${task.id}`} value={task.estado} disabled={busy!==null} onChange={event=>void change(task.id,event.target.value as EstadoTarea)} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 sm:w-48">{Object.entries(estados).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div></li>)}</ul>
  </div>;
}
