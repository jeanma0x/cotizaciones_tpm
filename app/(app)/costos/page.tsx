import { PlusIcon, WalletIcon } from "lucide-react";
import { BuscadorLista } from "@/components/app/buscador-lista";
import { CostoFormDialog } from "@/components/app/costo-form-dialog";
import { CostosFiltros } from "@/components/app/costos-filtros";
import { CostosTable, type FilaCosto } from "@/components/app/costos-table";
import { ExportarCostosDialog } from "@/components/app/exportar-costos-dialog";
import { HistorialCostosSheet, type FilaAuditoriaCosto } from "@/components/app/historial-costos-sheet";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEmpresaActivaId } from "@/lib/empresa-activa";
import { CATEGORIA_COSTO_LABELS } from "@/lib/validations/costo";
import type { CategoriaCosto, Prisma } from "@prisma/client";

export default async function CostosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    desde?: string;
    hasta?: string;
  }>;
}) {
  const { q, categoria, desde, hasta } = await searchParams;
  const [empresasPermitidas, empresaActivaId] = await Promise.all([
    getEmpresasPermitidas(),
    getEmpresaActivaId(),
  ]);

  // Fase 3.2: el selector de empresa global reemplaza el filtro local de
  // empresa que vivía en CostosFiltros.
  const empresaFiltrada = empresaActivaId ?? undefined;
  const empresaIds = empresaActivaId ? [empresaActivaId] : empresasPermitidas;
  const categoriaFiltrada =
    categoria && categoria in CATEGORIA_COSTO_LABELS ? (categoria as CategoriaCosto) : undefined;

  const fechaGastoFiltro: Prisma.DateTimeFilter | undefined =
    desde || hasta
      ? {
          ...(desde ? { gte: new Date(`${desde}T00:00:00.000Z`) } : {}),
          ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999Z`) } : {}),
        }
      : undefined;

  const [costos, empresas, clientes, auditoria] = await Promise.all([
    db.costoOperativo.findMany({
      where: {
        empresaId: empresaFiltrada ?? { in: empresasPermitidas },
        ...(q ? { descripcion: { contains: q, mode: "insensitive" } } : {}),
        ...(categoriaFiltrada ? { categoria: categoriaFiltrada } : {}),
        ...(fechaGastoFiltro ? { fechaGasto: fechaGastoFiltro } : {}),
      },
      include: { empresa: true, cliente: true, proyecto: true },
      orderBy: { fechaGasto: "desc" },
    }),
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
    db.cliente.findMany({
      where: { empresaId: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
      include: { proyectos: { orderBy: { nombre: "asc" } } },
    }),
    // Capado a 100 — es una bitácora de actividad reciente, no un reporte
    // contable completo (para eso está Exportar, sobre costos_operativos).
    db.costoOperativoAuditoria.findMany({
      where: { empresaId: { in: empresaIds } },
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
    clienteId: c.clienteId,
    clienteNombre: c.cliente?.nombre ?? null,
    proyectoId: c.proyectoId,
    proyectoNombre: c.proyecto?.nombre ?? null,
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
            <ExportarCostosDialog empresaId={empresaFiltrada} />
            <CostoFormDialog
              empresas={empresas}
              clientes={clientes}
              empresaActivaId={empresaActivaId}
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

      <div className="flex flex-wrap items-center gap-2">
        <BuscadorLista basePath="/costos" placeholder="Buscar por descripción…" />
        <CostosFiltros />
      </div>

      <CostosTable
        data={filas}
        empresas={empresas}
        clientes={clientes}
        emptyMessage={
          q
            ? "Ningún costo coincide con la búsqueda."
            : "Todavía no hay costos registrados con estos filtros."
        }
      />
    </div>
  );
}
