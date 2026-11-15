import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.service';
import {MascotasModule} from './mascotas/mascotas.module';
import {ViajesModule} from './viajes/viajes.module';
import {ChecklistModule} from './checklist/checklist.module';
import {DocumentosModule} from './documentos/documentos.module';
import {SeguimientoModule} from './seguimiento/seguimiento.module';

@Module({imports: [PrismaModule, AuthModule, MascotasModule, ViajesModule, ChecklistModule, DocumentosModule, SeguimientoModule]})
export class AppModule {}
