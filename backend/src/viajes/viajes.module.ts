import {Body, Controller, Delete, Get, Module, Param, ParseUUIDPipe, Patch, Post, Req, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {Response} from 'express';
import {AuthGuard, AuthRequest} from '../auth/auth.guard';
import {ArchivoSubido, LIMITE_ARCHIVO, disposicion} from '../common/archivos';
import {ArchivarDto, ReglasDto, TramoDto, ViajeDto, ViajeEdicionDto} from './viajes.dto';
import {ViajesService} from './viajes.service';

@Controller('viajes') @UseGuards(AuthGuard)
class ViajesController {
  constructor(private readonly service: ViajesService) {}
  @Get() list(@Req() request: AuthRequest) { return this.service.list(request.usuarioId); }
  @Get(':id') get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) { return this.service.get(request.usuarioId, id); }
  @Post() create(@Req() request: AuthRequest, @Body() input: ViajeDto) { return this.service.create(request.usuarioId, input); }
  @Patch(':id') update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: ViajeEdicionDto) { return this.service.update(request.usuarioId, id, input); }
  @Patch(':id/archivo') archivar(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: ArchivarDto) { return this.service.archivar(request.usuarioId, id, input.archivado); }
  @Post(':id/tramos') agregarTramo(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: TramoDto) { return this.service.agregarTramo(request.usuarioId, id, input); }
  @Delete(':id/tramos/:tramoId') quitarTramo(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Param('tramoId', ParseUUIDPipe) tramoId: string) { return this.service.quitarTramo(request.usuarioId, id, tramoId); }
  @Post(':id/reglas') @UseInterceptors(FileInterceptor('archivo', {limits: {fileSize: LIMITE_ARCHIVO}}))
  guardarReglas(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: ReglasDto, @UploadedFile() archivo: ArchivoSubido | undefined) {
    return this.service.guardarReglas(request.usuarioId, id, input.transportador, archivo);
  }
  @Get(':id/reglas')
  async reglas(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Res({passthrough: true}) res: Response) {
    const reglas = await this.service.reglas(request.usuarioId, id);
    res.set({'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store'});
    return new StreamableFile(Buffer.from(reglas.datos), {type: 'application/pdf', disposition: disposicion(reglas.nombre, false)});
  }
}

@Module({controllers: [ViajesController], providers: [ViajesService], exports: [ViajesService]})
export class ViajesModule {}
