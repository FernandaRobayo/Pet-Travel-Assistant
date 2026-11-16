import type {ReactNode} from 'react';

const PUNTOS=[
  ['Checklist por viaje','Tareas, subtareas, fechas límite y plantillas listas.'],
  ['Documentos al día','Adjunta certificados y recibe avisos antes de que venzan.'],
  ['Todo en un solo lugar','Reglas del transportador, tramos y alojamiento.'],
];

// Maqueta compartida de las pantallas de acceso: panel de marca (solo en pantallas grandes) + formulario.
export default function AuthShell({children}:{children:ReactNode}){
  return <div className="grid min-h-svh lg:grid-cols-2">
    <aside aria-hidden="true" className="relative hidden overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <span className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10"/>
      <span className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/10"/>
      <div className="relative text-6xl">🐾</div>
      <div className="relative max-w-md space-y-8">
        <h2 className="text-4xl font-semibold leading-tight">Viaja tranquilo con tu mascota</h2>
        <ul className="space-y-5">{PUNTOS.map(([titulo,texto])=><li key={titulo} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm">✓</span>
          <span><span className="block font-medium">{titulo}</span><span className="text-sm text-white/80">{texto}</span></span></li>)}</ul>
      </div>
      <p className="relative text-xs text-white/70">Pet Travel Assistant · Calidad de Software, CORHUILA</p>
    </aside>
    <main className="flex items-center justify-center bg-gray-50 p-6">{children}</main>
  </div>;
}
