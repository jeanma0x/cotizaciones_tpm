import { PencilIcon, ShieldCheckIcon } from "lucide-react";
import { AccesoUsuarioDialog } from "@/components/app/acceso-usuario-dialog";
import { AvatarIniciales } from "@/components/app/avatar-iniciales";
import { EliminarUsuarioButton } from "@/components/app/eliminar-usuario-button";
import { InvitarUsuarioDialog } from "@/components/app/invitar-usuario-dialog";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { assertSuperusuario } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function UsuariosPage() {
  await assertSuperusuario();

  const [usuarios, empresas] = await Promise.all([
    db.usuario.findMany({
      include: { empresas: { include: { empresa: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.empresa.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        icon={ShieldCheckIcon}
        actions={<InvitarUsuarioDialog empresas={empresas} />}
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
            <div className="flex shrink-0 gap-2">
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
              <EliminarUsuarioButton usuarioId={usuario.id} nombre={usuario.nombre} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
