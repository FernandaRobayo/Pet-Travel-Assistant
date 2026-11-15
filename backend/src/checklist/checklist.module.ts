import {Body, Controller, Get, Module, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards} from '@nestjs/common';
import {AuthGuard, AuthRequest} from '../auth/auth.guard';
import {ViajesModule} from '../viajes/viajes.module';
import {EstadoDto, TareaDto} from './checklist.dto';
import {ChecklistService} from './checklist.service';

@Controller() @UseGuards(AuthGuard)
class ChecklistController {
  constructor(private readonly service: ChecklistService) {}
  @Get('viajes/:id/tareas') list(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) { return this.service.list(request.usuarioId, id); }
  @Post('viajes/:id/tareas') create(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: TareaDto) { return this.service.create(request.usuarioId, id, input); }
  @Patch('tareas/:id/estado') update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: EstadoDto) { return this.service.update(request.usuarioId, id, input); }
}

@Module({imports: [ViajesModule], controllers: [ChecklistController], providers: [ChecklistService]})
export class ChecklistModule {}
