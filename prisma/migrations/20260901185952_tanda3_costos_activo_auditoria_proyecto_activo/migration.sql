-- CreateEnum
CREATE TYPE "AccionProyecto" AS ENUM ('CREADO', 'EDITADO');

-- CreateEnum
CREATE TYPE "AccionActivo" AS ENUM ('CREADO', 'EDITADO');

-- AlterTable
-- updatedAt de las 5 filas existentes se inicializa a "ahora" (no hay un
-- valor histórico real que reconstruir) — @updatedAt sigue actualizándolo
-- solo en ediciones futuras, esto es únicamente el backfill inicial.
ALTER TABLE "costos_operativos" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "proyectos_auditoria" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT,
    "clienteId" TEXT,
    "empresaId" TEXT NOT NULL,
    "accion" "AccionProyecto" NOT NULL,
    "proyectoNombre" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "usuarioId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proyectos_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activos_auditoria" (
    "id" TEXT NOT NULL,
    "activoId" TEXT,
    "empresaId" TEXT NOT NULL,
    "accion" "AccionActivo" NOT NULL,
    "activoNombre" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "usuarioId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activos_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proyectos_auditoria_empresaId_fecha_idx" ON "proyectos_auditoria"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "activos_auditoria_empresaId_fecha_idx" ON "activos_auditoria"("empresaId", "fecha");

-- AddForeignKey
ALTER TABLE "proyectos_auditoria" ADD CONSTRAINT "proyectos_auditoria_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_auditoria" ADD CONSTRAINT "proyectos_auditoria_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_auditoria" ADD CONSTRAINT "proyectos_auditoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_auditoria" ADD CONSTRAINT "proyectos_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activos_auditoria" ADD CONSTRAINT "activos_auditoria_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "activos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activos_auditoria" ADD CONSTRAINT "activos_auditoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activos_auditoria" ADD CONSTRAINT "activos_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
