import {IsDateString, IsUUID, Matches} from 'class-validator';
import {TextoRequerido} from '../common/texto';

export class ViajeDto {
  @TextoRequerido() origen!: string;
  @TextoRequerido() destino!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {message: 'Usa una fecha válida YYYY-MM-DD.'})
  @IsDateString({strict: true}, {message: 'La fecha de salida no es válida.'})
  fechaSalida!: string;
  @IsUUID() mascotaId!: string;
}
