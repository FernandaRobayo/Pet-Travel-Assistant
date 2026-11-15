import {Body, Controller, Get, Module, Param, ParseUUIDPipe, Post, Req, UseGuards} from '@nestjs/common';
import {AuthGuard, AuthRequest} from '../auth/auth.guard';
import {ViajeDto} from './viajes.dto';
import {ViajesService} from './viajes.service';

@Controller('viajes') @UseGuards(AuthGuard)
class ViajesController {
  constructor(private readonly service: ViajesService) {}
  @Get() list(@Req() request: AuthRequest) { return this.service.list(request.usuarioId); }
  @Get(':id') get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) { return this.service.get(request.usuarioId, id); }
  @Post() create(@Req() request: AuthRequest, @Body() input: ViajeDto) { return this.service.create(request.usuarioId, input); }
}

@Module({controllers: [ViajesController], providers: [ViajesService], exports: [ViajesService]})
export class ViajesModule {}
