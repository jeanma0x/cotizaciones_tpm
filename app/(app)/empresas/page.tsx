import { Building2Icon, PencilIcon } from "lucide-react";
import { EmpresaFormDialog } from "@/components/app/empresa-form-dialog";
import { HistorialAuditoriaSheet, type FilaAuditoriaGenerica } from "@/components/app/historial-auditoria-sheet";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { assertSuperusuario, getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function EmpresasPage() {
  await assertSuperusuario();
  const empresasPermitidas = await getEmpresasPermitidas();

  const [empresas, auditoria] = await Promise.all([
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
    db.empresaAuditoria.findMany({
      where: { empresaId: { in: empresasPermitidas } },
      include: { empresa: true, usuario: true },
      orderBy: { fecha: "desc" },
      take: 100,
    }),
  ]);

  const filasAuditoria: FilaAuditoriaGenerica[] = auditoria.map((a) => ({
    id: a.id,
    variant: "editado",
    accionLabel: "Editado",
    titulo: a.empresa.nombre,
    detalle: a.detalle,
    usuarioNombre: a.usuario?.nombre ?? null,
    fecha: a.fecha.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Empresas"
        icon={Building2Icon}
        actions={<HistorialAuditoriaSheet titulo="Historial de empresas" entradas={filasAuditoria} />}
      />

      {/* Tarjetas, no tabla — siempre son pocas (4 hoy), una fila de tabla
          larga con montañas de espacio vacío se ve a medio construir. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {empresas.map((empresa) => (
          <div key={empresa.id} className="form-section flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand">
                  <Building2Icon className="h-5 w-5 text-accent" />
                </span>
                <div>
                  <p className="font-semibold text-text-primary">{empresa.nombre}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {empresa.nit ?? "Sin NIT"}
                  </p>
                </div>
              </div>
              <EmpresaFormDialog
                empresa={empresa}
                trigger={
                  <Button variant="outline" size="sm">
                    <PencilIcon className="h-4 w-4" />
                    Editar
                  </Button>
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Moneda</p>
                <p className="font-mono font-medium text-text-primary">{empresa.moneda}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Correlativo actual
                </p>
                <p className="font-mono font-medium text-text-primary">
                  {empresa.correlativoActual}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
