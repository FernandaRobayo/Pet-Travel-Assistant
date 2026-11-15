CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");
