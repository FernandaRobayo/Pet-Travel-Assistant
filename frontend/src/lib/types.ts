export interface Mascota {
  id: string; nombre: string;
  // Incremento 2 (SWR-MAS-005..010)
  especie?: string|null; raza?: string|null; edad?: number|null; peso?: number|null; notas?: string|null;
  veterinarioNombre?: string|null; veterinarioTelefono?: string|null; contactoEmergencia?: string|null; medicacion?: string|null;
  tieneFoto?: boolean;
}
export type Transporte = 'avion'|'bus'|'carro'|'otro';
export type EtapaViaje = 'planificado'|'en_preparacion'|'en_curso'|'finalizado';
export const transportes: Record<Transporte,string> = {avion: 'Avión', bus: 'Bus', carro: 'Carro', otro: 'Otro'};
export const etapas: Record<EtapaViaje,string> = {planificado: 'Planificado', en_preparacion: 'En preparación', en_curso: 'En curso', finalizado: 'Finalizado'};
export interface Tramo {id: string; origen: string; destino: string; fecha: string; orden: number}
export interface ReglasViaje {transportador: string; nombre: string; tamano: number; actualizadoEn: string}
export interface Viaje {
  id: string; origen: string; destino: string; fechaSalida: string; mascotaId: string; mascota: Mascota;
  // Incremento 2 (SWR-VIA-007..013)
  transporte?: Transporte|null; aerolinea?: string|null; numeroVuelo?: string|null; horaSalida?: string|null; aeropuerto?: string|null;
  alojamientoNombre?: string|null; alojamientoDireccion?: string|null; alojamientoConfirmacion?: string|null;
  etapa?: EtapaViaje; archivado?: boolean; tramos?: Tramo[]; reglas?: ReglasViaje|null;
}
export type EstadoTarea = 'pendiente' | 'completa' | 'requiere_revision';
export interface DocumentoVinculado {id: string; identificacion: string; vigencia: 'fecha'|'sin_vencimiento'|'desconocida'; fechaVencimiento: string|null; porVencer: boolean}
export interface Subtarea {id: string; tareaId: string; descripcion: string; completa: boolean}
export interface Tarea {
  id: string; descripcion: string; estado: EstadoTarea; viajeId: string; documentos?: DocumentoVinculado[];
  // Incremento 2 (SWR-CHK-008..013)
  fechaLimite?: string|null; comentario?: string|null; responsable?: string|null; recurrente?: boolean; orden?: number; subtareas?: Subtarea[];
}
export interface Plantilla {id: string; nombre: string; tareas: string[]}
export function textoVigencia(doc: {vigencia: DocumentoVinculado['vigencia']; fechaVencimiento: string|null}): string {
  return doc.vigencia==='fecha'?`Vence: ${doc.fechaVencimiento?.slice(0,10)??''}`:doc.vigencia==='sin_vencimiento'?'Sin vencimiento':'Vigencia desconocida';
}
export const estados: Record<EstadoTarea,string> = {pendiente: 'Pendiente', completa: 'Completa', requiere_revision: 'Requiere revisión'};
export interface Documento {id: string; identificacion: string; vigencia: 'fecha'|'sin_vencimiento'|'desconocida'; fechaVencimiento: string|null; mascotaId: string}
export interface ArchivoDocumento {id: string; grupoId: string; version: number; nombre: string; tipo: string; tamano: number; creadoEn: string; versiones?: number}
export interface ProximoViaje {
  viaje: {id: string; origen: string; destino: string; fechaSalida: string; mascota: {id: string; nombre: string}}|null;
  documentos: {id: string; identificacion: string; vigencia: Documento['vigencia']; fechaVencimiento: string|null; vinculado: boolean; porVencer: boolean; archivos: number}[];
}
export interface Seguimiento {
  progreso: number|null;
  estadoGeneral: 'Sin elementos'|'Requiere revisión'|'Con pendientes'|'Checklist completo';
  totalTareas: number;
  tareasCompletas: number;
  advertencias: {documentoId:string;identificacion:string;motivo:string}[];
  revisiones: {documentoId:string;identificacion:string;motivo:string}[];
  aviso: string;
  // Incremento 2 (SWR-SEG-001, 018..021); opcionales para tolerar respuestas anteriores.
  pendientes?: {id:string;descripcion:string}[];
  enRevision?: {id:string;descripcion:string}[];
  diasRestantes?: number|null;
  semaforo?: 'rojo'|'amarillo'|'verde'|'gris';
  porVencer?: {documentoId:string;identificacion:string;fechaVencimiento:string;diasParaVencer:number}[];
  lista?: {tipo:'pendiente'|'revision'|'advertencia';texto:string;referenciaId:string}[];
  resumen?: {progreso:number|null;advertencias:number;porVencer:number;diasRestantes:number|null};
}
export function textoTamano(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes/1024).toFixed(0)} KB` : `${(bytes/1048576).toFixed(1)} MB`;
}
export function textoDias(dias: number|null|undefined): string {
  if (dias===null||dias===undefined) return '';
  if (dias===0) return 'La salida es hoy';
  if (dias===1) return 'Falta 1 día';
  return dias>0?`Faltan ${dias} días`:`La salida fue hace ${-dias} días`;
}
