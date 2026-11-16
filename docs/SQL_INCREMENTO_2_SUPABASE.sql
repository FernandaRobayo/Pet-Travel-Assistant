-- Incremento 2: cierra los SWR del SRS v3.6 que estaban fuera del MVP evaluado.
-- Para Supabase (tablas creadas desde el SQL Editor): ejecutar este archivo completo en el SQL Editor.

CREATE TYPE "Transporte" AS ENUM ('avion', 'bus', 'carro', 'otro');
CREATE TYPE "EtapaViaje" AS ENUM ('planificado', 'en_preparacion', 'en_curso', 'finalizado');

ALTER TABLE "Usuario" ADD COLUMN "recuperacionHash" TEXT;

ALTER TABLE "Mascota"
  ADD COLUMN "especie" TEXT,
  ADD COLUMN "raza" TEXT,
  ADD COLUMN "edad" INTEGER,
  ADD COLUMN "peso" DOUBLE PRECISION,
  ADD COLUMN "notas" TEXT,
  ADD COLUMN "veterinarioNombre" TEXT,
  ADD COLUMN "veterinarioTelefono" TEXT,
  ADD COLUMN "contactoEmergencia" TEXT,
  ADD COLUMN "medicacion" TEXT;

ALTER TABLE "Viaje"
  ADD COLUMN "transporte" "Transporte",
  ADD COLUMN "aerolinea" TEXT,
  ADD COLUMN "numeroVuelo" TEXT,
  ADD COLUMN "horaSalida" TEXT,
  ADD COLUMN "aeropuerto" TEXT,
  ADD COLUMN "alojamientoNombre" TEXT,
  ADD COLUMN "alojamientoDireccion" TEXT,
  ADD COLUMN "alojamientoConfirmacion" TEXT,
  ADD COLUMN "etapa" "EtapaViaje" NOT NULL DEFAULT 'planificado',
  ADD COLUMN "archivado" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Tarea"
  ADD COLUMN "fechaLimite" DATE,
  ADD COLUMN "comentario" TEXT,
  ADD COLUMN "responsable" TEXT,
  ADD COLUMN "recurrente" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "orden" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "FotoMascota" (
  "mascotaId" UUID NOT NULL,
  "nombre" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "datos" BYTEA NOT NULL,
  CONSTRAINT "FotoMascota_pkey" PRIMARY KEY ("mascotaId")
);

CREATE TABLE "Tramo" (
  "id" UUID NOT NULL,
  "viajeId" UUID NOT NULL,
  "origen" TEXT NOT NULL,
  "destino" TEXT NOT NULL,
  "fecha" DATE NOT NULL,
  "orden" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Tramo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReglasViaje" (
  "viajeId" UUID NOT NULL,
  "transportador" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "tamano" INTEGER NOT NULL,
  "datos" BYTEA NOT NULL,
  "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReglasViaje_pkey" PRIMARY KEY ("viajeId")
);

CREATE TABLE "Subtarea" (
  "id" UUID NOT NULL,
  "tareaId" UUID NOT NULL,
  "descripcion" TEXT NOT NULL,
  "completa" BOOLEAN NOT NULL DEFAULT false,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subtarea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArchivoDocumento" (
  "id" UUID NOT NULL,
  "documentoId" UUID NOT NULL,
  "grupoId" UUID NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "nombre" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "tamano" INTEGER NOT NULL,
  "datos" BYTEA NOT NULL,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArchivoDocumento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Tramo_viajeId_idx" ON "Tramo"("viajeId");
CREATE INDEX "Subtarea_tareaId_idx" ON "Subtarea"("tareaId");
CREATE INDEX "ArchivoDocumento_documentoId_idx" ON "ArchivoDocumento"("documentoId");
CREATE INDEX "ArchivoDocumento_grupoId_idx" ON "ArchivoDocumento"("grupoId");

ALTER TABLE "FotoMascota" ADD CONSTRAINT "FotoMascota_mascotaId_fkey" FOREIGN KEY ("mascotaId") REFERENCES "Mascota"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tramo" ADD CONSTRAINT "Tramo_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReglasViaje" ADD CONSTRAINT "ReglasViaje_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subtarea" ADD CONSTRAINT "Subtarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArchivoDocumento" ADD CONSTRAINT "ArchivoDocumento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Misma política que las demás tablas en Supabase: RLS activo (Prisma se conecta como postgres y la omite).
ALTER TABLE "FotoMascota" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tramo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReglasViaje" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subtarea" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ArchivoDocumento" ENABLE ROW LEVEL SECURITY;
