import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(input: AuthDto) {
    if (Buffer.byteLength(input.contrasena, 'utf8') > 72) {
      throw new BadRequestException('La contraseña supera el máximo de 72 bytes.');
    }
    try {
      const user = await this.prisma.usuario.create({data: {
        correo: input.correo, passwordHash: await hash(input.contrasena, 12)
      }});
      return {id: user.id, correo: user.correo};
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
}
