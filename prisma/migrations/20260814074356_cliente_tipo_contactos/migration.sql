-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('INDIVIDUAL', 'EMPRESA');

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "tipo" "TipoCliente" NOT NULL DEFAULT 'INDIVIDUAL';

-- CreateTable
CREATE TABLE "contactos_cliente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contactos_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contactos_cliente_clienteId_idx" ON "contactos_cliente"("clienteId");

-- AddForeignKey
ALTER TABLE "contactos_cliente" ADD CONSTRAINT "contactos_cliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
