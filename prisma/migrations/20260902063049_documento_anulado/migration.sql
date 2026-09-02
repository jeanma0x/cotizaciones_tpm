-- AlterTable
ALTER TABLE "costos_operativos" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "documentos" ADD COLUMN     "anulado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "motivoAnulacion" TEXT;
