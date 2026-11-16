export type EstadoTarea = 'pendiente' | 'completa' | 'requiere_revision';
export type EstadoGeneral = 'Sin elementos' | 'Requiere revisión' | 'Con pendientes' | 'Checklist completo';
export type Vigencia = 'fecha' | 'sin_vencimiento' | 'desconocida';
export interface DocumentoDominio {id: string; identificacion: string; vigencia: Vigencia; fechaVencimiento: string | null}
export interface TareaDominio {id: string; estado: EstadoTarea; descripcion?: string}
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

export type Semaforo = 'rojo' | 'amarillo' | 'verde' | 'gris';
export interface ElementoLista {tipo: 'pendiente' | 'revision' | 'advertencia'; texto: string; referenciaId: string}

// SWR-SEG-019: rojo = Requiere revisión, amarillo = Con pendientes, verde = Checklist completo, gris = Sin elementos.
export function semaforo(estado: EstadoGeneral): Semaforo {
  if (estado === 'Requiere revisión') return 'rojo';
  if (estado === 'Con pendientes') return 'amarillo';
  if (estado === 'Checklist completo') return 'verde';
  return 'gris';
}

export function calcularSeguimiento(input: {
  fechaSalida: string;
  tareas: readonly TareaDominio[];
  documentos: readonly DocumentoDominio[];
  vinculos: readonly {documentoId: string; tareaId: string}[];
  hoy?: string;
}) {
  const tareasIds = new Set(input.tareas.map(t => t.id));
  const documentosIds = new Set(input.vinculos.filter(v => tareasIds.has(v.tareaId)).map(v => v.documentoId));
  const advertencias: Aviso[] = [], revisiones: Aviso[] = [];
  const hoy = input.hoy ? fechaCalendario(input.hoy) : null;
  const porVencerLista: {documentoId: string; identificacion: string; fechaVencimiento: string; diasParaVencer: number}[] = [];
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
    // SWR-SEG-015/020: documentos por vencer; solo informativo (SWR-SEG-016).
    if (hoy && documento.vigencia === 'fecha' && documento.fechaVencimiento && porVencer(documento.fechaVencimiento, hoy)) {
      porVencerLista.push({...base, fechaVencimiento: documento.fechaVencimiento, diasParaVencer: diasEntre(hoy, documento.fechaVencimiento)});
    }
  }
  const general = estadoGeneral(input.tareas, advertencias, revisiones);
  const pendientes = input.tareas.filter(t => t.estado === 'pendiente').map(t => ({id: t.id, descripcion: t.descripcion ?? ''}));
  const enRevision = input.tareas.filter(t => t.estado === 'requiere_revision').map(t => ({id: t.id, descripcion: t.descripcion ?? ''}));
  const progreso = calcularProgreso(input.tareas);
  const diasRestantes = hoy ? diasEntre(hoy, input.fechaSalida) : null;
  const lista: ElementoLista[] = [
    ...pendientes.map((t): ElementoLista => ({tipo: 'pendiente', texto: t.descripcion, referenciaId: t.id})),
    ...enRevision.map((t): ElementoLista => ({tipo: 'revision', texto: t.descripcion, referenciaId: t.id})),
    ...[...advertencias, ...revisiones].map((a): ElementoLista => ({tipo: 'advertencia', texto: `${a.identificacion}: ${a.motivo}`, referenciaId: a.documentoId}))
  ];
  return {
    progreso,
    estadoGeneral: general,
    advertencias, revisiones,
    totalTareas: input.tareas.length,
    tareasCompletas: input.tareas.filter(t => t.estado === 'completa').length,
    aviso: 'Checklist completo no significa autorización para viajar',
    // Incremento 2 (SWR-SEG-001, 018, 019, 020, 021)
    pendientes, enRevision, diasRestantes, semaforo: semaforo(general), porVencer: porVencerLista, lista,
    resumen: {progreso, advertencias: advertencias.length + revisiones.length, porVencer: porVencerLista.length, diasRestantes}
  };
}

// Incremento extra (CC-03, SWR-SEG-015). La señal es solo informativa: no altera
// el progreso ni el estado general (SWR-SEG-016).
// Supuesto: período de anticipación de 30 días. No está definido en el alcance actual (DP-16).
export const DIAS_ANTICIPACION_POR_VENCER = 30;

export function diasEntre(desde: string, hasta: string): number {
  const a = Date.parse(`${fechaCalendario(desde)}T00:00:00.000Z`);
  const b = Date.parse(`${fechaCalendario(hasta)}T00:00:00.000Z`);
  return Math.round((b - a) / 86400000);
}

export function porVencer(fechaVencimiento: string | null, hoy: string, dias: number = DIAS_ANTICIPACION_POR_VENCER): boolean {
  if (!fechaVencimiento) return false;
  const restantes = diasEntre(hoy, fechaVencimiento);
  return restantes >= 0 && restantes <= dias;
}

// Supuesto: «hoy» es la fecha de calendario de Colombia (America/Bogota).
export function fechaHoy(ahora: Date = new Date()): string {
  return ahora.toLocaleDateString('en-CA', {timeZone: 'America/Bogota'});
}
