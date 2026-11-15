import {Transform} from 'class-transformer';
import {IsNotEmpty, IsString} from 'class-validator';
import {applyDecorators} from '@nestjs/common';

export function TextoRequerido() {
  return applyDecorators(
    Transform(({value}: {value: unknown}) => typeof value === 'string' ? value.trim() : value),
    IsString(), IsNotEmpty({message: 'Completa los campos obligatorios.'})
  );
}
