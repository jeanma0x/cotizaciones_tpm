import { PencilIcon, PenLineIcon, ShieldCheckIcon } from "lucide-react";
import { AccesoUsuarioDialog } from "@/components/app/acceso-usuario-dialog";
import { AvatarIniciales } from "@/components/app/avatar-iniciales";
import { EliminarUsuarioButton } from "@/components/app/eliminar-usuario-button";
import { FirmaUsuarioDialog } from "@/components/app/firma-usuario-dialog";
import {
  HistorialAuditoriaSheet,
  type FilaAuditoriaGenerica,
} from "@/components/app/historial-auditoria-sheet";
import { InvitarUsuarioDialog } from "@/components/app/invitar-usuario-dialog";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { assertSuperusuario } from "@/lib/auth";
import { getUsuarioActual } from "@/lib/current-usuario";
import { db } from "@/lib/db";

const ACCION_USUARIO_ESTILO: Record<
  string,
  { variant: FilaAuditoriaGenerica["variant"]; label: string }
> = {
  ACCESO_ACTUALIZADO: { variant: "editado", label: "Acceso actualizado" },
  FIRMA_ACTUALIZADA: { variant: "editado", label: "Firma actualizada" },
  FIRMA_ELIMINADA: { variant: "eliminado", label: "Firma eliminada" },
  ELIMINADO: { variant: "eliminado", label: "Usuario eliminado" },
};

export default async function UsuariosPage() {
  await assertSuperusuario();

  const [usuarios, empresas, usuarioActual, auditoria] = await Promise.all([
    db.usuario.findMany({
      include: { empresas: { include: { empresa: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.empresa.findMany({ orderBy: { nombre: "asc" } }),
    getUsuarioActual(),
    db.usuarioAuditoria.findMany({
      include: { actor: true },
      orderBy: { fecha: "desc" },
      take: 100,
    }),
  ]);

  const filasAuditoria: FilaAuditoriaGenerica[] = auditoria.map((a) => ({
    id: a.id,
    variant: ACCION_USUARIO_ESTILO[a.accion].variant,
    accionLabel: ACCION_USUARIO_ESTILO[a.accion].label,
    titulo: `${a.usuarioNombre} (${a.usuarioEmail})`,
    detalle: a.detalle,
    usuarioNombre: a.actor?.nombre ?? null,
    fecha: a.fecha.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        icon={ShieldCheckIcon}
        actions={
          <div className="flex gap-2">
            <HistorialAuditoriaSheet titulo="Historial de usuarios" entradas={filasAuditoria} />
            <InvitarUsuarioDialog empresas={empresas} />
          </div>
        }
      />

      {/* Tarjetas, no tabla — nunca van a ser más de un puñado de usuarios. */}
      <div className="flex flex-col gap-3">
        {usuarios.map((usuario) => (
          <div
            key={usuario.id}
            className="form-section flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <AvatarIniciales nombre={usuario.nombre} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-text-primary">{usuario.nombre}</p>
                  <Badge variant={usuario.rol === "SUPERUSUARIO" ? "default" : "outline"}>
                    {usuario.rol === "SUPERUSUARIO" ? "Superusuario" : "Miembro"}
                  </Badge>
                </div>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {usuario.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {usuario.empresas.length === 0
                    ? "Sin empresas asignadas"
                    : usuario.empresas.map((e) => e.empresa.nombre).join(", ")}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <FirmaUsuarioDialog
                usuarioId={usuario.id}
                nombre={usuario.nombre}
                firmaActual={usuario.firma}
                trigger={
                  <Button variant="outline" size="sm">
                    <PenLineIcon className="h-4 w-4" />
                    Firma
                  </Button>
                }
              />
              <AccesoUsuarioDialog
                usuario={usuario}
                empresas={empresas}
                trigger={
                  <Button variant="outline" size="sm">
                    <PencilIcon className="h-4 w-4" />
                    Editar acceso
                  </Button>
                }
              />
              {usuario.id === usuarioActual?.id ? (
                <span className="px-2 text-xs text-muted-foreground">Tu cuenta</span>
              ) : (
                <EliminarUsuarioButton usuarioId={usuario.id} nombre={usuario.nombre} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
