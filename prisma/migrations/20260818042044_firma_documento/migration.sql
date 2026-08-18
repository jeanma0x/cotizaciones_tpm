-- AlterTable
ALTER TABLE "documentos" ADD COLUMN     "fechaAceptacion" TIMESTAMP(3),
ADD COLUMN     "firmanteUsuarioId" TEXT,
ADD COLUMN     "nombreResponsable" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "firma" TEXT;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_firmanteUsuarioId_fkey" FOREIGN KEY ("firmanteUsuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
