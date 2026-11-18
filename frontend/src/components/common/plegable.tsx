import type {ReactNode} from 'react';

// Sección que se despliega y se pliega (details nativo: accesible con teclado y sin JavaScript extra).
export default function Plegable({titulo,resumen,abierto=false,children}:{titulo:string;resumen?:string;abierto?:boolean;children:ReactNode}){
  return <details open={abierto} className="group rounded-2xl border border-gray-200 bg-white">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 transition hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
      <span className="min-w-0"><span className="block text-sm font-semibold text-gray-800">{titulo}</span>{resumen&&<span className="block truncate text-xs text-gray-500">{resumen}</span>}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
    </summary>
    <div className="space-y-5 border-t border-gray-100 p-5">{children}</div>
  </details>;
}
