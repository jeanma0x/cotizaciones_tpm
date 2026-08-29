"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PencilIcon } from "lucide-react";
import { AvatarIniciales } from "@/components/app/avatar-iniciales";
import { ClienteFormDialog } from "@/components/app/cliente-form-dialog";
import { accionesRevelablesClassName, DataTable } from "@/components/app/data-table";
import { ProyectosClienteSheet } from "@/components/app/proyectos-cliente-sheet";
import { ToggleActivoCliente } from "@/components/app/toggle-activo-cliente";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type FilaCliente = {
  id: string;
  empresaId: string;
  tipo: "INDIVIDUAL" | "EMPRESA";
  nombre: string;
  empresaNombre: string;
  nit: string | null;
  direccion: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  codigoPais: string | null;
  activo: boolean;
  contactos: { id: string; nombre: string; email: string }[];
  proyectos: { id: string; nombre: string; activo: boolean }[];
};

export function ClientesTable({
  data,
  empresas,
  emptyMessage,
}: {
  data: FilaCliente[];
  empresas: { id: string; nombre: string }[];
  emptyMessage: string;
}) {
  const columns: ColumnDef<FilaCliente, unknown>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <AvatarIniciales nombre={row.original.nombre} />
          <span className="font-medium">{row.original.nombre}</span>
        </div>
      ),
    },
    { accessorKey: "empresaNombre", header: "Empresa" },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.tipo === "EMPRESA" ? "Empresa" : "Individual"}
        </Badge>
      ),
    },
    {
      accessorKey: "nit",
      header: "NIT",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.nit ?? "—"}</span>
      ),
    },
    {
      accessorKey: "contacto",
      header: "Contacto",
      cell: ({ row }) => row.original.contacto ?? "—",
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
      cell: ({ row }) => row.original.telefono ?? "—",
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
          <ProyectosClienteSheet
            clienteId={row.original.id}
            clienteNombre={row.original.nombre}
            proyectos={row.original.proyectos}
          />
          <ClienteFormDialog
            empresas={empresas}
            cliente={row.original}
            trigger={
              <Button variant="outline" size="sm">
                <PencilIcon className="h-4 w-4" />
                Editar
              </Button>
            }
          />
          <ToggleActivoCliente
            id={row.original.id}
            nombre={row.original.nombre}
            activo={row.original.activo}
          />
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} emptyMessage={emptyMessage} />;
}
