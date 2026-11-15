CREATE TYPE "EstadoTarea" AS ENUM ('pendiente', 'completa', 'requiere_revision');

CREATE TABLE "Mascota" (
  "id" UUID NOT NULL,
  "nombre" TEXT NOT NULL,
  "usuarioId" UUID NOT NULL,
  CONSTRAINT "Mascota_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Viaje" (
  "id" UUID NOT NULL,
  "origen" TEXT NOT NULL,
  "destino" TEXT NOT NULL,
  "fechaSalida" DATE NOT NULL,
  "mascotaId" UUID NOT NULL,
  CONSTRAINT "Viaje_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tarea" (
  "id" UUID NOT NULL,
  "descripcion" TEXT NOT NULL,
  "estado" "EstadoTarea" NOT NULL DEFAULT 'pendiente',
  "viajeId" UUID NOT NULL,
  CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Mascota_usuarioId_idx" ON "Mascota"("usuarioId");
CREATE INDEX "Viaje_mascotaId_idx" ON "Viaje"("mascotaId");
CREATE INDEX "Tarea_viajeId_idx" ON "Tarea"("viajeId");

ALTER TABLE "Mascota" ADD CONSTRAINT "Mascota_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_mascotaId_fkey" FOREIGN KEY ("mascotaId") REFERENCES "Mascota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
