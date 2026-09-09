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
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
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
  // Degradado en el borde derecho: aviso visual de que la tabla se puede
  // deslizar horizontalmente (overflow-x-auto, ver comentario más abajo) —
  // sin esto, en una pantalla angosta no hay ninguna pista de que faltan
  // columnas a la derecha. Se oculta solo cuando ya no queda nada por
  // scrollear.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [puedeDeslizar, setPuedeDeslizar] = useState(false);

  useEffect(() => {
    // El scroll real no vive en este wrapper, sino en el "table-container"
    // que el propio componente <Table> ya renderiza por su cuenta (ver
    // components/ui/table.tsx) — un div interno que este componente no
    // controla directamente, por eso se busca con querySelector en vez de
    // un ref propio.
    const el = wrapperRef.current?.querySelector<HTMLElement>('[data-slot="table-container"]');
    if (!el) return;
    function actualizar() {
      if (!el) return;
      setPuedeDeslizar(el.scrollWidth - el.scrollLeft - el.clientWidth > 1);
    }
    actualizar();
    el.addEventListener("scroll", actualizar);
    const observer = new ResizeObserver(actualizar);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", actualizar);
      observer.disconnect();
    };
  }, [data]);

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
      <div className="relative">
        {/* <Table> ya trae su propio "table-container" con overflow-x-auto
            (ver components/ui/table.tsx) — acá NO hace falta otro. Ese
            wrapper interno es justamente lo que permite deslizar en vez de
            cortar columnas (antes esta tarjeta usaba overflow-hidden, que
            las dejaba completamente inalcanzables). Hallado en la
            auditoría móvil, 08/09/26. */}
        <div ref={wrapperRef}>
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
        </div>
        {puedeDeslizar && (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 w-8",
              "bg-gradient-to-l from-card to-transparent",
            )}
          />
        )}
      </div>

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
