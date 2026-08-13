import { PencilIcon } from "lucide-react";
import { AccesoUsuarioDialog } from "@/components/app/acceso-usuario-dialog";
import { EliminarUsuarioButton } from "@/components/app/eliminar-usuario-button";
import { InvitarUsuarioDialog } from "@/components/app/invitar-usuario-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Usuarios</h1>
        <InvitarUsuarioDialog empresas={empresas} />
      </div>

      <div className="rounded border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Empresas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.nombre}</TableCell>
                <TableCell className="font-mono text-xs">{usuario.email}</TableCell>
                <TableCell>
                  <Badge variant={usuario.rol === "SUPERUSUARIO" ? "default" : "outline"}>
                    {usuario.rol === "SUPERUSUARIO" ? "Superusuario" : "Miembro"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {usuario.empresas.length === 0
                    ? "Sin empresas asignadas"
                    : usuario.empresas.map((e) => e.empresa.nombre).join(", ")}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
