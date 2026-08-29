import { PlusIcon, UsersIcon } from "lucide-react";
import { BuscadorLista } from "@/components/app/buscador-lista";
import { ClienteFormDialog } from "@/components/app/cliente-form-dialog";
import { ClientesTable, type FilaCliente } from "@/components/app/clientes-table";
import { HistorialAuditoriaSheet, type FilaAuditoriaGenerica } from "@/components/app/historial-auditoria-sheet";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEmpresaActivaId } from "@/lib/empresa-activa";

const ACCION_CLIENTE_LABEL: Record<string, string> = { CREADO: "Creado", EDITADO: "Editado" };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [empresasPermitidas, empresaActivaId] = await Promise.all([
    getEmpresasPermitidas(),
    getEmpresaActivaId(),
  ]);
  // Fase 3.2: el selector de empresa global reemplaza el filtro local de
  // empresa que vivía acá antes (el buscador de texto ahora es BuscadorLista,
  // reusado en Servicios/Activos — ya no un ClientesFiltros duplicado).
  const empresaIds = empresaActivaId ? [empresaActivaId] : empresasPermitidas;

  const [clientes, empresas, auditoria] = await Promise.all([
    db.cliente.findMany({
      where: {
        empresaId: { in: empresaIds },
        ...(q
          ? {
              OR: [
                { nombre: { contains: q, mode: "insensitive" } },
                { nit: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        empresa: true,
        contactos: true,
        proyectos: { orderBy: { nombre: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
    db.clienteAuditoria.findMany({
      where: { empresaId: { in: empresaIds } },
      include: { usuario: true },
      orderBy: { fecha: "desc" },
      take: 100,
    }),
  ]);

  const filasAuditoria: FilaAuditoriaGenerica[] = auditoria.map((a) => ({
    id: a.id,
    variant: a.accion === "CREADO" ? "creado" : "editado",
    accionLabel: ACCION_CLIENTE_LABEL[a.accion],
    titulo: a.clienteNombre,
    detalle: a.detalle,
    usuarioNombre: a.usuario?.nombre ?? null,
    fecha: a.fecha.toISOString(),
  }));

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
    proyectos: c.proyectos,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        icon={UsersIcon}
        actions={
          <div className="flex gap-2">
            <HistorialAuditoriaSheet titulo="Historial de clientes" entradas={filasAuditoria} />
            <ClienteFormDialog
              empresas={empresas}
              empresaActivaId={empresaActivaId}
              trigger={
                <Button>
                  <PlusIcon className="h-4 w-4" />
                  Nuevo cliente
                </Button>
              }
            />
          </div>
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
