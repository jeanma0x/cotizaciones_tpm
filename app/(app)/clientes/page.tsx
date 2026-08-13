import { PlusIcon, UsersIcon } from "lucide-react";
import { BuscadorLista } from "@/components/app/buscador-lista";
import { ClienteFormDialog } from "@/components/app/cliente-form-dialog";
import { ClientesTable, type FilaCliente } from "@/components/app/clientes-table";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const empresasPermitidas = await getEmpresasPermitidas();

  const [clientes, empresas] = await Promise.all([
    db.cliente.findMany({
      where: {
        empresaId: { in: empresasPermitidas },
        ...(q
          ? {
              OR: [
                { nombre: { contains: q, mode: "insensitive" } },
                { nit: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { empresa: true },
      orderBy: { createdAt: "desc" },
    }),
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const filas: FilaCliente[] = clientes.map((c) => ({
    id: c.id,
    empresaId: c.empresaId,
    nombre: c.nombre,
    empresaNombre: c.empresa.nombre,
    nit: c.nit,
    direccion: c.direccion,
    contacto: c.contacto,
    telefono: c.telefono,
    email: c.email,
    activo: c.activo,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        icon={UsersIcon}
        actions={
          <ClienteFormDialog
            empresas={empresas}
            trigger={
              <Button>
                <PlusIcon className="h-4 w-4" />
                Nuevo cliente
              </Button>
            }
          />
        }
      />

      <BuscadorLista basePath="/clientes" placeholder="Buscar por nombre o NIT…" />

      <ClientesTable
        data={filas}
        empresas={empresas}
        emptyMessage={q ? "Ningún cliente coincide con la búsqueda." : "Todavía no hay clientes."}
      />
    </div>
  );
}
