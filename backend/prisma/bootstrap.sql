-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('pendiente', 'completa', 'requiere_revision');

-- CreateEnum
CREATE TYPE "TipoVigencia" AS ENUM ('fecha', 'sin_vencimiento', 'desconocida');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mascota" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "usuarioId" UUID NOT NULL,

    CONSTRAINT "Mascota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Viaje" (
    "id" UUID NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "fechaSalida" DATE NOT NULL,
    "mascotaId" UUID NOT NULL,

    CONSTRAINT "Viaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id" UUID NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoTarea" NOT NULL DEFAULT 'pendiente',
    "viajeId" UUID NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" UUID NOT NULL,
    "identificacion" TEXT NOT NULL,
    "vigencia" "TipoVigencia" NOT NULL,
    "fechaVencimiento" DATE,
    "mascotaId" UUID NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoTarea" (
    "documentoId" UUID NOT NULL,
    "tareaId" UUID NOT NULL,

    CONSTRAINT "DocumentoTarea_pkey" PRIMARY KEY ("documentoId","tareaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE INDEX "Mascota_usuarioId_idx" ON "Mascota"("usuarioId");

-- CreateIndex
CREATE INDEX "Viaje_mascotaId_idx" ON "Viaje"("mascotaId");

-- CreateIndex
CREATE INDEX "Tarea_viajeId_idx" ON "Tarea"("viajeId");

-- CreateIndex
CREATE INDEX "Documento_mascotaId_idx" ON "Documento"("mascotaId");

-- CreateIndex
CREATE INDEX "DocumentoTarea_tareaId_idx" ON "DocumentoTarea"("tareaId");

-- AddForeignKey
ALTER TABLE "Mascota" ADD CONSTRAINT "Mascota_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_mascotaId_fkey" FOREIGN KEY ("mascotaId") REFERENCES "Mascota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_mascotaId_fkey" FOREIGN KEY ("mascotaId") REFERENCES "Mascota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoTarea" ADD CONSTRAINT "DocumentoTarea_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoTarea" ADD CONSTRAINT "DocumentoTarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Custom invariant: Prisma datamodel does not encode CHECK constraints.
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_vigencia_check" CHECK (("vigencia" = 'fecha' AND "fechaVencimiento" IS NOT NULL) OR ("vigencia" <> 'fecha' AND "fechaVencimiento" IS NULL));
