import {Transform} from 'class-transformer';
import {IsBoolean, IsDateString, IsEnum, IsOptional, IsUUID, Matches, MaxLength} from 'class-validator';
import {EtapaViaje, Transporte} from '@prisma/client';
import {TextoOpcional, TextoRequerido} from '../common/texto';

const vacioANulo = ({value}: {value: unknown}) => value === '' ? null : value;

// Incremento 2 (SWR-VIA-007, 008, 009, 011, 012): datos opcionales del viaje.
export class ViajeExtrasDto {
  @Transform(vacioANulo) @IsOptional() @IsEnum(Transporte, {message: 'El transporte debe ser avión, bus, carro u otro.'}) transporte?: Transporte | null;
  @TextoOpcional(80) aerolinea?: string | null;
  @TextoOpcional(20) numeroVuelo?: string | null;
  @Transform(vacioANulo) @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {message: 'Usa una hora válida HH:MM.'}) horaSalida?: string | null;
  @TextoOpcional(120) aeropuerto?: string | null;
  @TextoOpcional(120) alojamientoNombre?: string | null;
  @TextoOpcional(200) alojamientoDireccion?: string | null;
  @TextoOpcional(60) alojamientoConfirmacion?: string | null;
  @IsOptional() @IsEnum(EtapaViaje, {message: 'La etapa debe ser planificado, en_preparacion, en_curso o finalizado.'}) etapa?: EtapaViaje;
}

export class ViajeDto extends ViajeExtrasDto {
  @TextoRequerido() origen!: string;
  @TextoRequerido() destino!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {message: 'Usa una fecha válida YYYY-MM-DD.'})
  @IsDateString({strict: true}, {message: 'La fecha de salida no es válida.'})
  fechaSalida!: string;
  @IsUUID() mascotaId!: string;
}

// Incremento extra (SWR-VIA-006). Supuesto: la mascota de un viaje no se cambia al editarlo,
// para no romper los vínculos documento–tarea de la misma mascota.
export class ViajeEdicionDto extends ViajeExtrasDto {
  @TextoRequerido() origen!: string;
  @TextoRequerido() destino!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {message: 'Usa una fecha válida YYYY-MM-DD.'})
  @IsDateString({strict: true}, {message: 'La fecha de salida no es válida.'})
  fechaSalida!: string;
}

// SWR-VIA-010
export class TramoDto {
  @TextoRequerido() @MaxLength(120) origen!: string;
  @TextoRequerido() @MaxLength(120) destino!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {message: 'Usa una fecha válida YYYY-MM-DD.'})
  @IsDateString({strict: true}, {message: 'La fecha del tramo no es válida.'})
  fecha!: string;
}

// SWR-VIA-013
export class ArchivarDto {
  @IsBoolean() archivado!: boolean;
}

// SWR-REG-003: el nombre del transportador es obligatorio.
export class ReglasDto {
  @TextoRequerido() @MaxLength(80) transportador!: string;
}
