import {IsEnum} from 'class-validator';
import {EstadoTarea} from '@prisma/client';
import {TextoRequerido} from '../common/texto';

export class TareaDto {
  @TextoRequerido() descripcion!: string;
}
export class EstadoDto {
  @IsEnum(EstadoTarea, {message: 'El estado debe ser pendiente, completa o requiere_revision.'})
  estado!: EstadoTarea;
}
