-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "codigoPais" TEXT;

-- AlterTable
ALTER TABLE "empresas" ADD COLUMN     "codigoPais" TEXT NOT NULL DEFAULT '502';
