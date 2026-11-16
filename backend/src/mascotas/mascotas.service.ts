import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {LIMITE_FOTO, TIPOS_FOTO, validarArchivo, type ArchivoSubido} from '../common/archivos';
import {sinUndefined} from '../common/texto';
import {MascotaDto, MascotaEdicionDto} from './mascotas.dto';

const SELECT = {
  id: true, nombre: true, especie: true, raza: true, edad: true, peso: true, notas: true,
  veterinarioNombre: true, veterinarioTelefono: true, contactoEmergencia: true, medicacion: true,
  foto: {select: {mascotaId: true}}
} as const;

function vista<T extends {foto: {mascotaId: string} | null}>(mascota: T) {
  const {foto, ...resto} = mascota;
  return {...resto, tieneFoto: foto !== null};
}

@Injectable()
export class MascotasService {
  constructor(private readonly prisma: PrismaService) {}
  private async propia(usuarioId: string, id: string) {
    const mascota = await this.prisma.mascota.findFirst({where: {id, usuarioId}, select: {id: true}});
    if (!mascota) throw new NotFoundException('Mascota no encontrada.');
    return mascota;
  }
  async list(usuarioId: string) {
    const mascotas = await this.prisma.mascota.findMany({where: {usuarioId}, select: SELECT, orderBy: {nombre: 'asc'}});
    return mascotas.map(vista);
  }
  async create(usuarioId: string, input: MascotaDto) {
    const {nombre, ...extras} = input;
    return vista(await this.prisma.mascota.create({data: {nombre, usuarioId, ...sinUndefined(extras)}, select: SELECT}));
  }
  async update(usuarioId: string, id: string, input: MascotaEdicionDto) {
    await this.propia(usuarioId, id);
    return vista(await this.prisma.mascota.update({where: {id}, data: sinUndefined(input), select: SELECT}));
  }
  // SWR-MAS-007 / SWR-DATA-006: una foto por mascota; subir otra reemplaza la anterior.
  async guardarFoto(usuarioId: string, id: string, file: ArchivoSubido | undefined) {
    await this.propia(usuarioId, id);
    const f = validarArchivo(file, TIPOS_FOTO, LIMITE_FOTO, 'La foto debe ser JPG o PNG.');
    await this.prisma.fotoMascota.upsert({
      where: {mascotaId: id},
      create: {mascotaId: id, nombre: f.nombre, tipo: f.tipo, datos: f.datos},
      update: {nombre: f.nombre, tipo: f.tipo, datos: f.datos}
    });
    return {tieneFoto: true};
  }
  async foto(usuarioId: string, id: string) {
    const foto = await this.prisma.fotoMascota.findFirst({where: {mascotaId: id, mascota: {usuarioId}}});
    if (!foto) throw new NotFoundException('La mascota no tiene foto.');
    return foto;
  }
}
