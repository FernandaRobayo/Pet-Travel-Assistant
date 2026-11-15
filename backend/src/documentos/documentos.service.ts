import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {validarVinculo} from '../domain/seguimiento';
import {DocumentoDto} from './documentos.dto';

@Injectable()
export class DocumentosService {
  constructor(private readonly prisma: PrismaService) {}
  private async mascota(usuarioId: string, id: string) {
    const mascota = await this.prisma.mascota.findFirst({where: {id, usuarioId}, select: {id: true}});
    if (!mascota) throw new NotFoundException('Mascota no encontrada.');
    return mascota;
  }
  async list(usuarioId: string, mascotaId: string) {
    await this.mascota(usuarioId, mascotaId);
    return this.prisma.documento.findMany({where: {mascotaId}, orderBy: {identificacion: 'asc'}});
  }
  async create(usuarioId: string, mascotaId: string, input: DocumentoDto) {
    await this.mascota(usuarioId, mascotaId);
    if (input.vigencia !== 'fecha' && input.fechaVencimiento !== undefined) throw new BadRequestException('Solo la vigencia con fecha admite fecha de vencimiento.');
    return this.prisma.documento.create({data: {
      identificacion: input.identificacion, vigencia: input.vigencia, mascotaId,
      fechaVencimiento: input.fechaVencimiento ? new Date(`${input.fechaVencimiento}T00:00:00.000Z`) : null
    }});
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
}
