"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PencilIcon } from "lucide-react";
import { accionesRevelablesClassName, DataTable } from "@/components/app/data-table";
import { ServicioFormDialog } from "@/components/app/servicio-form-dialog";
import { ToggleActivoServicio } from "@/components/app/toggle-activo-servicio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type FilaServicio = {
  id: string;
  empresaId: string;
  nombre: string;
  empresaNombre: string;
  moneda: string;
  precioFijo: number;
  activo: boolean;
};

export function ServiciosTable({
  data,
  empresas,
  emptyMessage,
}: {
  data: FilaServicio[];
  empresas: { id: string; nombre: string }[];
  emptyMessage: string;
}) {
  const columns: ColumnDef<FilaServicio, unknown>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span>,
    },
    { accessorKey: "empresaNombre", header: "Empresa" },
    {
      accessorKey: "precioFijo",
      header: "Precio fijo",
      cell: ({ row }) => (
        <span className="font-mono text-lg font-semibold text-brand">
          {row.original.moneda} {row.original.precioFijo.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "activo",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.original.activo ? "default" : "outline"}>
          {row.original.activo ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      id: "acciones",
      header: () => <span className="block text-right">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className={`flex justify-end gap-2 ${accionesRevelablesClassName}`}>
          <ServicioFormDialog
            empresas={empresas}
            servicio={row.original}
            trigger={
              <Button variant="outline" size="sm">
                <PencilIcon className="h-4 w-4" />
                Editar
              </Button>
            }
          />
          <ToggleActivoServicio id={row.original.id} activo={row.original.activo} />
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} emptyMessage={emptyMessage} />;
}
