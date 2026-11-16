import {ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength} from 'class-validator';
import {EstadoTarea} from '@prisma/client';
import {FechaOpcional, TextoOpcional, TextoRequerido} from '../common/texto';

// Incremento 2 (SWR-CHK-008, 009, 012, 013): fecha límite, comentario, responsable y recurrencia.
export class TareaExtrasDto {
  @FechaOpcional() fechaLimite?: string | null;
  @TextoOpcional(1000) comentario?: string | null;
  @TextoOpcional(120) responsable?: string | null;
  @IsOptional() @IsBoolean({message: 'Recurrente debe ser verdadero o falso.'}) recurrente?: boolean;
}
export class TareaDto extends TareaExtrasDto {
  @TextoRequerido() descripcion!: string;
}
export class TareaEdicionDto extends TareaExtrasDto {
  @IsOptional() @TextoRequerido() descripcion?: string;
}
export class EstadoDto {
  @IsEnum(EstadoTarea, {message: 'El estado debe ser pendiente, completa o requiere_revision.'})
  estado!: EstadoTarea;
}
// SWR-CHK-010
export class SubtareaDto {
  @TextoRequerido() @MaxLength(200) descripcion!: string;
}
export class SubtareaEdicionDto {
  @IsOptional() @TextoRequerido() @MaxLength(200) descripcion?: string;
  @IsOptional() @IsBoolean() completa?: boolean;
}
// SWR-CHK-011
export class OrdenDto {
  @IsArray() @ArrayMaxSize(500) @IsUUID('all', {each: true}) ids!: string[];
}
// SWR-CHK-006
export class PlantillaDto {
  @IsString() @MaxLength(40) plantillaId!: string;
}
