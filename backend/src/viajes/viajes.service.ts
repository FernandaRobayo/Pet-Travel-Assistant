import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {ViajeDto} from './viajes.dto';

@Injectable()
export class ViajesService {
  constructor(private readonly prisma: PrismaService) {}
  list(usuarioId: string) {
    return this.prisma.viaje.findMany({where: {mascota: {usuarioId}}, include: {mascota: {select: {id: true, nombre: true}}}, orderBy: {fechaSalida: 'asc'}});
  }
  async get(usuarioId: string, id: string) {
    const viaje = await this.prisma.viaje.findFirst({where: {id, mascota: {usuarioId}}, include: {mascota: {select: {id: true, nombre: true}}}});
    if (!viaje) throw new NotFoundException('Viaje no encontrado.');
    return viaje;
  }
  async create(usuarioId: string, input: ViajeDto) {
    const mascota = await this.prisma.mascota.findFirst({where: {id: input.mascotaId, usuarioId}, select: {id: true}});
    if (!mascota) throw new NotFoundException('Mascota no encontrada.');
    return this.prisma.viaje.create({data: {...input, fechaSalida: new Date(`${input.fechaSalida}T00:00:00.000Z`)}, include: {mascota: {select: {id: true, nombre: true}}}});
  }
}
