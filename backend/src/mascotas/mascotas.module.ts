import {Body, Controller, Get, Module, Post, Req, UseGuards} from '@nestjs/common';
import {AuthGuard, AuthRequest} from '../auth/auth.guard';
import {MascotaDto} from './mascotas.dto';
import {MascotasService} from './mascotas.service';

@Controller('mascotas') @UseGuards(AuthGuard)
class MascotasController {
  constructor(private readonly service: MascotasService) {}
  @Get() list(@Req() request: AuthRequest) { return this.service.list(request.usuarioId); }
  @Post() create(@Req() request: AuthRequest, @Body() input: MascotaDto) { return this.service.create(request.usuarioId, input); }
}

@Module({controllers: [MascotasController], providers: [MascotasService]})
export class MascotasModule {}
