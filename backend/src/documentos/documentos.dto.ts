import {IsDateString, IsEnum, IsUUID, Matches, ValidateIf} from 'class-validator';
import {TipoVigencia} from '@prisma/client';
import {TextoRequerido} from '../common/texto';

export class DocumentoDto {
  @TextoRequerido() identificacion!: string;
  @IsEnum(TipoVigencia) vigencia!: TipoVigencia;
  @ValidateIf((value: DocumentoDto) => value.vigencia === 'fecha' || value.fechaVencimiento !== undefined)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({strict: true})
  fechaVencimiento?: string;
}
export class VinculoDto {
  @IsUUID() documentoId!: string;
}
