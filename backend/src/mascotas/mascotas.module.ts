import {Body, Controller, Get, Module, Param, ParseUUIDPipe, Patch, Post, Req, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {Response} from 'express';
import {AuthGuard, AuthRequest} from '../auth/auth.guard';
import {ArchivoSubido, LIMITE_FOTO, disposicion} from '../common/archivos';
import {MascotaDto, MascotaEdicionDto} from './mascotas.dto';
import {MascotasService} from './mascotas.service';

@Controller('mascotas') @UseGuards(AuthGuard)
class MascotasController {
  constructor(private readonly service: MascotasService) {}
  @Get() list(@Req() request: AuthRequest) { return this.service.list(request.usuarioId); }
  @Post() create(@Req() request: AuthRequest, @Body() input: MascotaDto) { return this.service.create(request.usuarioId, input); }
  @Patch(':id') update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: MascotaEdicionDto) { return this.service.update(request.usuarioId, id, input); }
  @Post(':id/foto') @UseInterceptors(FileInterceptor('archivo', {limits: {fileSize: LIMITE_FOTO}}))
  subirFoto(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @UploadedFile() archivo: ArchivoSubido | undefined) {
    return this.service.guardarFoto(request.usuarioId, id, archivo);
  }
  @Get(':id/foto')
  async foto(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Res({passthrough: true}) res: Response) {
    const foto = await this.service.foto(request.usuarioId, id);
    res.set({'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store'});
    return new StreamableFile(Buffer.from(foto.datos), {type: foto.tipo, disposition: disposicion(foto.nombre, false)});
  }
}

@Module({controllers: [MascotasController], providers: [MascotasService]})
export class MascotasModule {}
