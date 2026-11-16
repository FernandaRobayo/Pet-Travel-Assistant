'use client';
import {KeyboardEvent,useState} from 'react';
import {Input} from '@/components/ui/input';

interface Props extends Omit<React.ComponentProps<'input'>,'type'> { label: string; error?: string; medidor?: boolean }

function nivel(valor:string){
  let puntos=0;
  if(valor.length>=8)puntos++;
  if(valor.length>=12)puntos++;
  if(/[a-z]/.test(valor)&&/[A-Z]/.test(valor))puntos++;
  if(/\d/.test(valor)&&/[^A-Za-z0-9]/.test(valor))puntos++;
  return puntos; // 0..4
}
const ETIQUETAS=['Muy débil','Débil','Aceptable','Buena','Fuerte'];
const COLORES=['bg-gray-300','bg-red-500','bg-amber-500','bg-lime-500','bg-green-600'];

// Campo de contraseña con botón para mostrar/ocultar, aviso de Bloq Mayús y medidor opcional de fortaleza.
export default function PasswordField({id,label,error,medidor=false,onChange,onKeyUp,...props}:Props){
  const [visible,setVisible]=useState(false),[mayusculas,setMayusculas]=useState(false),[valor,setValor]=useState('');
  const puntos=nivel(valor);
  function teclas(event:KeyboardEvent<HTMLInputElement>){setMayusculas(event.getModifierState?.('CapsLock')??false);onKeyUp?.(event);}
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      <Input id={id} type={visible?'text':'password'} aria-invalid={Boolean(error)} aria-describedby={error?`${id}-error`:undefined} className="pe-12"
        onChange={event=>{setValor(event.target.value);onChange?.(event);}} onKeyUp={teclas} {...props}/>
      <button type="button" onClick={()=>setVisible(v=>!v)} aria-pressed={visible} aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'} title={visible?'Ocultar contraseña':'Mostrar contraseña'}
        className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-[10px] text-gray-500 transition hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-500">
        {visible
          ?<svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0112 6c5 0 8.5 4.2 9.5 6a12 12 0 01-3 3.5M6.5 7.6A12 12 0 002.5 12c1 1.8 4.5 6 9.5 6a9.7 9.7 0 004-.9M9.9 9.9a3 3 0 004.2 4.2"/></svg>
          :<svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>}
      </button>
    </div>
    {mayusculas&&<p className="text-xs text-amber-700">Bloq Mayús está activado.</p>}
    {medidor&&valor&&<div aria-hidden="true" className="flex items-center gap-2">
      <div className="flex flex-1 gap-1">{[1,2,3,4].map(n=><span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${puntos>=n?COLORES[puntos]:'bg-gray-200'}`}/>)}</div>
      <span className="w-16 text-end text-xs text-gray-500">{ETIQUETAS[puntos]}</span>
    </div>}
    {error&&<p id={`${id}-error`} className="text-sm text-red-700">{error}</p>}
  </div>;
}
