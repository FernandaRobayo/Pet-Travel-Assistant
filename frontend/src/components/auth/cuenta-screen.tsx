'use client';
import {useState} from 'react';
import ComponentCard from '@/components/common/component-card';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/components/auth/auth-provider';
import {api} from '@/lib/api';

export default function CuentaScreen(){
  const {token,usuario}=useAuth();
  const [busy,setBusy]=useState(false),[codigo,setCodigo]=useState(''),[error,setError]=useState('');
  async function generar(){
    setBusy(true);setError('');
    try{const result=await api<{codigoRecuperacion:string}>('/auth/codigo-recuperacion',token,{method:'POST'});setCodigo(result.codigoRecuperacion);}
    catch(reason){setError(reason instanceof Error?reason.message:'No se pudo generar el código.');}
    finally{setBusy(false);}
  }
  return <div className="space-y-6">
    <div><p className="mb-2 text-sm text-gray-600">Cuenta</p><h1 className="text-heading-six font-semibold text-gray-800">Mi cuenta</h1></div>
    <ComponentCard title="Código de recuperación" desc={`Cuenta: ${usuario?.correo??''}. Sirve para restablecer la contraseña sin correo electrónico.`}>
      <p className="text-sm text-gray-700">Genera un código nuevo si no guardaste el que recibiste al registrarte. El código anterior deja de funcionar y el nuevo se muestra una sola vez.</p>
      <Button type="button" onClick={()=>void generar()} disabled={busy}>{busy?'Generando…':'Generar nuevo código'}</Button>
      {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
      {codigo&&<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-gray-800"><p className="font-medium">Guarda este código</p><p className="my-2 break-all font-mono text-base tracking-wider" aria-label="Nuevo código de recuperación">{codigo}</p></div>}
    </ComponentCard>
  </div>;
}
