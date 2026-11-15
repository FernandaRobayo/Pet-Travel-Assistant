export interface Mascota {id: string; nombre: string}
export interface Viaje {id: string; origen: string; destino: string; fechaSalida: string; mascotaId: string; mascota: Mascota}
export type EstadoTarea = 'pendiente' | 'completa' | 'requiere_revision';
export interface Tarea {id: string; descripcion: string; estado: EstadoTarea; viajeId: string}
export const estados: Record<EstadoTarea,string> = {pendiente: 'Pendiente', completa: 'Completa', requiere_revision: 'Requiere revisión'};
export interface Documento {id: string; identificacion: string; vigencia: 'fecha'|'sin_vencimiento'|'desconocida'; fechaVencimiento: string|null; mascotaId: string}
export interface Seguimiento {
  progreso: number|null;
  estadoGeneral: 'Sin elementos'|'Requiere revisión'|'Con pendientes'|'Checklist completo';
  totalTareas: number;
  tareasCompletas: number;
  advertencias: {documentoId:string;identificacion:string;motivo:string}[];
  revisiones: {documentoId:string;identificacion:string;motivo:string}[];
  aviso: string;
}
