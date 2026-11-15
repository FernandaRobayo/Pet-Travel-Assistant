import {Controller, Get, Injectable, Module, Param, ParseUUIDPipe, Req, UseGuards} from '@nestjs/common';
import {AuthGuard, AuthRequest} from '../auth/auth.guard';
import {PrismaService} from '../prisma/prisma.service';
import {calcularSeguimiento} from '../domain/seguimiento';
import {ViajesModule} from '../viajes/viajes.module';
import {ViajesService} from '../viajes/viajes.service';

@Injectable()
class SeguimientoService {
  constructor(private readonly prisma: PrismaService, private readonly viajes: ViajesService) {}
  async get(usuarioId: string, viajeId: string) {
    const viaje = await this.viajes.get(usuarioId, viajeId);
    const tareas = await this.prisma.tarea.findMany({where: {viajeId}, include: {documentos: {include: {documento: true}}}});
    return calcularSeguimiento({
      fechaSalida: viaje.fechaSalida.toISOString().slice(0,10), tareas,
      vinculos: tareas.flatMap(t => t.documentos.map(v => ({documentoId: v.documentoId, tareaId: t.id}))),
      documentos: tareas.flatMap(t => t.documentos.map(v => ({...v.documento, fechaVencimiento: v.documento.fechaVencimiento?.toISOString().slice(0,10) ?? null})))
    });
  }
}

@Controller('viajes') @UseGuards(AuthGuard)
class SeguimientoController {
  constructor(private readonly service: SeguimientoService) {}
  @Get(':id/seguimiento') get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {return this.service.get(request.usuarioId, id);}
}

@Module({imports: [ViajesModule], controllers: [SeguimientoController], providers: [SeguimientoService]})
export class SeguimientoModule {}
