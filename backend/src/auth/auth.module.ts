import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [JwtModule.registerAsync({useFactory: () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || Buffer.byteLength(secret) < 32) throw new Error('Configura JWT_SECRET con al menos 32 bytes.');
    // Supuesto: sesión Bearer de una hora, sin cookies ni refresh tokens.
    return {secret, signOptions: {algorithm: 'HS256', expiresIn: '1h', issuer: 'pet-travel-assistant', audience: 'pta-web'}, verifyOptions: {issuer: 'pet-travel-assistant', audience: 'pta-web'}};
  }})],
  controllers: [AuthController], providers: [AuthService, AuthGuard], exports: [AuthGuard, JwtModule]
})
export class AuthModule {}
