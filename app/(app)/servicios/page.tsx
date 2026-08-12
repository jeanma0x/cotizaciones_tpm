import { PlusIcon } from "lucide-react";
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

export default async function ServiciosPage() {
  const empresasPermitidas = await getEmpresasPermitidas();

  const [servicios, empresas] = await Promise.all([
    db.servicio.findMany({
      where: { empresaId: { in: empresasPermitidas } },
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Servicios</h1>
        <ServicioFormDialog
          empresas={empresas}
          trigger={
            <Button>
              <PlusIcon className="h-4 w-4" />
              Nuevo servicio
            </Button>
          }
        />
      </div>

      <div className="rounded border border-line bg-card">
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
                  Todavía no hay servicios.
                </TableCell>
              </TableRow>
            )}
            {servicios.map((servicio) => (
              <TableRow key={servicio.id}>
                <TableCell className="font-medium">{servicio.nombre}</TableCell>
                <TableCell>{servicio.empresa.nombre}</TableCell>
                <TableCell className="font-mono text-sm">
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
                    servicio={servicio}
                    trigger={
                      <Button variant="outline" size="sm">
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
