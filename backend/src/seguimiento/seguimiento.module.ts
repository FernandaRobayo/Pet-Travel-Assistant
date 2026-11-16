import {Controller, Get, Injectable, Module, Param, ParseUUIDPipe, Req, Res, StreamableFile, UseGuards} from '@nestjs/common';
import {Response} from 'express';
import {AuthGuard, AuthRequest} from '../auth/auth.guard';
import {PrismaService} from '../prisma/prisma.service';
import {calcularSeguimiento, fechaHoy} from '../domain/seguimiento';
import {generarPdf, type LineaPdf} from '../common/pdf';
import {ViajesModule} from '../viajes/viajes.module';
import {ViajesService} from '../viajes/viajes.service';

const ESTADO: Record<string, string> = {pendiente: '[ ]', completa: '[x]', requiere_revision: '[!]'};
const dia = (fecha: Date | null) => fecha ? fecha.toISOString().slice(0, 10) : '';

@Injectable()
class SeguimientoService {
  constructor(private readonly prisma: PrismaService, private readonly viajes: ViajesService) {}
  async get(usuarioId: string, viajeId: string) {
    const viaje = await this.viajes.get(usuarioId, viajeId);
    const tareas = await this.prisma.tarea.findMany({where: {viajeId}, include: {documentos: {include: {documento: true}}}});
    // Las subtareas no se consultan: no cuentan para el progreso (SWR-SEG-017).
    return calcularSeguimiento({
      fechaSalida: viaje.fechaSalida.toISOString().slice(0,10), hoy: fechaHoy(), tareas,
      vinculos: tareas.flatMap(t => t.documentos.map(v => ({documentoId: v.documentoId, tareaId: t.id}))),
      documentos: tareas.flatMap(t => t.documentos.map(v => ({...v.documento, fechaVencimiento: v.documento.fechaVencimiento?.toISOString().slice(0,10) ?? null})))
    });
  }
  // SWR-CHK-015 / DP-19 (Supuesto): PDF de texto con encabezado, resumen, tareas con sus datos, documentos vinculados y avisos.
  async exportarPdf(usuarioId: string, viajeId: string) {
    const viaje = await this.viajes.get(usuarioId, viajeId);
    const seg = await this.get(usuarioId, viajeId);
    const tareas = await this.prisma.tarea.findMany({
      where: {viajeId}, orderBy: [{orden: 'asc'}, {id: 'asc'}],
      include: {subtareas: {orderBy: {creadoEn: 'asc'}}, documentos: {include: {documento: true}}}
    });
    const lineas: LineaPdf[] = [
      {texto: 'Checklist del viaje', tam: 18, negrita: true}, {texto: ''},
      {texto: `Mascota: ${viaje.mascota.nombre}`}, {texto: `Ruta: ${viaje.origen} - ${viaje.destino}`},
      {texto: `Fecha de salida: ${dia(viaje.fechaSalida)}`},
      {texto: `Estado general: ${seg.estadoGeneral}`},
      {texto: `Progreso: ${seg.progreso === null ? 'Sin elementos' : `${seg.progreso}% (${seg.tareasCompletas} de ${seg.totalTareas} tareas)`}`},
      {texto: ''}, {texto: 'Tareas', tam: 14, negrita: true}
    ];
    if (!tareas.length) lineas.push({texto: 'Este viaje todavia no tiene tareas.'});
    for (const tarea of tareas) {
      lineas.push({texto: `${ESTADO[tarea.estado]} ${tarea.descripcion}`, negrita: true});
      const detalle = [tarea.fechaLimite && `Fecha limite: ${dia(tarea.fechaLimite)}`, tarea.responsable && `Responsable: ${tarea.responsable}`, tarea.recurrente && 'Recurrente'].filter(Boolean).join('  |  ');
      if (detalle) lineas.push({texto: detalle, tam: 10, sangria: 18});
      if (tarea.comentario) lineas.push({texto: `Comentario: ${tarea.comentario}`, tam: 10, sangria: 18});
      for (const sub of tarea.subtareas) lineas.push({texto: `${sub.completa ? '[x]' : '[ ]'} ${sub.descripcion}`, tam: 10, sangria: 18});
      for (const {documento} of tarea.documentos) {
        const vigencia = documento.vigencia === 'fecha' ? `vence ${dia(documento.fechaVencimiento)}` : documento.vigencia === 'sin_vencimiento' ? 'sin vencimiento' : 'vigencia desconocida';
        lineas.push({texto: `Documento: ${documento.identificacion} (${vigencia})`, tam: 10, sangria: 18});
      }
    }
    const avisos = [...seg.advertencias, ...seg.revisiones];
    lineas.push({texto: ''}, {texto: 'Advertencias documentales', tam: 14, negrita: true});
    if (!avisos.length) lineas.push({texto: 'Sin advertencias documentales.'});
    for (const aviso of avisos) lineas.push({texto: `${aviso.identificacion}: ${aviso.motivo}`});
    lineas.push({texto: ''}, {texto: seg.aviso, tam: 10, negrita: true});
    return {nombre: `checklist-${viaje.destino}`.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60) || 'checklist', pdf: generarPdf(lineas)};
  }
}

@Controller('viajes') @UseGuards(AuthGuard)
class SeguimientoController {
  constructor(private readonly service: SeguimientoService) {}
  @Get(':id/seguimiento') get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {return this.service.get(request.usuarioId, id);}
  @Get(':id/checklist/pdf')
  async pdf(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Res({passthrough: true}) res: Response) {
    const {nombre, pdf} = await this.service.exportarPdf(request.usuarioId, id);
    res.set({'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store'});
    return new StreamableFile(pdf, {type: 'application/pdf', disposition: `attachment; filename="${nombre}.pdf"`});
  }
}

@Module({imports: [ViajesModule], controllers: [SeguimientoController], providers: [SeguimientoService]})
export class SeguimientoModule {}
