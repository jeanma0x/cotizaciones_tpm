-- CreateEnum
CREATE TYPE "CategoriaCosto" AS ENUM ('COMBUSTIBLE', 'PLANILLA', 'PROVEEDORES', 'PREDIO', 'LUZ', 'CONSUMIBLES', 'OTRO');

-- CreateTable
CREATE TABLE "costos_operativos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "categoria" "CategoriaCosto" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fechaGasto" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "costos_operativos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "costos_operativos_empresaId_fechaGasto_idx" ON "costos_operativos"("empresaId", "fechaGasto");

-- AddForeignKey
ALTER TABLE "costos_operativos" ADD CONSTRAINT "costos_operativos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
