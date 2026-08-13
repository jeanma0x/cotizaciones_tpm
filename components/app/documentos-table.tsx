"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/app/data-table";
import { DocumentoVistaRapidaSheet } from "@/components/app/documento-vista-rapida-sheet";
import { EstadoBadge } from "@/components/app/estado-badge";

const TIPO_LABELS: Record<string, string> = {
  COTIZACION: "Cotización",
  PROPUESTA: "Propuesta",
  FACTURA: "Factura",
};

export type FilaDocumento = {
  id: string;
  correlativo: number;
  tipo: string;
  empresaNombre: string;
  empresaMoneda: string;
  clienteNombre: string;
  total: number;
  estado: string;
  diasSinRespuesta: number | null;
  fecha: string;
  vigenciaDias: number | null;
  condicionesPago: string | null;
};

const columns: ColumnDef<FilaDocumento, unknown>[] = [
  {
    accessorKey: "correlativo",
    header: "Correlativo",
    cell: ({ row }) => (
      <Link href={`/documentos/${row.original.id}`} className="correlativo-tag">
        TPM-{row.original.correlativo}
      </Link>
    ),
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => TIPO_LABELS[row.original.tipo] ?? row.original.tipo,
  },
  { accessorKey: "empresaNombre", header: "Empresa" },
  { accessorKey: "clienteNombre", header: "Cliente" },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {row.original.empresaMoneda} {row.original.total.toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <EstadoBadge estado={row.original.estado} />
        {row.original.diasSinRespuesta !== null && (
          <span className="flex items-center gap-1 text-xs font-medium text-danger">
            <AlertTriangleIcon className="h-3 w-3" />
            {row.original.diasSinRespuesta}d
          </span>
        )}
      </div>
    ),
  },
  {
    id: "acciones",
    header: () => <span className="block text-right">Acciones</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DocumentoVistaRapidaSheet
          documentoId={row.original.id}
          data={{
            correlativo: row.original.correlativo,
            tipoLabel: TIPO_LABELS[row.original.tipo] ?? row.original.tipo,
            empresaNombre: row.original.empresaNombre,
            clienteNombre: row.original.clienteNombre,
            fecha: new Date(row.original.fecha),
            vigenciaDias: row.original.vigenciaDias,
            condicionesPago: row.original.condicionesPago,
            moneda: row.original.empresaMoneda,
            total: row.original.total,
            estado: row.original.estado,
          }}
        />
      </div>
    ),
  },
];

export function DocumentosTable({ data }: { data: FilaDocumento[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No hay documentos que coincidan con estos filtros."
    />
  );
}
