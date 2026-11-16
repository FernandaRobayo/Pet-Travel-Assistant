import {Body, Controller, Delete, Get, Module, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards} from '@nestjs/common';
import {AuthGuard, AuthRequest} from '../auth/auth.guard';
import {ViajesModule} from '../viajes/viajes.module';
import {EstadoDto, OrdenDto, PlantillaDto, SubtareaDto, SubtareaEdicionDto, TareaDto, TareaEdicionDto} from './checklist.dto';
import {ChecklistService} from './checklist.service';

@Controller() @UseGuards(AuthGuard)
class ChecklistController {
  constructor(private readonly service: ChecklistService) {}
  @Get('plantillas') plantillas() { return this.service.plantillas(); }
  @Get('viajes/:id/tareas') list(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) { return this.service.list(request.usuarioId, id); }
  @Post('viajes/:id/tareas') create(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: TareaDto) { return this.service.create(request.usuarioId, id, input); }
  @Post('viajes/:id/tareas/plantilla') plantilla(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: PlantillaDto) { return this.service.aplicarPlantilla(request.usuarioId, id, input.plantillaId); }
  @Patch('viajes/:id/tareas/orden') ordenar(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: OrdenDto) { return this.service.ordenar(request.usuarioId, id, input.ids); }
  @Patch('tareas/:id') edit(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: TareaEdicionDto) { return this.service.edit(request.usuarioId, id, input); }
  @Patch('tareas/:id/estado') update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: EstadoDto) { return this.service.update(request.usuarioId, id, input); }
  @Post('tareas/:id/subtareas') crearSubtarea(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: SubtareaDto) { return this.service.crearSubtarea(request.usuarioId, id, input); }
  @Patch('subtareas/:id') editarSubtarea(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: SubtareaEdicionDto) { return this.service.editarSubtarea(request.usuarioId, id, input); }
  @Delete('subtareas/:id') quitarSubtarea(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) { return this.service.quitarSubtarea(request.usuarioId, id); }
}

@Module({imports: [ViajesModule], controllers: [ChecklistController], providers: [ChecklistService]})
export class ChecklistModule {}
