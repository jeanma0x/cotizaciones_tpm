import { PencilIcon, PlusIcon } from "lucide-react";
import { BuscadorLista } from "@/components/app/buscador-lista";
import { ClienteFormDialog } from "@/components/app/cliente-form-dialog";
import { ToggleActivoCliente } from "@/components/app/toggle-activo-cliente";
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
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const empresasPermitidas = await getEmpresasPermitidas();

  const [clientes, empresas] = await Promise.all([
    db.cliente.findMany({
      where: {
        empresaId: { in: empresasPermitidas },
        ...(q
          ? {
              OR: [
                { nombre: { contains: q, mode: "insensitive" } },
                { nit: { contains: q, mode: "insensitive" } },
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
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Clientes</h1>
        <ClienteFormDialog
          empresas={empresas}
          trigger={
            <Button>
              <PlusIcon className="h-4 w-4" />
              Nuevo cliente
            </Button>
          }
        />
      </div>

      <BuscadorLista basePath="/clientes" placeholder="Buscar por nombre o NIT…" />

      <div className="rounded border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {q ? "Ningún cliente coincide con la búsqueda." : "Todavía no hay clientes."}
                </TableCell>
              </TableRow>
            )}
            {clientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">{cliente.nombre}</TableCell>
                <TableCell>{cliente.empresa.nombre}</TableCell>
                <TableCell className="font-mono text-xs">
                  {cliente.nit ?? "—"}
                </TableCell>
                <TableCell>{cliente.contacto ?? "—"}</TableCell>
                <TableCell>{cliente.telefono ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={cliente.activo ? "default" : "outline"}>
                    {cliente.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <ClienteFormDialog
                    empresas={empresas}
                    cliente={cliente}
                    trigger={
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4" />
                        Editar
                      </Button>
                    }
                  />
                  <ToggleActivoCliente id={cliente.id} activo={cliente.activo} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
