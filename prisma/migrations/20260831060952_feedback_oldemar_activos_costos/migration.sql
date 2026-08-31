-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CategoriaCosto" ADD VALUE 'REPUESTOS';
ALTER TYPE "CategoriaCosto" ADD VALUE 'LLANTAS';

-- AlterTable
ALTER TABLE "activos" ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "marca" TEXT;

-- AlterTable
ALTER TABLE "costos_operativos" ADD COLUMN     "categoriaOtroDetalle" TEXT;

-- AlterTable
ALTER TABLE "costos_operativos_auditoria" ADD COLUMN     "categoriaOtroDetalle" TEXT;
