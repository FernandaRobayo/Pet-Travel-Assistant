CREATE TYPE "TipoVigencia" AS ENUM ('fecha', 'sin_vencimiento', 'desconocida');

CREATE TABLE "Documento" (
  "id" UUID NOT NULL,
  "identificacion" TEXT NOT NULL,
  "vigencia" "TipoVigencia" NOT NULL,
  "fechaVencimiento" DATE,
  "mascotaId" UUID NOT NULL,
  CONSTRAINT "Documento_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Documento_vigencia_check" CHECK (
    ("vigencia" = 'fecha' AND "fechaVencimiento" IS NOT NULL)
    OR ("vigencia" <> 'fecha' AND "fechaVencimiento" IS NULL)
  )
);
CREATE INDEX "Documento_mascotaId_idx" ON "Documento"("mascotaId");
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_mascotaId_fkey" FOREIGN KEY ("mascotaId") REFERENCES "Mascota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "DocumentoTarea" (
  "documentoId" UUID NOT NULL,
  "tareaId" UUID NOT NULL,
  CONSTRAINT "DocumentoTarea_pkey" PRIMARY KEY ("documentoId", "tareaId")
);
CREATE INDEX "DocumentoTarea_tareaId_idx" ON "DocumentoTarea"("tareaId");
ALTER TABLE "DocumentoTarea" ADD CONSTRAINT "DocumentoTarea_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentoTarea" ADD CONSTRAINT "DocumentoTarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
