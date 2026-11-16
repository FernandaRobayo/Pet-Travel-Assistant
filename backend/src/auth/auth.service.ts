import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { compare, hash, hashSync } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto, RecuperarDto } from './auth.dto';

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 símbolos sin ambiguos: 16 símbolos = 80 bits
const normalizar = (codigo: string) => codigo.toUpperCase().replace(/[^A-Z0-9]/g, '');
function generarCodigo(): string {
  const simbolos = Array.from(randomBytes(16), (byte) => ALFABETO[byte % 32]).join('');
  return simbolos.match(/.{4}/g)!.join('-');
}

@Injectable()
export class AuthService {
  // Comparación ficticia para que recuperar con un correo inexistente tarde lo mismo que con uno real.
  private readonly hashFalso = hashSync('sin-codigo', 10);
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(input: AuthDto) {
    if (Buffer.byteLength(input.contrasena, 'utf8') > 72) {
      throw new BadRequestException('La contraseña supera el máximo de 72 bytes.');
    }
    try {
      const codigo = generarCodigo();
      const user = await this.prisma.usuario.create({data: {
        correo: input.correo, passwordHash: await hash(input.contrasena, 12), recuperacionHash: await hash(normalizar(codigo), 10)
      }});
      return {id: user.id, correo: user.correo, codigoRecuperacion: codigo};
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('No se pudo registrar esta cuenta.');
      }
      throw error;
    }
  }

  async login(input: AuthDto) {
    // bcrypt truncates beyond 72 bytes; reject an overlong login rather than
    // accepting a different password with the same first 72 bytes.
    if (Buffer.byteLength(input.contrasena, 'utf8') > 72) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }
    const user = await this.prisma.usuario.findUnique({where: {correo: input.correo}});
    if (!user || !(await compare(input.contrasena, user.passwordHash))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }
    return {accessToken: await this.jwt.signAsync({sub: user.id}), usuario: {id: user.id, correo: user.correo}};
  }

  // SWR-ACC-004: restablecer la contraseña con el código de recuperación. El error es genérico a propósito.
  async recuperar(input: RecuperarDto) {
    if (Buffer.byteLength(input.contrasena, 'utf8') > 72) throw new BadRequestException('La contraseña supera el máximo de 72 bytes.');
    const user = await this.prisma.usuario.findUnique({where: {correo: input.correo}});
    const valido = await compare(normalizar(input.codigo), user?.recuperacionHash ?? this.hashFalso);
    if (!user || !user.recuperacionHash || !valido) throw new UnauthorizedException('Los datos de recuperación no son correctos.');
    const codigo = generarCodigo();
    await this.prisma.usuario.update({where: {id: user.id}, data: {
      passwordHash: await hash(input.contrasena, 12), recuperacionHash: await hash(normalizar(codigo), 10)
    }});
    return {codigoRecuperacion: codigo};
  }

  // Para cuentas creadas antes del código, o para renovarlo estando con la sesión iniciada.
  async nuevoCodigo(usuarioId: string) {
    const codigo = generarCodigo();
    await this.prisma.usuario.update({where: {id: usuarioId}, data: {recuperacionHash: await hash(normalizar(codigo), 10)}});
    return {codigoRecuperacion: codigo};
  }
}
