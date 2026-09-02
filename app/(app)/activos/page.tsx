import { ContainerIcon, PlusIcon } from "lucide-react";
import { ActivoFormDialog } from "@/components/app/activo-form-dialog";
import { ActivosFiltros } from "@/components/app/activos-filtros";
import { ActivosTable, type FilaActivo } from "@/components/app/activos-table";
import { BuscadorLista } from "@/components/app/buscador-lista";
import { HistorialAuditoriaSheet, type FilaAuditoriaGenerica } from "@/components/app/historial-auditoria-sheet";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEmpresaActivaId } from "@/lib/empresa-activa";
import { TIPO_ACTIVO_LABELS } from "@/lib/validations/activo";
import type { TipoActivo } from "@prisma/client";

const ACCION_ACTIVO_LABEL: Record<string, string> = { CREADO: "Creado", EDITADO: "Editado" };

export default async function ActivosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; tipoOtroDetalle?: string }>;
}) {
  const { q, tipo, tipoOtroDetalle } = await searchParams;
  const [empresasPermitidas, empresaActivaId] = await Promise.all([
    getEmpresasPermitidas(),
    getEmpresaActivaId(),
  ]);
  const empresaIds = empresaActivaId ? [empresaActivaId] : empresasPermitidas;
  const tipoFiltrado = tipo && tipo in TIPO_ACTIVO_LABELS ? (tipo as TipoActivo) : undefined;

  const [activos, empresas, auditoria, otrosDetalles] = await Promise.all([
    db.activo.findMany({
      where: {
        empresaId: { in: empresaIds },
        ...(q
          ? {
              OR: [
                { placa: { contains: q, mode: "insensitive" } },
                { modelo: { contains: q, mode: "insensitive" } },
                { marca: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(tipoFiltrado ? { tipo: tipoFiltrado } : {}),
        ...(tipoOtroDetalle ? { tipo: "OTRO", tipoOtroDetalle } : {}),
      },
      include: { empresa: true },
      orderBy: { createdAt: "desc" },
    }),
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
    db.activoAuditoria.findMany({
      where: { empresaId: { in: empresaIds } },
      include: { usuario: true },
      orderBy: { fecha: "desc" },
      take: 100,
    }),
    // Pedido de Oldemar: "Otro" debe poder filtrarse después como si fuera un
    // tipo más — se listan los valores ya usados por esta empresa para
    // ofrecerlos como opciones adicionales en el filtro de tipo.
    db.activo.findMany({
      where: {
        empresaId: { in: empresaIds },
        tipo: "OTRO",
        tipoOtroDetalle: { not: null },
      },
      select: { tipoOtroDetalle: true },
      distinct: ["tipoOtroDetalle"],
      orderBy: { tipoOtroDetalle: "asc" },
    }),
  ]);

  const filasAuditoria: FilaAuditoriaGenerica[] = auditoria.map((a) => ({
    id: a.id,
    variant: a.accion === "CREADO" ? "creado" : "editado",
    accionLabel: ACCION_ACTIVO_LABEL[a.accion],
    titulo: a.activoNombre,
    detalle: a.detalle,
    usuarioNombre: a.usuario?.nombre ?? null,
    fecha: a.fecha.toISOString(),
  }));

  const filas: FilaActivo[] = activos.map((a) => ({
    id: a.id,
    empresaId: a.empresaId,
    empresaNombre: a.empresa.nombre,
    moneda: a.empresa.moneda,
    tipo: a.tipo,
    tipoOtroDetalle: a.tipoOtroDetalle,
    placa: a.placa,
    modelo: a.modelo,
    marca: a.marca,
    descripcion: a.descripcion,
    costo: Number(a.costo),
    valor: Number(a.valor),
    activo: a.activo,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Activos"
        icon={ContainerIcon}
        actions={
          <div className="flex gap-2">
            <HistorialAuditoriaSheet titulo="Historial de activos" entradas={filasAuditoria} />
            <ActivoFormDialog
              empresas={empresas}
              empresaActivaId={empresaActivaId}
              trigger={
                <Button>
                  <PlusIcon className="h-4 w-4" />
                  Nuevo activo
                </Button>
              }
            />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <BuscadorLista basePath="/activos" placeholder="Buscar por placa, marca o modelo…" />
        <ActivosFiltros
          otrosDetalles={otrosDetalles
            .map((o) => o.tipoOtroDetalle)
            .filter((d): d is string => Boolean(d))}
        />
      </div>

      <ActivosTable
        data={filas}
        empresas={empresas}
        emptyMessage={q ? "Ningún activo coincide con la búsqueda." : "Todavía no hay activos registrados."}
      />
    </div>
  );
}
