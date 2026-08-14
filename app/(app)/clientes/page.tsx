import { PlusIcon, UsersIcon } from "lucide-react";
import { ClienteFormDialog } from "@/components/app/cliente-form-dialog";
import { ClientesFiltros } from "@/components/app/clientes-filtros";
import { ClientesTable, type FilaCliente } from "@/components/app/clientes-table";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; empresaId?: string }>;
}) {
  const { q, empresaId } = await searchParams;
  const empresasPermitidas = await getEmpresasPermitidas();

  const [clientes, empresas] = await Promise.all([
    db.cliente.findMany({
      where: {
        empresaId:
          empresaId && empresasPermitidas.includes(empresaId)
            ? empresaId
            : { in: empresasPermitidas },
        ...(q
          ? {
              OR: [
                { nombre: { contains: q, mode: "insensitive" } },
                { nit: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { empresa: true, contactos: true },
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
    tipo: c.tipo,
    nombre: c.nombre,
    empresaNombre: c.empresa.nombre,
    nit: c.nit,
    direccion: c.direccion,
    contacto: c.contacto,
    telefono: c.telefono,
    email: c.email,
    codigoPais: c.codigoPais,
    activo: c.activo,
    contactos: c.contactos,
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

      <ClientesFiltros empresas={empresas} placeholder="Buscar por nombre o NIT…" />

      <ClientesTable
        data={filas}
        empresas={empresas}
        emptyMessage={q ? "Ningún cliente coincide con la búsqueda." : "Todavía no hay clientes."}
      />
    </div>
  );
}
