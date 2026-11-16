import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {LIMITE_ARCHIVO, TIPOS_REGLAS, validarArchivo, type ArchivoSubido} from '../common/archivos';
import {aFecha, sinUndefined} from '../common/texto';
import {TramoDto, ViajeDto, ViajeEdicionDto} from './viajes.dto';

const MASCOTA = {mascota: {select: {id: true, nombre: true}}} as const;

@Injectable()
export class ViajesService {
  constructor(private readonly prisma: PrismaService) {}
  list(usuarioId: string) {
    return this.prisma.viaje.findMany({where: {mascota: {usuarioId}}, include: MASCOTA, orderBy: {fechaSalida: 'asc'}});
  }
  async get(usuarioId: string, id: string) {
    const viaje = await this.prisma.viaje.findFirst({where: {id, mascota: {usuarioId}}, include: {
      ...MASCOTA,
      tramos: {orderBy: [{orden: 'asc'}, {fecha: 'asc'}]},
      reglas: {select: {transportador: true, nombre: true, tamano: true, actualizadoEn: true}}
    }});
    if (!viaje) throw new NotFoundException('Viaje no encontrado.');
    return viaje;
  }
  async create(usuarioId: string, input: ViajeDto) {
    const {origen, destino, fechaSalida, mascotaId, ...extras} = input;
    const mascota = await this.prisma.mascota.findFirst({where: {id: mascotaId, usuarioId}, select: {id: true}});
    if (!mascota) throw new NotFoundException('Mascota no encontrada.');
    const viaje = await this.prisma.viaje.create({data: {origen, destino, fechaSalida: aFecha(fechaSalida) as Date, mascotaId, ...sinUndefined(extras)}, include: MASCOTA});
    await this.copiarRecurrentes(usuarioId, viaje.id);
    return viaje;
  }
  // SWR-CHK-014: las tareas recurrentes del usuario entran como pendientes en el checklist del viaje nuevo.
  private async copiarRecurrentes(usuarioId: string, viajeId: string) {
    const previas = await this.prisma.tarea.findMany({
      where: {recurrente: true, viajeId: {not: viajeId}, viaje: {mascota: {usuarioId}}},
      select: {descripcion: true}, orderBy: {id: 'asc'}
    });
    const unicas = [...new Set(previas.map((tarea) => tarea.descripcion))];
    if (!unicas.length) return;
    await this.prisma.tarea.createMany({data: unicas.map((descripcion, orden) => ({descripcion, viajeId, estado: 'pendiente' as const, recurrente: true, orden}))});
  }
  async update(usuarioId: string, id: string, input: ViajeEdicionDto) {
    await this.get(usuarioId, id);
    const {origen, destino, fechaSalida, ...extras} = input;
    // Un viaje que deja de estar finalizado deja de estar archivado.
    const desarchivar = extras.etapa !== undefined && extras.etapa !== 'finalizado' ? {archivado: false} : {};
    return this.prisma.viaje.update({where: {id}, data: {origen, destino, fechaSalida: aFecha(fechaSalida) as Date, ...sinUndefined(extras), ...desarchivar}, include: MASCOTA});
  }
  // SWR-VIA-013: solo un viaje finalizado se archiva.
  async archivar(usuarioId: string, id: string, archivado: boolean) {
    const viaje = await this.get(usuarioId, id);
    if (archivado && viaje.etapa !== 'finalizado') throw new BadRequestException('Solo se puede archivar un viaje finalizado.');
    return this.prisma.viaje.update({where: {id}, data: {archivado}, include: MASCOTA});
  }
  // SWR-VIA-010
  async agregarTramo(usuarioId: string, viajeId: string, input: TramoDto) {
    await this.get(usuarioId, viajeId);
    const max = await this.prisma.tramo.aggregate({where: {viajeId}, _max: {orden: true}});
    return this.prisma.tramo.create({data: {viajeId, origen: input.origen, destino: input.destino, fecha: aFecha(input.fecha) as Date, orden: (max._max.orden ?? -1) + 1}});
  }
  async quitarTramo(usuarioId: string, viajeId: string, tramoId: string) {
    await this.get(usuarioId, viajeId);
    const result = await this.prisma.tramo.deleteMany({where: {id: tramoId, viajeId}});
    if (!result.count) throw new NotFoundException('Tramo no encontrado.');
    return {eliminado: true};
  }
  // SWR-REG-001, 002, 003, 005 / SWR-DATA-004: un PDF de reglas por viaje; subir otro lo reemplaza.
  // SWR-REG-006 / SWR-CON-001: el contenido nunca se lee para generar tareas, avisos ni estados.
  async guardarReglas(usuarioId: string, viajeId: string, transportador: string, file: ArchivoSubido | undefined) {
    await this.get(usuarioId, viajeId);
    const f = validarArchivo(file, TIPOS_REGLAS, LIMITE_ARCHIVO, 'Solo se aceptan archivos en formato PDF.');
    return this.prisma.reglasViaje.upsert({
      where: {viajeId},
      create: {viajeId, transportador, nombre: f.nombre, tamano: f.tamano, datos: f.datos},
      update: {transportador, nombre: f.nombre, tamano: f.tamano, datos: f.datos, actualizadoEn: new Date()},
      select: {transportador: true, nombre: true, tamano: true, actualizadoEn: true}
    });
  }
  // SWR-REG-004
  async reglas(usuarioId: string, viajeId: string) {
    const reglas = await this.prisma.reglasViaje.findFirst({where: {viajeId, viaje: {mascota: {usuarioId}}}});
    if (!reglas) throw new NotFoundException('El viaje no tiene PDF de reglas.');
    return reglas;
  }
}
