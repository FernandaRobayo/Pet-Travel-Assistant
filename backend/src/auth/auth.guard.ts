import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export type AuthRequest = Request & { usuarioId: string };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const match = request.headers.authorization?.match(/^Bearer (\S+)$/);
    if (!match) throw new UnauthorizedException('Inicia sesión para continuar.');
    try {
      const payload = await this.jwt.verifyAsync<{sub: string}>(match[1], {algorithms: ['HS256']});
      if (typeof payload.sub !== 'string') throw new Error('Missing subject');
      const user = await this.prisma.usuario.findUnique({where: {id: payload.sub}, select: {id: true}});
      if (!user) throw new Error('Missing account');
      request.usuarioId = user.id;
      return true;
    } catch {
      throw new UnauthorizedException('La sesión no es válida o venció.');
    }
  }
}
