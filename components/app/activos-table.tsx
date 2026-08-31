"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PencilIcon } from "lucide-react";
import { ActivoFormDialog } from "@/components/app/activo-form-dialog";
import { accionesRevelablesClassName, DataTable } from "@/components/app/data-table";
import { ToggleEstadoActivo } from "@/components/app/toggle-estado-activo";
import { formatearMonto } from "@/lib/formato-numero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORIA_FURGON_LABELS, TIPO_ACTIVO_LABELS } from "@/lib/validations/activo";

export type FilaActivo = {
  id: string;
  empresaId: string;
  empresaNombre: string;
  moneda: string;
  tipo: keyof typeof TIPO_ACTIVO_LABELS;
  categoria: keyof typeof CATEGORIA_FURGON_LABELS | null;
  placa: string | null;
  modelo: string | null;
  marca: string | null;
  descripcion: string | null;
  costo: number;
  valor: number;
  activo: boolean;
};

export function ActivosTable({
  data,
  empresas,
  emptyMessage,
}: {
  data: FilaActivo[];
  empresas: { id: string; nombre: string; moneda: string }[];
  emptyMessage: string;
}) {
  const columns: ColumnDef<FilaActivo, unknown>[] = [
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{TIPO_ACTIVO_LABELS[row.original.tipo]}</span>
          {row.original.categoria && (
            <span className="text-xs text-muted-foreground">
              {CATEGORIA_FURGON_LABELS[row.original.categoria]}
            </span>
          )}
        </div>
      ),
    },
    { accessorKey: "empresaNombre", header: "Empresa" },
    {
      accessorKey: "placa",
      header: "Placa",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.placa ?? "—"}</span>
      ),
    },
    {
      accessorKey: "marca",
      header: "Marca",
      cell: ({ row }) => row.original.marca ?? "—",
    },
    {
      accessorKey: "modelo",
      header: "Modelo",
      cell: ({ row }) => row.original.modelo ?? "—",
    },
    {
      accessorKey: "valor",
      header: "Valor",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.moneda} {formatearMonto(row.original.valor)}
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
          <ActivoFormDialog
            empresas={empresas}
            activo={row.original}
            trigger={
              <Button variant="outline" size="sm">
                <PencilIcon className="h-4 w-4" />
                Editar
              </Button>
            }
          />
          <ToggleEstadoActivo
            id={row.original.id}
            nombre={`${TIPO_ACTIVO_LABELS[row.original.tipo]}${row.original.placa ? ` (${row.original.placa})` : ""}`}
            activo={row.original.activo}
          />
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} emptyMessage={emptyMessage} />;
}
