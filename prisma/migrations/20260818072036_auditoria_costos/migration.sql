-- CreateEnum
CREATE TYPE "AccionCosto" AS ENUM ('CREADO', 'EDITADO', 'ELIMINADO');

-- CreateTable
CREATE TABLE "costos_operativos_auditoria" (
    "id" TEXT NOT NULL,
    "costoOperativoId" TEXT,
    "empresaId" TEXT NOT NULL,
    "accion" "AccionCosto" NOT NULL,
    "categoria" "CategoriaCosto" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fechaGasto" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "costos_operativos_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "costos_operativos_auditoria_empresaId_fecha_idx" ON "costos_operativos_auditoria"("empresaId", "fecha");

-- AddForeignKey
ALTER TABLE "costos_operativos_auditoria" ADD CONSTRAINT "costos_operativos_auditoria_costoOperativoId_fkey" FOREIGN KEY ("costoOperativoId") REFERENCES "costos_operativos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costos_operativos_auditoria" ADD CONSTRAINT "costos_operativos_auditoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costos_operativos_auditoria" ADD CONSTRAINT "costos_operativos_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
