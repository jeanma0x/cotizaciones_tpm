-- CreateEnum
CREATE TYPE "TipoActivo" AS ENUM ('CAMION', 'MAQUINARIA_SOLDAR', 'EQUIPO_ARRASTRE', 'FURGON_O_PLATAFORMA', 'OTRO');

-- CreateEnum
CREATE TYPE "CategoriaFurgon" AS ENUM ('PORTACONTENEDOR_40', 'PORTACONTENEDOR_20', 'PLATAFORMA', 'CISTERNA', 'FURGON_SECO', 'FURGON_REFRIGERADO', 'LOWBOY');

-- AlterTable
ALTER TABLE "costos_operativos" ADD COLUMN     "clienteId" TEXT,
ADD COLUMN     "proyectoId" TEXT;

-- AlterTable
ALTER TABLE "documentos" ADD COLUMN     "proyectoId" TEXT;

-- CreateTable
CREATE TABLE "proyectos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" "TipoActivo" NOT NULL,
    "categoria" "CategoriaFurgon",
    "placa" TEXT,
    "modelo" TEXT,
    "costo" DECIMAL(12,2) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proyectos_clienteId_idx" ON "proyectos"("clienteId");

-- CreateIndex
CREATE INDEX "activos_empresaId_idx" ON "activos"("empresaId");

-- CreateIndex
CREATE INDEX "costos_operativos_proyectoId_idx" ON "costos_operativos"("proyectoId");

-- CreateIndex
CREATE INDEX "costos_operativos_clienteId_idx" ON "costos_operativos"("clienteId");

-- CreateIndex
CREATE INDEX "documentos_proyectoId_idx" ON "documentos"("proyectoId");

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costos_operativos" ADD CONSTRAINT "costos_operativos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costos_operativos" ADD CONSTRAINT "costos_operativos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activos" ADD CONSTRAINT "activos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
