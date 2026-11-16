import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {ViajesService} from '../viajes/viajes.service';
import {fechaHoy, porVencer} from '../domain/seguimiento';
import {PLANTILLAS, buscarPlantilla} from '../domain/plantillas';
import {aFecha, sinUndefined} from '../common/texto';
import {EstadoDto, SubtareaDto, SubtareaEdicionDto, TareaDto, TareaEdicionDto} from './checklist.dto';

@Injectable()
export class ChecklistService {
  constructor(private readonly prisma: PrismaService, private readonly viajes: ViajesService) {}
  private async tareaPropia(usuarioId: string, id: string) {
    const tarea = await this.prisma.tarea.findFirst({where: {id, viaje: {mascota: {usuarioId}}}, select: {id: true}});
    if (!tarea) throw new NotFoundException('Tarea no encontrada.');
    return tarea;
  }
  private async siguienteOrden(viajeId: string) {
    const max = await this.prisma.tarea.aggregate({where: {viajeId}, _max: {orden: true}});
    return (max._max.orden ?? -1) + 1;
  }
  async list(usuarioId: string, viajeId: string) {
    await this.viajes.get(usuarioId, viajeId);
    const hoy = fechaHoy();
    const tareas = await this.prisma.tarea.findMany({
      where: {viajeId}, orderBy: [{orden: 'asc'}, {id: 'asc'}],
      include: {documentos: {include: {documento: true}}, subtareas: {orderBy: {creadoEn: 'asc'}}}
    });
    // Documentos vinculados a cada tarea y señal «por vencer» (SWR-SEG-015).
    return tareas.map(({documentos, ...tarea}) => ({...tarea, documentos: documentos.map(({documento}) => {
      const fechaVencimiento = documento.fechaVencimiento?.toISOString().slice(0, 10) ?? null;
      return {id: documento.id, identificacion: documento.identificacion, vigencia: documento.vigencia, fechaVencimiento,
        porVencer: documento.vigencia === 'fecha' && porVencer(fechaVencimiento, hoy)};
    })}));
  }
  async create(usuarioId: string, viajeId: string, input: TareaDto) {
    await this.viajes.get(usuarioId, viajeId);
    return this.prisma.tarea.create({data: {
      descripcion: input.descripcion, viajeId, estado: 'pendiente', orden: await this.siguienteOrden(viajeId),
      fechaLimite: aFecha(input.fechaLimite), ...sinUndefined({comentario: input.comentario, responsable: input.responsable, recurrente: input.recurrente})
    }});
  }
  async update(usuarioId: string, id: string, input: EstadoDto) {
    const tarea = await this.tareaPropia(usuarioId, id);
    return this.prisma.tarea.update({where: {id: tarea.id}, data: {estado: input.estado}});
  }
  // SWR-CHK-003, 008, 009, 012, 013: modificar descripción y datos de una tarea propia.
  async edit(usuarioId: string, id: string, input: TareaEdicionDto) {
    await this.tareaPropia(usuarioId, id);
    const {fechaLimite, ...resto} = input;
    return this.prisma.tarea.update({where: {id}, data: {...sinUndefined(resto), fechaLimite: aFecha(fechaLimite)}});
  }
  // SWR-CHK-006 / SWR-CHK-007: crea tareas pendientes desde una plantilla; después se editan libremente.
  plantillas() { return PLANTILLAS; }
  async aplicarPlantilla(usuarioId: string, viajeId: string, plantillaId: string) {
    await this.viajes.get(usuarioId, viajeId);
    const plantilla = buscarPlantilla(plantillaId);
    if (!plantilla) throw new NotFoundException('Plantilla no encontrada.');
    const inicio = await this.siguienteOrden(viajeId);
    await this.prisma.tarea.createMany({data: plantilla.tareas.map((descripcion, i) => ({descripcion, viajeId, estado: 'pendiente' as const, orden: inicio + i}))});
    return this.list(usuarioId, viajeId);
  }
  // SWR-CHK-011: el cliente envía el orden completo; debe ser exactamente el conjunto de tareas del viaje.
  async ordenar(usuarioId: string, viajeId: string, ids: string[]) {
    await this.viajes.get(usuarioId, viajeId);
    const actuales = new Set((await this.prisma.tarea.findMany({where: {viajeId}, select: {id: true}})).map((tarea) => tarea.id));
    if (ids.length !== actuales.size || new Set(ids).size !== ids.length || ids.some((id) => !actuales.has(id))) {
      throw new BadRequestException('La lista debe contener exactamente las tareas del viaje.');
    }
    for (let orden = 0; orden < ids.length; orden++) await this.prisma.tarea.update({where: {id: ids[orden]}, data: {orden}});
    return this.list(usuarioId, viajeId);
  }
  // SWR-CHK-010 / SWR-DATA-007 / SWR-SEG-017: las subtareas no cuentan para el progreso.
  async crearSubtarea(usuarioId: string, tareaId: string, input: SubtareaDto) {
    await this.tareaPropia(usuarioId, tareaId);
    return this.prisma.subtarea.create({data: {tareaId, descripcion: input.descripcion}});
  }
  private async subtareaPropia(usuarioId: string, id: string) {
    const subtarea = await this.prisma.subtarea.findFirst({where: {id, tarea: {viaje: {mascota: {usuarioId}}}}, select: {id: true}});
    if (!subtarea) throw new NotFoundException('Subtarea no encontrada.');
  }
  async editarSubtarea(usuarioId: string, id: string, input: SubtareaEdicionDto) {
    await this.subtareaPropia(usuarioId, id);
    return this.prisma.subtarea.update({where: {id}, data: sinUndefined(input)});
  }
  async quitarSubtarea(usuarioId: string, id: string) {
    await this.subtareaPropia(usuarioId, id);
    await this.prisma.subtarea.delete({where: {id}});
    return {eliminada: true};
  }
}
