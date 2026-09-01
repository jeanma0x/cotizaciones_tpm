import { ContainerIcon, PlusIcon } from "lucide-react";
import { ActivoFormDialog } from "@/components/app/activo-form-dialog";
import { ActivosTable, type FilaActivo } from "@/components/app/activos-table";
import { BuscadorLista } from "@/components/app/buscador-lista";
import { HistorialAuditoriaSheet, type FilaAuditoriaGenerica } from "@/components/app/historial-auditoria-sheet";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEmpresaActivaId } from "@/lib/empresa-activa";

const ACCION_ACTIVO_LABEL: Record<string, string> = { CREADO: "Creado", EDITADO: "Editado" };

export default async function ActivosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [empresasPermitidas, empresaActivaId] = await Promise.all([
    getEmpresasPermitidas(),
    getEmpresaActivaId(),
  ]);
  const empresaIds = empresaActivaId ? [empresaActivaId] : empresasPermitidas;

  const [activos, empresas, auditoria] = await Promise.all([
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
    categoria: a.categoria,
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

      <BuscadorLista basePath="/activos" placeholder="Buscar por placa, marca o modelo…" />

      <ActivosTable
        data={filas}
        empresas={empresas}
        emptyMessage={q ? "Ningún activo coincide con la búsqueda." : "Todavía no hay activos registrados."}
      />
    </div>
  );
}
