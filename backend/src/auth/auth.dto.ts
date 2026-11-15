import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class AuthDto {
  @Transform(({value}: {value: unknown}) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, {message: 'Ingresa un correo válido.'})
  @MaxLength(254)
  correo!: string;

  // Supuesto: mínimo 8 caracteres para la contraseña; bcrypt admite hasta 72 bytes.
  @IsString()
  @MinLength(8, {message: 'La contraseña debe tener al menos 8 caracteres.'})
  @MaxLength(72)
  contrasena!: string;
}
