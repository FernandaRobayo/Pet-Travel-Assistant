import {Body, Controller, Get, Module, Param, ParseUUIDPipe, Post, Req, UseGuards} from '@nestjs/common';
import {AuthGuard, AuthRequest} from '../auth/auth.guard';
import {DocumentoDto, VinculoDto} from './documentos.dto';
import {DocumentosService} from './documentos.service';

@Controller() @UseGuards(AuthGuard)
class DocumentosController {
  constructor(private readonly service: DocumentosService) {}
  @Get('mascotas/:id/documentos') list(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {return this.service.list(request.usuarioId, id);}
  @Post('mascotas/:id/documentos') create(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: DocumentoDto) {return this.service.create(request.usuarioId, id, input);}
  @Post('tareas/:id/documentos') link(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: VinculoDto) {return this.service.link(request.usuarioId, id, input.documentoId);}
}

@Module({controllers: [DocumentosController], providers: [DocumentosService]})
export class DocumentosModule {}
