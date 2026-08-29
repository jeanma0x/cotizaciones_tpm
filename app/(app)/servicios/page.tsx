import { PlusIcon, TruckIcon } from "lucide-react";
import { BuscadorLista } from "@/components/app/buscador-lista";
import { HistorialAuditoriaSheet, type FilaAuditoriaGenerica } from "@/components/app/historial-auditoria-sheet";
import { PageHeader } from "@/components/app/page-header";
import { ServicioFormDialog } from "@/components/app/servicio-form-dialog";
import { ServiciosTable, type FilaServicio } from "@/components/app/servicios-table";
import { Button } from "@/components/ui/button";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEmpresaActivaId } from "@/lib/empresa-activa";

const ACCION_SERVICIO_LABEL: Record<string, string> = { CREADO: "Creado", EDITADO: "Editado" };

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [empresasPermitidas, empresaActivaId] = await Promise.all([
    getEmpresasPermitidas(),
    getEmpresaActivaId(),
  ]);
  // Fase 3.2: antes de esta fase, Servicios nunca tuvo forma de filtrar por
  // una sola empresa — ahora respeta el selector global igual que los demás
  // módulos.
  const empresaIds = empresaActivaId ? [empresaActivaId] : empresasPermitidas;

  const [servicios, empresas, auditoria] = await Promise.all([
    db.servicio.findMany({
      where: {
        empresaId: { in: empresaIds },
        ...(q ? { nombre: { contains: q, mode: "insensitive" } } : {}),
      },
      include: { empresa: true },
      orderBy: { nombre: "asc" },
    }),
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
    db.servicioAuditoria.findMany({
      where: { empresaId: { in: empresaIds } },
      include: { usuario: true },
      orderBy: { fecha: "desc" },
      take: 100,
    }),
  ]);

  const filasAuditoria: FilaAuditoriaGenerica[] = auditoria.map((a) => ({
    id: a.id,
    variant: a.accion === "CREADO" ? "creado" : "editado",
    accionLabel: ACCION_SERVICIO_LABEL[a.accion],
    titulo: a.servicioNombre,
    detalle: a.detalle,
    usuarioNombre: a.usuario?.nombre ?? null,
    fecha: a.fecha.toISOString(),
  }));

  const filas: FilaServicio[] = servicios.map((s) => ({
    id: s.id,
    empresaId: s.empresaId,
    nombre: s.nombre,
    empresaNombre: s.empresa.nombre,
    moneda: s.empresa.moneda,
    precioFijo: Number(s.precioFijo),
    activo: s.activo,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Servicios"
        icon={TruckIcon}
        actions={
          <div className="flex gap-2">
            <HistorialAuditoriaSheet titulo="Historial de servicios" entradas={filasAuditoria} />
            <ServicioFormDialog
              empresas={empresas}
              empresaActivaId={empresaActivaId}
              trigger={
                <Button>
                  <PlusIcon className="h-4 w-4" />
                  Nuevo servicio
                </Button>
              }
            />
          </div>
        }
      />

      <BuscadorLista basePath="/servicios" placeholder="Buscar por nombre…" />

      <ServiciosTable
        data={filas}
        empresas={empresas}
        emptyMessage={q ? "Ningún servicio coincide con la búsqueda." : "Todavía no hay servicios."}
      />
    </div>
  );
}
