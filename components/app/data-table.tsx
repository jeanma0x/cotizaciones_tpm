"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Una sola implementación de tabla para Documentos, Clientes y Servicios —
// no una tabla artesanal distinta por pantalla. Orden por columna,
// paginación (si hace falta), fila con hover que eleva sutilmente, header
// sticky.
export function DataTable<TData>({
  columns,
  data,
  emptyMessage,
  pageSize = 10,
}: {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  emptyMessage: string;
  pageSize?: number;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const filas = table.getRowModel().rows;
  const mostrarPaginacion = table.getPageCount() > 1;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const puedeOrdenar = header.column.getCanSort();
                const orden = header.column.getIsSorted();
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : puedeOrdenar ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex cursor-pointer items-center gap-1 transition-colors hover:text-text-primary"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {orden === "asc" && <ArrowUpIcon className="h-3 w-3" />}
                        {orden === "desc" && <ArrowDownIcon className="h-3 w-3" />}
                        {!orden && <ChevronsUpDownIcon className="h-3 w-3 opacity-40" />}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {filas.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
          {filas.map((row) => (
            <TableRow
              key={row.id}
              className="group/row relative transition-shadow duration-(--motion-fast) hover:z-10 hover:shadow-md"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {mostrarPaginacion && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Clase reutilizable para la columna de acciones: íconos atenuados que se
// revelan al pasar el mouse por la fila (ver DataTable's group/row).
export const accionesRevelablesClassName =
  "opacity-60 transition-opacity duration-(--motion-fast) group-hover/row:opacity-100";
