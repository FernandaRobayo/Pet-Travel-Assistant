export type EstadoTarea = 'pendiente' | 'completa' | 'requiere_revision';
export type EstadoGeneral = 'Sin elementos' | 'Requiere revisión' | 'Con pendientes' | 'Checklist completo';
export type Vigencia = 'fecha' | 'sin_vencimiento' | 'desconocida';
export interface DocumentoDominio {id: string; identificacion: string; vigencia: Vigencia; fechaVencimiento: string | null}
export interface TareaDominio {id: string; estado: EstadoTarea}
export interface Aviso {documentoId: string; identificacion: string; motivo: string}

export function fechaCalendario(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('Fecha de calendario inválida.');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) throw new RangeError('Fecha de calendario inválida.');
  return value;
}

export function evaluarVigencia(documento: DocumentoDominio, salida: string): {advertencia: string | null; revision: string | null} {
  fechaCalendario(salida);
  if (documento.vigencia === 'sin_vencimiento') return {advertencia: null, revision: null};
  if (documento.vigencia === 'desconocida') return {advertencia: 'Vigencia desconocida: requiere revisión.', revision: null};
  if (!documento.fechaVencimiento) throw new RangeError('El documento con fecha necesita vencimiento.');
  const vence = fechaCalendario(documento.fechaVencimiento);
  if (vence < salida) return {advertencia: 'El documento vence antes de la fecha de salida.', revision: null};
  if (vence === salida) return {advertencia: null, revision: 'El vencimiento coincide con la salida: requiere revisión.'};
  return {advertencia: null, revision: null};
}

export function calcularProgreso(tareas: readonly TareaDominio[]): number | null {
  if (!tareas.length) return null;
  // Supuesto: entero redondeado. No está definido en el alcance actual del SRS.
  return Math.round(tareas.filter(t => t.estado === 'completa').length / tareas.length * 100);
}

export function estadoGeneral(tareas: readonly TareaDominio[], advertencias: readonly Aviso[], revisiones: readonly Aviso[]): EstadoGeneral {
  if (!tareas.length) return 'Sin elementos';
  if (tareas.some(t => t.estado === 'requiere_revision') || advertencias.length || revisiones.length) return 'Requiere revisión';
  if (tareas.some(t => t.estado === 'pendiente')) return 'Con pendientes';
  return 'Checklist completo';
}

export function validarVinculo(input: {usuarioDocumentoId: string; usuarioViajeId: string; mascotaDocumentoId: string; mascotaViajeId: string}): 'valido' | 'otra_cuenta' | 'otra_mascota' {
  if (input.usuarioDocumentoId !== input.usuarioViajeId) return 'otra_cuenta';
  if (input.mascotaDocumentoId !== input.mascotaViajeId) return 'otra_mascota';
  return 'valido';
}

export function calcularSeguimiento(input: {
  fechaSalida: string;
  tareas: readonly TareaDominio[];
  documentos: readonly DocumentoDominio[];
  vinculos: readonly {documentoId: string; tareaId: string}[];
}) {
  const tareasIds = new Set(input.tareas.map(t => t.id));
  const documentosIds = new Set(input.vinculos.filter(v => tareasIds.has(v.tareaId)).map(v => v.documentoId));
  const advertencias: Aviso[] = [], revisiones: Aviso[] = [];
  // Supuesto: un aviso por documento aunque tenga varios vínculos al viaje.
  // No está definido en el alcance actual el tratamiento de avisos duplicados.
  const evaluados = new Set<string>();
  for (const documento of input.documentos) {
    if (!documentosIds.has(documento.id) || evaluados.has(documento.id)) continue;
    evaluados.add(documento.id);
    const result = evaluarVigencia(documento, input.fechaSalida);
    const base = {documentoId: documento.id, identificacion: documento.identificacion};
    if (result.advertencia) advertencias.push({...base, motivo: result.advertencia});
    if (result.revision) revisiones.push({...base, motivo: result.revision});
  }
  return {
    progreso: calcularProgreso(input.tareas),
    estadoGeneral: estadoGeneral(input.tareas, advertencias, revisiones),
    advertencias, revisiones,
    totalTareas: input.tareas.length,
    tareasCompletas: input.tareas.filter(t => t.estado === 'completa').length,
    aviso: 'Checklist completo no significa autorización para viajar'
  };
}
