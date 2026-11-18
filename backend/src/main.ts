import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

// Load the backend-only environment in both src/ and compiled dist/ execution.
config({path: resolve(__dirname, '../.env'), quiet: true});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {logger: ['error', 'warn']});
  // CAMBIO 1: registro de peticiones HTTP (método, ruta, estado, duración)
  app.use((request: Request, response: Response, next: NextFunction) => {
    const inicio = Date.now();
    response.on('finish', () => console.log(`${new Date().toISOString()} ${request.method} ${request.originalUrl.split('?')[0]} ${response.statusCode} ${Date.now() - inicio}ms`));
    next();
  });
  app.enableCors({origin: process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:3000', allowedHeaders: ['Content-Type','Authorization'], methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS']});
  app.useGlobalPipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true, transform: true}));
  app.enableShutdownHooks();
  // CAMBIO 2: host configurable (0.0.0.0 en Render)
  await app.listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1');
}
bootstrap().catch((error: unknown) => {
  console.error('No se pudo iniciar la API. Revisa la configuración y la conexión PostgreSQL.');
  // Causa técnica sin credenciales: se oculta cualquier URL de conexión.
  const causa = error instanceof Error ? `${error.name}${(error as {code?: string}).code ? ` (${(error as {code?: string}).code})` : ''}: ${error.message}` : String(error);
  console.error('Causa:', causa.replace(/[a-z]+:\/\/\S+/gi, '[url oculta]').split('\n').filter(Boolean).slice(0, 4).join(' | '));
  process.exitCode = 1;
});