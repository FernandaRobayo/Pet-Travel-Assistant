import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.service';
import {MascotasModule} from './mascotas/mascotas.module';
import {ViajesModule} from './viajes/viajes.module';
import {ChecklistModule} from './checklist/checklist.module';

@Module({imports: [PrismaModule, AuthModule, MascotasModule, ViajesModule, ChecklistModule]})
export class AppModule {}
