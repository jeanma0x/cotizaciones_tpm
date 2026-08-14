"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PencilIcon } from "lucide-react";
import { accionesRevelablesClassName, DataTable } from "@/components/app/data-table";
import { CostoFormDialog } from "@/components/app/costo-form-dialog";
import { EliminarCostoDialog } from "@/components/app/eliminar-costo-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORIA_COSTO_LABELS } from "@/lib/validations/costo";

export type FilaCosto = {
  id: string;
  empresaId: string;
  empresaNombre: string;
  moneda: string;
  categoria: keyof typeof CATEGORIA_COSTO_LABELS;
  descripcion: string;
  monto: number;
  fechaGasto: string;
};

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function CostosTable({
  data,
  empresas,
  emptyMessage,
}: {
  data: FilaCosto[];
  empresas: { id: string; nombre: string }[];
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
      cell: ({ row }) => <Badge variant="outline">{CATEGORIA_COSTO_LABELS[row.original.categoria]}</Badge>,
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => <span className="font-medium">{row.original.descripcion}</span>,
    },
    { accessorKey: "empresaNombre", header: "Empresa" },
    {
      accessorKey: "monto",
      header: "Monto",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.moneda} {row.original.monto.toFixed(2)}
        </span>
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
            costo={row.original}
            trigger={
              <Button variant="outline" size="sm">
                <PencilIcon className="h-4 w-4" />
                Editar
              </Button>
            }
          />
          <EliminarCostoDialog id={row.original.id} descripcion={row.original.descripcion} />
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} emptyMessage={emptyMessage} />;
}
