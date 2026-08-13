import { PencilIcon, PlusIcon } from "lucide-react";
import { BuscadorLista } from "@/components/app/buscador-lista";
import { PageHeader } from "@/components/app/page-header";
import { ServicioFormDialog } from "@/components/app/servicio-form-dialog";
import { ToggleActivoServicio } from "@/components/app/toggle-activo-servicio";
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

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const empresasPermitidas = await getEmpresasPermitidas();

  const [servicios, empresas] = await Promise.all([
    db.servicio.findMany({
      where: {
        empresaId: { in: empresasPermitidas },
        ...(q ? { nombre: { contains: q, mode: "insensitive" } } : {}),
      },
      include: { empresa: true },
      orderBy: { nombre: "asc" },
    }),
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Servicios"
        actions={
          <ServicioFormDialog
            empresas={empresas}
            trigger={
              <Button>
                <PlusIcon className="h-4 w-4" />
                Nuevo servicio
              </Button>
            }
          />
        }
      />

      <BuscadorLista basePath="/servicios" placeholder="Buscar por nombre…" />

      <div className="rounded border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Precio fijo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicios.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {q ? "Ningún servicio coincide con la búsqueda." : "Todavía no hay servicios."}
                </TableCell>
              </TableRow>
            )}
            {servicios.map((servicio) => (
              <TableRow key={servicio.id}>
                <TableCell className="font-medium">{servicio.nombre}</TableCell>
                <TableCell>{servicio.empresa.nombre}</TableCell>
                <TableCell className="font-mono text-lg font-semibold text-brand">
                  {servicio.empresa.moneda} {Number(servicio.precioFijo).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant={servicio.activo ? "default" : "outline"}>
                    {servicio.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <ServicioFormDialog
                    empresas={empresas}
                    servicio={{ ...servicio, precioFijo: Number(servicio.precioFijo) }}
                    trigger={
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4" />
                        Editar
                      </Button>
                    }
                  />
                  <ToggleActivoServicio id={servicio.id} activo={servicio.activo} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
