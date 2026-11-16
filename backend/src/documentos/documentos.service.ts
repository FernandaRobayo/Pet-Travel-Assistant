import {randomUUID} from 'node:crypto';
import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {fechaHoy, porVencer, validarVinculo} from '../domain/seguimiento';
import {LIMITE_ARCHIVO, TIPOS_DOCUMENTO, validarArchivo, type ArchivoSubido} from '../common/archivos';
import {DocumentoDto} from './documentos.dto';

@Injectable()
export class DocumentosService {
  constructor(private readonly prisma: PrismaService) {}
  private async mascota(usuarioId: string, id: string) {
    const mascota = await this.prisma.mascota.findFirst({where: {id, usuarioId}, select: {id: true}});
    if (!mascota) throw new NotFoundException('Mascota no encontrada.');
    return mascota;
  }
  private datos(input: DocumentoDto) {
    if (input.vigencia !== 'fecha' && input.fechaVencimiento !== undefined) throw new BadRequestException('Solo la vigencia con fecha admite fecha de vencimiento.');
    return {
      identificacion: input.identificacion, vigencia: input.vigencia,
      fechaVencimiento: input.fechaVencimiento ? new Date(`${input.fechaVencimiento}T00:00:00.000Z`) : null
    };
  }
  async list(usuarioId: string, mascotaId: string) {
    await this.mascota(usuarioId, mascotaId);
    return this.prisma.documento.findMany({where: {mascotaId}, orderBy: {identificacion: 'asc'}});
  }
  async create(usuarioId: string, mascotaId: string, input: DocumentoDto) {
    await this.mascota(usuarioId, mascotaId);
    return this.prisma.documento.create({data: {...this.datos(input), mascotaId}});
  }
  async link(usuarioId: string, tareaId: string, documentoId: string) {
    const tarea = await this.prisma.tarea.findFirst({where: {id: tareaId, viaje: {mascota: {usuarioId}}}, include: {viaje: {include: {mascota: true}}}});
    if (!tarea) throw new NotFoundException('Tarea no encontrada.');
    const documento = await this.prisma.documento.findFirst({where: {id: documentoId, mascota: {usuarioId}}, include: {mascota: true}});
    if (!documento) throw new ForbiddenException('No puedes vincular este documento.');
    const result = validarVinculo({usuarioDocumentoId: documento.mascota.usuarioId, usuarioViajeId: tarea.viaje.mascota.usuarioId, mascotaDocumentoId: documento.mascotaId, mascotaViajeId: tarea.viaje.mascotaId});
    if (result === 'otra_cuenta') throw new ForbiddenException('No puedes vincular este documento.');
    if (result === 'otra_mascota') throw new BadRequestException('El documento y el viaje deben pertenecer a la misma mascota.');
    return this.prisma.documentoTarea.upsert({where: {documentoId_tareaId: {documentoId, tareaId}}, create: {documentoId, tareaId}, update: {}});
  }
  // Incremento extra (SWR-DOC-004): modificar identificación y vigencia de un documento propio.
  async update(usuarioId: string, id: string, input: DocumentoDto) {
    const documento = await this.prisma.documento.findFirst({where: {id, mascota: {usuarioId}}, select: {id: true}});
    if (!documento) throw new NotFoundException('Documento no encontrado.');
    return this.prisma.documento.update({where: {id}, data: this.datos(input)});
  }
  // Incremento extra (SWR-DOC-007): desvincular un documento de una tarea.
  async unlink(usuarioId: string, tareaId: string, documentoId: string) {
    const tarea = await this.prisma.tarea.findFirst({where: {id: tareaId, viaje: {mascota: {usuarioId}}}, select: {id: true}});
    if (!tarea) throw new NotFoundException('Tarea no encontrada.');
    const result = await this.prisma.documentoTarea.deleteMany({where: {tareaId, documentoId}});
    if (!result.count) throw new NotFoundException('El documento no está vinculado a esta tarea.');
    return {desvinculado: true};
  }

  // ---- Incremento 2: archivos adjuntos (SWR-DOC-008, 010, 011, 013, 014, 015, 016, SWR-DATA-005) ----
  // Supuesto (DP-14/DP-15): PDF, JPG o PNG de hasta 5 MB, guardados en la base. El contenido no se interpreta (SWR-DOC-012).
  private async documentoPropio(usuarioId: string, id: string) {
    const documento = await this.prisma.documento.findFirst({where: {id, mascota: {usuarioId}}, select: {id: true}});
    if (!documento) throw new NotFoundException('Documento no encontrado.');
    return documento;
  }
  private async archivoPropio(usuarioId: string, id: string) {
    const archivo = await this.prisma.archivoDocumento.findFirst({where: {id, documento: {mascota: {usuarioId}}}, select: {id: true, documentoId: true, grupoId: true}});
    if (!archivo) throw new NotFoundException('Archivo no encontrado.');
    return archivo;
  }
  private static readonly META = {id: true, grupoId: true, version: true, nombre: true, tipo: true, tamano: true, creadoEn: true} as const;
  // Un archivo lógico por grupo: se muestra su versión más reciente y cuántas versiones tiene.
  async archivos(usuarioId: string, documentoId: string) {
    await this.documentoPropio(usuarioId, documentoId);
    const filas = await this.prisma.archivoDocumento.findMany({where: {documentoId}, select: DocumentosService.META, orderBy: {version: 'desc'}});
    const grupos = new Map<string, typeof filas>();
    for (const fila of filas) grupos.set(fila.grupoId, [...(grupos.get(fila.grupoId) ?? []), fila]);
    return [...grupos.values()]
      .map((versiones) => ({...versiones[0], versiones: versiones.length, primeraVez: versiones[versiones.length - 1].creadoEn}))
      .sort((a, b) => a.primeraVez.getTime() - b.primeraVez.getTime())
      .map(({primeraVez, ...archivo}) => archivo);
  }
  async subirArchivo(usuarioId: string, documentoId: string, file: ArchivoSubido | undefined) {
    await this.documentoPropio(usuarioId, documentoId);
    const f = validarArchivo(file, TIPOS_DOCUMENTO, LIMITE_ARCHIVO, 'Solo se aceptan archivos PDF, JPG o PNG.');
    return this.prisma.archivoDocumento.create({data: {documentoId, grupoId: randomUUID(), version: 1, nombre: f.nombre, tipo: f.tipo, tamano: f.tamano, datos: f.datos}, select: DocumentosService.META});
  }
  // SWR-DOC-011 / SWR-DOC-015: reemplazar crea una versión nueva y conserva las anteriores.
  async reemplazarArchivo(usuarioId: string, archivoId: string, file: ArchivoSubido | undefined) {
    const actual = await this.archivoPropio(usuarioId, archivoId);
    const f = validarArchivo(file, TIPOS_DOCUMENTO, LIMITE_ARCHIVO, 'Solo se aceptan archivos PDF, JPG o PNG.');
    const max = await this.prisma.archivoDocumento.aggregate({where: {grupoId: actual.grupoId}, _max: {version: true}});
    const nuevo = await this.prisma.archivoDocumento.create({
      data: {documentoId: actual.documentoId, grupoId: actual.grupoId, version: (max._max.version ?? 0) + 1, nombre: f.nombre, tipo: f.tipo, tamano: f.tamano, datos: f.datos},
      select: DocumentosService.META
    });
    await this.prisma.archivoDocumento.updateMany({where: {grupoId: actual.grupoId, id: {not: nuevo.id}}, data: {activo: false}});
    return nuevo;
  }
  // SWR-DOC-016
  async versiones(usuarioId: string, archivoId: string) {
    const actual = await this.archivoPropio(usuarioId, archivoId);
    return this.prisma.archivoDocumento.findMany({where: {grupoId: actual.grupoId}, select: DocumentosService.META, orderBy: {version: 'desc'}});
  }
  // SWR-DOC-010 / SWR-DOC-014: el contenido se entrega para abrirlo o previsualizarlo.
  async contenido(usuarioId: string, archivoId: string) {
    const archivo = await this.prisma.archivoDocumento.findFirst({where: {id: archivoId, documento: {mascota: {usuarioId}}}});
    if (!archivo) throw new NotFoundException('Archivo no encontrado.');
    return archivo;
  }
  // SWR-DOC-017: vista única de los documentos del viaje con la salida más cercana (desde hoy, sin archivados).
  async proximoViaje(usuarioId: string) {
    const hoy = fechaHoy();
    const viaje = await this.prisma.viaje.findFirst({
      where: {archivado: false, mascota: {usuarioId}, fechaSalida: {gte: new Date(`${hoy}T00:00:00.000Z`)}},
      orderBy: {fechaSalida: 'asc'},
      include: {mascota: {select: {id: true, nombre: true}}, tareas: {select: {documentos: {select: {documentoId: true}}}}}
    });
    if (!viaje) return {viaje: null, documentos: []};
    const vinculados = new Set(viaje.tareas.flatMap((tarea) => tarea.documentos.map((v) => v.documentoId)));
    const documentos = await this.prisma.documento.findMany({where: {mascotaId: viaje.mascotaId}, orderBy: {identificacion: 'asc'}, include: {archivos: {select: {grupoId: true}}}});
    return {
      viaje: {id: viaje.id, origen: viaje.origen, destino: viaje.destino, fechaSalida: viaje.fechaSalida.toISOString().slice(0, 10), mascota: viaje.mascota},
      documentos: documentos.map((documento) => {
        const fechaVencimiento = documento.fechaVencimiento?.toISOString().slice(0, 10) ?? null;
        return {id: documento.id, identificacion: documento.identificacion, vigencia: documento.vigencia, fechaVencimiento,
          vinculado: vinculados.has(documento.id), porVencer: documento.vigencia === 'fecha' && porVencer(fechaVencimiento, hoy),
          archivos: new Set(documento.archivos.map((a) => a.grupoId)).size};
      })
    };
  }
}
