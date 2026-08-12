-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('SUPERUSUARIO', 'MIEMBRO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('COTIZACION', 'PROPUESTA', 'FACTURA');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('BORRADOR', 'ENVIADA', 'EN_NEGOCIACION', 'ACEPTADA', 'RECHAZADA', 'VENCIDA', 'FACTURADA');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "moneda" TEXT NOT NULL DEFAULT 'GTQ',
    "correlativoActual" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'MIEMBRO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_empresa" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "usuario_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "direccion" TEXT,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precioFijo" DECIMAL(12,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "correlativo" INTEGER NOT NULL,
    "clienteId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "vigenciaDias" INTEGER DEFAULT 15,
    "condicionesPago" TEXT,
    "descripcionGeneral" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "notas" JSONB NOT NULL,
    "anexos" JSONB,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'BORRADOR',
    "duplicadoDeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_documento" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precioUnitario" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "items_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_estado" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoDocumento" NOT NULL,
    "nota" TEXT,

    CONSTRAINT "historial_estado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_clerkId_key" ON "usuarios"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_empresa_usuarioId_empresaId_key" ON "usuario_empresa"("usuarioId", "empresaId");

-- CreateIndex
CREATE INDEX "clientes_empresaId_idx" ON "clientes"("empresaId");

-- CreateIndex
CREATE INDEX "servicios_empresaId_idx" ON "servicios"("empresaId");

-- CreateIndex
CREATE INDEX "documentos_empresaId_tipo_estado_idx" ON "documentos"("empresaId", "tipo", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_empresaId_correlativo_key" ON "documentos"("empresaId", "correlativo");

-- AddForeignKey
ALTER TABLE "usuario_empresa" ADD CONSTRAINT "usuario_empresa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_empresa" ADD CONSTRAINT "usuario_empresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_documento" ADD CONSTRAINT "items_documento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estado" ADD CONSTRAINT "historial_estado_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
