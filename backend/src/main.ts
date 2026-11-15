import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

config({path: resolve(__dirname, '../../.env'), quiet: true});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {logger: ['error', 'warn']});
  app.enableCors({origin: process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:3000', allowedHeaders: ['Content-Type','Authorization'], methods: ['GET','POST','PATCH','OPTIONS']});
  app.useGlobalPipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true, transform: true}));
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT || 3001), '127.0.0.1');
}
bootstrap().catch(() => { console.error('No se pudo iniciar la API. Revisa la configuración y la conexión PostgreSQL.'); process.exitCode = 1; });
