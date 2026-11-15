'use client';

import {FormEvent, useEffect, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import FormField from '@/components/forms/form-field';
import {useAuth} from './auth-provider';
import {api} from '@/lib/api';

export default function AuthForm({register = false}: {register?: boolean}) {
  const router = useRouter();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [message, setMessage] = useState('');
  useEffect(() => { if (auth.usuario) router.replace('/mascotas'); }, [auth.usuario, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('');
    const data = new FormData(event.currentTarget);
    const correo = String(data.get('correo') || '').trim();
    const contrasena = String(data.get('contrasena') || '');
    const next: Record<string,string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) next.correo = 'Ingresa un correo válido.';
    if (contrasena.length < 8) next.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
    if (new TextEncoder().encode(contrasena).length > 72) next.contrasena = 'La contraseña supera el máximo de 72 bytes.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      if (register) {
        await api('/auth/register', null, {method: 'POST', body: JSON.stringify({correo, contrasena})});
        setMessage('Cuenta creada. Ya puedes iniciar sesión.');
      } else {
        await auth.login(correo, contrasena); router.replace('/mascotas');
      }
    } catch (error) { setErrors({general: error instanceof Error ? error.message : 'No se pudo completar la operación.'}); }
    finally { setBusy(false); }
  }
  return <div className="flex min-h-svh items-center justify-center p-6">
    <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-theme-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="Pet Travel Assistant" width="220" height="48" className="mb-10"/>
      <h1 className="mb-2 text-heading-six font-semibold text-gray-800">{register ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
      <p className="mb-8 text-sm text-gray-600">Organiza la preparación de tus viajes con mascota.</p>
      <form onSubmit={submit} noValidate className="space-y-5" aria-label={register?'Registro':'Inicio de sesión'}>
        <FormField id="correo" name="correo" label="Correo" type="email" autoComplete="email" maxLength={254} error={errors.correo} required/>
        <FormField id="contrasena" name="contrasena" label="Contraseña" type="password" autoComplete={register?'new-password':'current-password'} error={errors.contrasena} required/>
        <p className="text-xs text-gray-600">Entre 8 caracteres y 72 bytes.</p>
        {errors.general && <p role="alert" className="text-sm text-red-700">{errors.general}</p>}
        {message && <p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{message} <Link href="/login" className="underline">Iniciar sesión</Link></p>}
        <Button type="submit" disabled={busy} className="w-full">{busy?'Procesando…':register?'Registrar cuenta':'Ingresar'}</Button>
      </form>
      <p className="mt-6 text-sm text-gray-600">{register?'¿Ya tienes cuenta?':'¿Primera vez?'}{' '}<Link className="font-medium text-brand-700 underline" href={register?'/login':'/register'}>{register?'Iniciar sesión':'Crear cuenta'}</Link></p>
    </section>
  </div>;
}
