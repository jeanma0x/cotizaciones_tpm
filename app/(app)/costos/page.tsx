import { PlusIcon, WalletIcon } from "lucide-react";
import { CostoFormDialog } from "@/components/app/costo-form-dialog";
import { CostosFiltros } from "@/components/app/costos-filtros";
import { CostosTable, type FilaCosto } from "@/components/app/costos-table";
import { ExportarCostosDialog } from "@/components/app/exportar-costos-dialog";
import { HistorialCostosSheet, type FilaAuditoriaCosto } from "@/components/app/historial-costos-sheet";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORIA_COSTO_LABELS } from "@/lib/validations/costo";
import type { CategoriaCosto, Prisma } from "@prisma/client";

export default async function CostosPage({
  searchParams,
}: {
  searchParams: Promise<{
    empresaId?: string;
    categoria?: string;
    desde?: string;
    hasta?: string;
  }>;
}) {
  const { empresaId, categoria, desde, hasta } = await searchParams;
  const empresasPermitidas = await getEmpresasPermitidas();

  const empresaFiltrada =
    empresaId && empresasPermitidas.includes(empresaId) ? empresaId : undefined;
  const categoriaFiltrada =
    categoria && categoria in CATEGORIA_COSTO_LABELS ? (categoria as CategoriaCosto) : undefined;

  const fechaGastoFiltro: Prisma.DateTimeFilter | undefined =
    desde || hasta
      ? {
          ...(desde ? { gte: new Date(`${desde}T00:00:00.000Z`) } : {}),
          ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999Z`) } : {}),
        }
      : undefined;

  const [costos, empresas, auditoria] = await Promise.all([
    db.costoOperativo.findMany({
      where: {
        empresaId: empresaFiltrada ?? { in: empresasPermitidas },
        ...(categoriaFiltrada ? { categoria: categoriaFiltrada } : {}),
        ...(fechaGastoFiltro ? { fechaGasto: fechaGastoFiltro } : {}),
      },
      include: { empresa: true },
      orderBy: { fechaGasto: "desc" },
    }),
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
    // Capado a 100 — es una bitácora de actividad reciente, no un reporte
    // contable completo (para eso está Exportar, sobre costos_operativos).
    db.costoOperativoAuditoria.findMany({
      where: { empresaId: { in: empresasPermitidas } },
      include: { empresa: true, usuario: true },
      orderBy: { fecha: "desc" },
      take: 100,
    }),
  ]);

  const filas: FilaCosto[] = costos.map((c) => ({
    id: c.id,
    empresaId: c.empresaId,
    empresaNombre: c.empresa.nombre,
    moneda: c.empresa.moneda,
    categoria: c.categoria,
    descripcion: c.descripcion,
    monto: Number(c.monto),
    fechaGasto: c.fechaGasto.toISOString().slice(0, 10),
  }));

  const filasAuditoria: FilaAuditoriaCosto[] = auditoria.map((a) => ({
    id: a.id,
    accion: a.accion,
    categoria: a.categoria,
    descripcion: a.descripcion,
    monto: Number(a.monto),
    moneda: a.empresa.moneda,
    empresaNombre: a.empresa.nombre,
    usuarioNombre: a.usuario?.nombre ?? null,
    fecha: a.fecha.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Costos operativos"
        icon={WalletIcon}
        actions={
          <div className="flex gap-2">
            <HistorialCostosSheet entradas={filasAuditoria} mostrarEmpresa={empresas.length > 1} />
            <ExportarCostosDialog empresaId={empresaId} />
            <CostoFormDialog
              empresas={empresas}
              trigger={
                <Button>
                  <PlusIcon className="h-4 w-4" />
                  Nuevo costo
                </Button>
              }
            />
          </div>
        }
      />

      <CostosFiltros empresas={empresas} />

      <CostosTable
        data={filas}
        empresas={empresas}
        emptyMessage="Todavía no hay costos registrados con estos filtros."
      />
    </div>
  );
}
