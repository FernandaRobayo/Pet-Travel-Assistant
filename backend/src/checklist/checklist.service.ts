import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {ViajesService} from '../viajes/viajes.service';
import {EstadoDto, TareaDto} from './checklist.dto';

@Injectable()
export class ChecklistService {
  constructor(private readonly prisma: PrismaService, private readonly viajes: ViajesService) {}
  async list(usuarioId: string, viajeId: string) {
    await this.viajes.get(usuarioId, viajeId);
    return this.prisma.tarea.findMany({where: {viajeId}, orderBy: {id: 'asc'}});
  }
  async create(usuarioId: string, viajeId: string, input: TareaDto) {
    await this.viajes.get(usuarioId, viajeId);
    return this.prisma.tarea.create({data: {descripcion: input.descripcion, viajeId, estado: 'pendiente'}});
  }
  async update(usuarioId: string, id: string, input: EstadoDto) {
    const tarea = await this.prisma.tarea.findFirst({where: {id, viaje: {mascota: {usuarioId}}}, select: {id: true}});
    if (!tarea) throw new NotFoundException('Tarea no encontrada.');
    return this.prisma.tarea.update({where: {id: tarea.id}, data: {estado: input.estado}});
  }
}
