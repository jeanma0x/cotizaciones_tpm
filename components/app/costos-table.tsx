"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PencilIcon } from "lucide-react";
import { accionesRevelablesClassName, DataTable } from "@/components/app/data-table";
import { CostoFormDialog } from "@/components/app/costo-form-dialog";
import { ToggleActivoCosto } from "@/components/app/toggle-activo-costo";
import { formatearMonto } from "@/lib/formato-numero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORIA_COSTO_LABELS } from "@/lib/validations/costo";

export type FilaCosto = {
  id: string;
  empresaId: string;
  empresaNombre: string;
  moneda: string;
  clienteId: string | null;
  clienteNombre: string | null;
  proyectoId: string | null;
  proyectoNombre: string | null;
  categoria: keyof typeof CATEGORIA_COSTO_LABELS;
  categoriaOtroDetalle: string | null;
  descripcion: string;
  monto: number;
  fechaGasto: string;
  activo: boolean;
  updatedAt: string;
};

type ClienteConProyectos = {
  id: string;
  empresaId: string;
  nombre: string;
  proyectos: { id: string; nombre: string; activo: boolean }[];
};

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function CostosTable({
  data,
  empresas,
  clientes,
  emptyMessage,
}: {
  data: FilaCosto[];
  empresas: { id: string; nombre: string }[];
  clientes: ClienteConProyectos[];
  emptyMessage: string;
}) {
  const columns: ColumnDef<FilaCosto, unknown>[] = [
    {
      accessorKey: "fechaGasto",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{formatearFecha(row.original.fechaGasto)}</span>
      ),
    },
    {
      accessorKey: "categoria",
      header: "Categoría",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.categoria === "OTRO" && row.original.categoriaOtroDetalle
            ? `Otro: ${row.original.categoriaOtroDetalle}`
            : CATEGORIA_COSTO_LABELS[row.original.categoria]}
        </Badge>
      ),
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => <span className="font-medium">{row.original.descripcion}</span>,
    },
    { accessorKey: "empresaNombre", header: "Empresa" },
    {
      id: "clienteProyecto",
      header: "Cliente / Proyecto",
      cell: ({ row }) =>
        row.original.clienteNombre ? (
          <div className="flex flex-col">
            <span>{row.original.clienteNombre}</span>
            {row.original.proyectoNombre && (
              <span className="text-xs text-muted-foreground">
                {row.original.proyectoNombre}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "monto",
      header: "Monto",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.moneda} {formatearMonto(row.original.monto)}
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
          <CostoFormDialog
            empresas={empresas}
            clientes={clientes}
            costo={row.original}
            trigger={
              <Button variant="outline" size="sm">
                <PencilIcon className="h-4 w-4" />
                Editar
              </Button>
            }
          />
          <ToggleActivoCosto
            id={row.original.id}
            descripcion={row.original.descripcion}
            activo={row.original.activo}
          />
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} emptyMessage={emptyMessage} />;
}
