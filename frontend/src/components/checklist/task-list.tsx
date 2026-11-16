'use client';

import {FormEvent,useState} from 'react';
import {useAuth} from '@/components/auth/auth-provider';
import InlineEdit from '@/components/forms/inline-edit';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {api} from '@/lib/api';
import {estados,EstadoTarea,Tarea,textoVigencia} from '@/lib/types';

const area='w-full rounded-[10px] border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20';

export default function TaskList({tareas,onChange}: {tareas:Tarea[];onChange:()=>void}){
  const {token}=useAuth();
  const [busy,setBusy]=useState<string|null>(null);
  const [editing,setEditing]=useState<string|null>(null);
  const [detalle,setDetalle]=useState<string|null>(null);
  const [arrastrada,setArrastrada]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  async function run(key:string,action:()=>Promise<unknown>,success:string,failure:string){
    setBusy(key);setError('');setMessage('');
    try{await action();setMessage(success);onChange();}
    catch(reason){setError(reason instanceof Error?reason.message:failure);}
    finally{setBusy(null);}
  }
  const change=(id:string,estado:EstadoTarea)=>run(id,()=>api(`/tareas/${id}/estado`,token,{method:'PATCH',body:JSON.stringify({estado})}),'Estado actualizado.','No se pudo actualizar.');
  const unlink=(tareaId:string,documentoId:string)=>run(documentoId,()=>api(`/tareas/${tareaId}/documentos/${documentoId}`,token,{method:'DELETE'}),'Documento desvinculado. El seguimiento se actualizó.','No se pudo desvincular.');
  // SWR-CHK-011: el orden completo se envía al servidor; arrastrar y los botones Subir/Bajar hacen lo mismo.
  const reordenar=(ids:string[])=>run('orden',()=>api(`/viajes/${tareas[0].viajeId}/tareas/orden`,token,{method:'PATCH',body:JSON.stringify({ids})}),'Orden actualizado.','No se pudo reordenar.');
  function mover(id:string,delta:number){
    const ids=tareas.map(t=>t.id),from=ids.indexOf(id),to=from+delta;
    if(to<0||to>=ids.length)return;
    ids.splice(from,1);ids.splice(to,0,id);void reordenar(ids);
  }
  function soltar(destino:string){
    const origen=arrastrada;setArrastrada(null);
    if(!origen||origen===destino)return;
    const ids=tareas.map(t=>t.id),from=ids.indexOf(origen),to=ids.indexOf(destino);
    ids.splice(from,1);ids.splice(to,0,origen);void reordenar(ids);
  }
  if(!tareas.length)return <p className="py-6 text-sm text-gray-600">Sin elementos. Agrega la primera tarea.</p>;
  return <div className="space-y-4">
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{message&&<p role="status" className="text-sm text-brand-700">{message}</p>}
    <p className="text-xs text-gray-600">Arrastra una tarea o usa los botones Subir y Bajar para cambiar el orden. Las subtareas no cuentan en el progreso.</p>
    <ul className="divide-y divide-gray-100">{tareas.map((task,index)=>{
      const resumen=[task.fechaLimite&&`Fecha límite: ${task.fechaLimite.slice(0,10)}`,task.responsable&&`Responsable: ${task.responsable}`,task.recurrente&&'Tarea recurrente',
        task.subtareas?.length?`Subtareas: ${task.subtareas.filter(s=>s.completa).length} de ${task.subtareas.length}`:null].filter(Boolean).join(' · ');
      return <li key={task.id} draggable={busy===null&&editing!==task.id} onDragStart={()=>setArrastrada(task.id)} onDragOver={event=>event.preventDefault()} onDrop={()=>soltar(task.id)} onDragEnd={()=>setArrastrada(null)}
        className={`space-y-3 py-4 ${arrastrada===task.id?'opacity-50':''}`}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {editing===task.id
          ?<div className="flex-1"><InlineEdit label={`Descripción de la tarea ${task.descripcion}`} initial={task.descripcion} path={`/tareas/${task.id}`} field="descripcion" onSaved={()=>{setEditing(null);setMessage('Tarea actualizada.');onChange();}} onCancel={()=>setEditing(null)}/></div>
          :<div className="flex min-w-0 flex-wrap items-center gap-3"><span className="min-w-0 break-words text-sm font-medium text-gray-800">{task.descripcion}</span><Button type="button" variant="outline" size="xs" aria-label={`Editar tarea ${task.descripcion}`} onClick={()=>setEditing(task.id)}>Editar</Button></div>}
        <div className="flex items-center gap-2"><label className="sr-only" htmlFor={`estado-${task.id}`}>Estado de tarea {task.descripcion}</label><select id={`estado-${task.id}`} value={task.estado} disabled={busy!==null} onChange={event=>void change(task.id,event.target.value as EstadoTarea)} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 sm:w-48">{(Object.keys(estados) as EstadoTarea[]).map(key=><option key={key} value={key}>{estados[key]}</option>)}</select>
          <Button type="button" variant="outline" size="xs" disabled={busy!==null||index===0} aria-label={`Subir tarea ${task.descripcion}`} onClick={()=>mover(task.id,-1)}>↑</Button>
          <Button type="button" variant="outline" size="xs" disabled={busy!==null||index===tareas.length-1} aria-label={`Bajar tarea ${task.descripcion}`} onClick={()=>mover(task.id,1)}>↓</Button></div>
      </div>
      {(resumen||task.comentario)&&<div className="space-y-1 text-xs text-gray-600">{resumen&&<p>{resumen}</p>}{task.comentario&&<p className="break-words">Comentario: {task.comentario}</p>}</div>}
      <Button type="button" variant="outline" size="xs" aria-expanded={detalle===task.id} aria-label={`Detalles de ${task.descripcion}`} onClick={()=>setDetalle(detalle===task.id?null:task.id)}>{detalle===task.id?'Ocultar detalles':'Detalles y subtareas'}</Button>
      {detalle===task.id&&<Detalles tarea={task} token={token} onChange={onChange} onMessage={setMessage}/>}
      {!!task.documentos?.length&&<ul aria-label={`Documentos vinculados a ${task.descripcion}`} className="space-y-2 rounded-lg bg-gray-50 p-3">{task.documentos.map(doc=><li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="flex flex-wrap items-center gap-2"><span className="font-medium text-gray-800">{doc.identificacion}</span><span className="text-gray-600">{textoVigencia(doc)}</span>
          {doc.porVencer&&<span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">Por vencer</span>}</span>
        <Button type="button" variant="outline" size="xs" disabled={busy!==null} aria-label={`Desvincular ${doc.identificacion} de ${task.descripcion}`} onClick={()=>void unlink(task.id,doc.id)}>Desvincular</Button>
      </li>)}</ul>}
    </li>;})}</ul>
  </div>;
}

// SWR-CHK-008, 009, 010, 012, 013: fecha límite, comentario, subtareas, responsable y recurrencia.
function Detalles({tarea,token,onChange,onMessage}: {tarea:Tarea;token:string|null;onChange:()=>void;onMessage:(texto:string)=>void}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[nueva,setNueva]=useState('');
  async function guardar(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');
    const data=new FormData(event.currentTarget);
    const texto=(name:string)=>String(data.get(name)||'').trim();
    setBusy(true);
    try{await api(`/tareas/${tarea.id}`,token,{method:'PATCH',body:JSON.stringify({fechaLimite:texto('fechaLimite'),responsable:texto('responsable'),comentario:texto('comentario'),recurrente:data.get('recurrente')==='on'})});onMessage('Detalles de la tarea guardados.');onChange();}
    catch(reason){setError(reason instanceof Error?reason.message:'No se pudieron guardar los detalles.');}
    finally{setBusy(false);}
  }
  async function subtarea(action:()=>Promise<unknown>,fallo:string){
    setBusy(true);setError('');
    try{await action();onChange();}catch(reason){setError(reason instanceof Error?reason.message:fallo);}finally{setBusy(false);}
  }
  async function agregar(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const descripcion=nueva.trim();
    if(!descripcion){setError('Escribe la descripción de la subtarea.');return;}
    await subtarea(async()=>{await api(`/tareas/${tarea.id}/subtareas`,token,{method:'POST',body:JSON.stringify({descripcion})});setNueva('');},'No se pudo agregar la subtarea.');
  }
  return <div className="space-y-5 rounded-xl bg-gray-50 p-4">
    <form aria-label={`Detalles de la tarea ${tarea.descripcion}`} noValidate onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><label htmlFor={`limite-${tarea.id}`} className="block text-sm font-medium text-gray-700">Fecha límite</label><Input id={`limite-${tarea.id}`} name="fechaLimite" type="date" defaultValue={tarea.fechaLimite?.slice(0,10)??''}/></div>
      <div className="space-y-2"><label htmlFor={`resp-${tarea.id}`} className="block text-sm font-medium text-gray-700">Responsable</label><Input id={`resp-${tarea.id}`} name="responsable" maxLength={120} defaultValue={tarea.responsable??''}/></div>
      <div className="space-y-2 sm:col-span-2"><label htmlFor={`coment-${tarea.id}`} className="block text-sm font-medium text-gray-700">Comentario</label><textarea id={`coment-${tarea.id}`} name="comentario" rows={2} maxLength={1000} defaultValue={tarea.comentario??''} className={area}/></div>
      <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2"><input type="checkbox" name="recurrente" defaultChecked={tarea.recurrente??false}/>Recurrente: se copia como pendiente a tus viajes nuevos</label>
      <div className="sm:col-span-2"><Button type="submit" size="sm" disabled={busy}>Guardar detalles</Button></div>
    </form>
    <div className="space-y-3 border-t border-gray-200 pt-4">
      <h4 className="text-sm font-medium text-gray-800">Subtareas</h4>
      {tarea.subtareas?.length?<ul aria-label={`Subtareas de ${tarea.descripcion}`} className="space-y-2">{tarea.subtareas.map(sub=><li key={sub.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <label className="flex min-w-0 items-center gap-2 text-gray-800"><input type="checkbox" checked={sub.completa} disabled={busy} onChange={event=>void subtarea(()=>api(`/subtareas/${sub.id}`,token,{method:'PATCH',body:JSON.stringify({completa:event.target.checked})}),'No se pudo actualizar la subtarea.')}/><span className={`break-words ${sub.completa?'line-through text-gray-500':''}`}>{sub.descripcion}</span></label>
        <Button type="button" variant="outline" size="xs" disabled={busy} aria-label={`Quitar subtarea ${sub.descripcion}`} onClick={()=>void subtarea(()=>api(`/subtareas/${sub.id}`,token,{method:'DELETE'}),'No se pudo quitar la subtarea.')}>Quitar</Button></li>)}</ul>
        :<p className="text-sm text-gray-600">Esta tarea no tiene subtareas.</p>}
      <form aria-label={`Agregar subtarea a ${tarea.descripcion}`} noValidate onSubmit={agregar} className="flex flex-col gap-2 sm:flex-row">
        <Input aria-label={`Nueva subtarea de ${tarea.descripcion}`} value={nueva} maxLength={200} onChange={event=>setNueva(event.target.value)}/>
        <Button type="submit" size="sm" disabled={busy}>Agregar subtarea</Button>
      </form>
    </div>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}
