import {Transform} from 'class-transformer';
import {IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, IsDateString, Max, MaxLength, Min} from 'class-validator';
import {applyDecorators} from '@nestjs/common';

export function TextoRequerido() {
  return applyDecorators(
    Transform(({value}: {value: unknown}) => typeof value === 'string' ? value.trim() : value),
    IsString(), IsNotEmpty({message: 'Completa los campos obligatorios.'})
  );
}

// Incremento 2: campos opcionales. Cadena vacía = «sin dato» (null); ausente = no se toca.
export function TextoOpcional(max = 200) {
  return applyDecorators(
    Transform(({value}: {value: unknown}) => typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value),
    IsOptional(), IsString(), MaxLength(max, {message: `Máximo ${max} caracteres.`})
  );
}

export function EnteroOpcional(min: number, max: number) {
  return applyDecorators(
    Transform(({value}: {value: unknown}) => value === '' ? null : value),
    IsOptional(), IsInt({message: 'Ingresa un número entero.'}), Min(min), Max(max)
  );
}

export function NumeroOpcional(min: number, max: number) {
  return applyDecorators(
    Transform(({value}: {value: unknown}) => value === '' ? null : value),
    IsOptional(), IsNumber({}, {message: 'Ingresa un número.'}), Min(min), Max(max)
  );
}

export function FechaOpcional() {
  return applyDecorators(
    Transform(({value}: {value: unknown}) => value === '' ? null : value),
    IsOptional(), Matches(/^\d{4}-\d{2}-\d{2}$/, {message: 'Usa una fecha válida YYYY-MM-DD.'}),
    IsDateString({strict: true}, {message: 'La fecha no es válida.'})
  );
}

// Quita las claves no enviadas para que PATCH solo modifique lo recibido.
export function sinUndefined<T extends object>(value: T): {[K in keyof T]?: Exclude<T[K], undefined>} {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as {[K in keyof T]?: Exclude<T[K], undefined>};
}

export function aFecha(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  return value === null ? null : new Date(`${value}T00:00:00.000Z`);
}
