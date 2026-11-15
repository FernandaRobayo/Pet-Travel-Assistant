import {TextoRequerido} from '../common/texto';

export class MascotaDto {
  @TextoRequerido() nombre!: string;
}
