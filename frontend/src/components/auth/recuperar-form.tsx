'use client';
import {FormEvent,useState} from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import FormField from '@/components/forms/form-field';
import {api} from '@/lib/api';

// SWR-ACC-004 / DP-17 (Supuesto): se restablece la contraseña con el código de recuperación entregado al registrarse.
export default function RecuperarForm(){
  const [busy,setBusy]=useState(false);
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [codigo,setCodigo]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setCodigo('');
    const data=new FormData(event.currentTarget);
    const correo=String(data.get('correo')||'').trim(),codigoIngresado=String(data.get('codigo')||'').trim(),contrasena=String(data.get('contrasena')||'');
    const next:Record<string,string>={};
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))next.correo='Ingresa un correo válido.';
    if(codigoIngresado.length<8)next.codigo='Ingresa tu código de recuperación.';
    if(contrasena.length<8)next.contrasena='La contraseña debe tener al menos 8 caracteres.';
    if(new TextEncoder().encode(contrasena).length>72)next.contrasena='La contraseña supera el máximo de 72 bytes.';
    setErrors(next);if(Object.keys(next).length)return;
    setBusy(true);
    try{const result=await api<{codigoRecuperacion:string}>('/auth/recuperar',null,{method:'POST',body:JSON.stringify({correo,codigo:codigoIngresado,contrasena})});setCodigo(result.codigoRecuperacion);}
    catch(reason){setErrors({general:reason instanceof Error?reason.message:'No se pudo restablecer la contraseña.'});}
    finally{setBusy(false);}
  }
  return <div className="flex min-h-svh items-center justify-center p-6">
    <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-theme-sm">
      <h1 className="mb-2 text-heading-six font-semibold text-gray-800">Recuperar contraseña</h1>
      <p className="mb-8 text-sm text-gray-600">Ingresa tu correo, el código de recuperación que recibiste al registrarte y tu nueva contraseña.</p>
      <form onSubmit={submit} noValidate className="space-y-5" aria-label="Recuperar contraseña">
        <FormField id="correo" name="correo" label="Correo" type="email" autoComplete="email" maxLength={254} error={errors.correo} required/>
        <FormField id="codigo" name="codigo" label="Código de recuperación" autoComplete="off" maxLength={40} error={errors.codigo} required/>
        <FormField id="contrasena" name="contrasena" label="Nueva contraseña" type="password" autoComplete="new-password" error={errors.contrasena} required/>
        {errors.general&&<p role="alert" className="text-sm text-red-700">{errors.general}</p>}
        {codigo&&<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-gray-800"><p role="status" className="font-medium">Contraseña actualizada.</p><p>Tu código anterior ya no sirve. Guarda el nuevo:</p><p className="my-2 break-all font-mono text-base tracking-wider" aria-label="Nuevo código de recuperación">{codigo}</p><Link href="/login" className="font-medium text-brand-700 underline">Iniciar sesión</Link></div>}
        <Button type="submit" disabled={busy} className="w-full">{busy?'Procesando…':'Restablecer contraseña'}</Button>
      </form>
      <p className="mt-6 text-sm"><Link href="/login" className="font-medium text-brand-700 underline">Volver a iniciar sesión</Link></p>
    </section>
  </div>;
}
