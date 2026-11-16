import {IsOptional} from 'class-validator';
import {EnteroOpcional, NumeroOpcional, TextoOpcional, TextoRequerido} from '../common/texto';

// Incremento 2 (SWR-MAS-005, 006, 008, 009, 010): datos opcionales de la mascota.
export class MascotaExtrasDto {
  @TextoOpcional(60) especie?: string | null;
  @TextoOpcional(60) raza?: string | null;
  @EnteroOpcional(0, 60) edad?: number | null;
  @NumeroOpcional(0, 500) peso?: number | null;
  @TextoOpcional(1000) notas?: string | null;
  @TextoOpcional(120) veterinarioNombre?: string | null;
  @TextoOpcional(30) veterinarioTelefono?: string | null;
  @TextoOpcional(200) contactoEmergencia?: string | null;
  @TextoOpcional(1000) medicacion?: string | null;
}

export class MascotaDto extends MascotaExtrasDto {
  @TextoRequerido() nombre!: string;
}

export class MascotaEdicionDto extends MascotaExtrasDto {
  @IsOptional() @TextoRequerido() nombre?: string;
}
