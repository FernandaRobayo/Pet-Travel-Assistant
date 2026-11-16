import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthDto, RecuperarDto } from './auth.dto';
import { AuthGuard, AuthRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly prisma: PrismaService) {}
  @Post('register') register(@Body() input: AuthDto) { return this.auth.register(input); }
  @Post('login') @HttpCode(200) login(@Body() input: AuthDto) { return this.auth.login(input); }
  @Post('recuperar') @HttpCode(200) recuperar(@Body() input: RecuperarDto) { return this.auth.recuperar(input); }
  @Post('codigo-recuperacion') @HttpCode(200) @UseGuards(AuthGuard) nuevoCodigo(@Req() request: AuthRequest) { return this.auth.nuevoCodigo(request.usuarioId); }
  @Get('me') @UseGuards(AuthGuard)
  me(@Req() request: AuthRequest) {
    return this.prisma.usuario.findUniqueOrThrow({where: {id: request.usuarioId}, select: {id: true, correo: true}});
  }
}
