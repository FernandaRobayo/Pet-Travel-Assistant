'use client';
import {ReactNode,useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';

// Ventana modal accesible: Escape o clic en el fondo cierran; el foco entra al abrir y vuelve al botón que la abrió.
export default function Modal({etiqueta,onClose,children}:{etiqueta:string;onClose:()=>void;children:ReactNode}){
  const panel=useRef<HTMLDivElement>(null),cerrar=useRef(onClose);
  cerrar.current=onClose;
  useEffect(()=>{
    const previo=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    panel.current?.focus();
    const tecla=(e:KeyboardEvent)=>{if(e.key==='Escape')cerrar.current();};
    document.addEventListener('keydown',tecla);
    return ()=>{document.removeEventListener('keydown',tecla);document.body.style.overflow=overflow;previo?.focus?.();};
  },[]);
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div aria-hidden="true" className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"/>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={etiqueta} tabIndex={-1}
        className="relative max-h-[92vh] w-full max-w-3xl animate-[fadeIn_.15s_ease-out] overflow-y-auto rounded-2xl bg-gray-50 p-2 shadow-theme-lg outline-none sm:p-3">
        {children}
      </div>
    </div>,document.body);
}
