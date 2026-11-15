import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {MascotaDto} from './mascotas.dto';

@Injectable()
export class MascotasService {
  constructor(private readonly prisma: PrismaService) {}
  list(usuarioId: string) {
    return this.prisma.mascota.findMany({where: {usuarioId}, select: {id: true, nombre: true}, orderBy: {nombre: 'asc'}});
  }
  create(usuarioId: string, input: MascotaDto) {
    return this.prisma.mascota.create({data: {nombre: input.nombre, usuarioId}, select: {id: true, nombre: true}});
  }
}
