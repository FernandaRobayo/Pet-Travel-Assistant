import {Body, Controller, Delete, Get, Module, Param, ParseUUIDPipe, Patch, Post, Req, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {Response} from 'express';
import {AuthGuard, AuthRequest} from '../auth/auth.guard';
import {ArchivoSubido, LIMITE_ARCHIVO, disposicion} from '../common/archivos';
import {DocumentoDto, VinculoDto} from './documentos.dto';
import {DocumentosService} from './documentos.service';

const SUBIDA = FileInterceptor('archivo', {limits: {fileSize: LIMITE_ARCHIVO}});

@Controller() @UseGuards(AuthGuard)
class DocumentosController {
  constructor(private readonly service: DocumentosService) {}
  @Get('documentos/proximo-viaje') proximoViaje(@Req() request: AuthRequest) {return this.service.proximoViaje(request.usuarioId);}
  @Get('mascotas/:id/documentos') list(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {return this.service.list(request.usuarioId, id);}
  @Post('mascotas/:id/documentos') create(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: DocumentoDto) {return this.service.create(request.usuarioId, id, input);}
  @Patch('documentos/:id') update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: DocumentoDto) {return this.service.update(request.usuarioId, id, input);}
  @Delete('tareas/:tareaId/documentos/:documentoId') unlink(@Req() request: AuthRequest, @Param('tareaId', ParseUUIDPipe) tareaId: string, @Param('documentoId', ParseUUIDPipe) documentoId: string) {return this.service.unlink(request.usuarioId, tareaId, documentoId);}
  @Post('tareas/:id/documentos') link(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: VinculoDto) {return this.service.link(request.usuarioId, id, input.documentoId);}
  @Get('documentos/:id/archivos') archivos(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {return this.service.archivos(request.usuarioId, id);}
  @Post('documentos/:id/archivos') @UseInterceptors(SUBIDA)
  subir(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @UploadedFile() archivo: ArchivoSubido | undefined) {return this.service.subirArchivo(request.usuarioId, id, archivo);}
  @Post('archivos/:id/reemplazo') @UseInterceptors(SUBIDA)
  reemplazar(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @UploadedFile() archivo: ArchivoSubido | undefined) {return this.service.reemplazarArchivo(request.usuarioId, id, archivo);}
  @Delete('archivos/:id') eliminar(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {return this.service.eliminarArchivo(request.usuarioId, id);}
  @Get('archivos/:id/versiones') versiones(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {return this.service.versiones(request.usuarioId, id);}
  @Get('archivos/:id/contenido')
  async contenido(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Res({passthrough: true}) res: Response) {
    const archivo = await this.service.contenido(request.usuarioId, id);
    res.set({'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store'});
    return new StreamableFile(Buffer.from(archivo.datos), {type: archivo.tipo, disposition: disposicion(archivo.nombre, false)});
  }
}

@Module({controllers: [DocumentosController], providers: [DocumentosService]})
export class DocumentosModule {}
