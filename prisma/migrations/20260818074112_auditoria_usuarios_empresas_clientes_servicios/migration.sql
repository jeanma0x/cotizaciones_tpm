-- CreateEnum
CREATE TYPE "AccionCliente" AS ENUM ('CREADO', 'EDITADO');

-- CreateEnum
CREATE TYPE "AccionServicio" AS ENUM ('CREADO', 'EDITADO');

-- CreateEnum
CREATE TYPE "AccionUsuario" AS ENUM ('ACCESO_ACTUALIZADO', 'FIRMA_ACTUALIZADA', 'FIRMA_ELIMINADA', 'ELIMINADO');

-- CreateTable
CREATE TABLE "clientes_auditoria" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "empresaId" TEXT NOT NULL,
    "accion" "AccionCliente" NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "usuarioId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios_auditoria" (
    "id" TEXT NOT NULL,
    "servicioId" TEXT,
    "empresaId" TEXT NOT NULL,
    "accion" "AccionServicio" NOT NULL,
    "servicioNombre" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "usuarioId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servicios_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas_auditoria" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "usuarioId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresas_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "usuarioNombre" TEXT NOT NULL,
    "usuarioEmail" TEXT NOT NULL,
    "accion" "AccionUsuario" NOT NULL,
    "detalle" TEXT NOT NULL,
    "actorUsuarioId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clientes_auditoria_empresaId_fecha_idx" ON "clientes_auditoria"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "servicios_auditoria_empresaId_fecha_idx" ON "servicios_auditoria"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "empresas_auditoria_empresaId_fecha_idx" ON "empresas_auditoria"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "usuarios_auditoria_fecha_idx" ON "usuarios_auditoria"("fecha");

-- AddForeignKey
ALTER TABLE "clientes_auditoria" ADD CONSTRAINT "clientes_auditoria_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes_auditoria" ADD CONSTRAINT "clientes_auditoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes_auditoria" ADD CONSTRAINT "clientes_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios_auditoria" ADD CONSTRAINT "servicios_auditoria_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios_auditoria" ADD CONSTRAINT "servicios_auditoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios_auditoria" ADD CONSTRAINT "servicios_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas_auditoria" ADD CONSTRAINT "empresas_auditoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas_auditoria" ADD CONSTRAINT "empresas_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_auditoria" ADD CONSTRAINT "usuarios_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_auditoria" ADD CONSTRAINT "usuarios_auditoria_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
