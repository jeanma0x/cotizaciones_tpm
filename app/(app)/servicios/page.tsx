import { PlusIcon, TruckIcon } from "lucide-react";
import { BuscadorLista } from "@/components/app/buscador-lista";
import { PageHeader } from "@/components/app/page-header";
import { ServicioFormDialog } from "@/components/app/servicio-form-dialog";
import { ServiciosTable, type FilaServicio } from "@/components/app/servicios-table";
import { Button } from "@/components/ui/button";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const empresasPermitidas = await getEmpresasPermitidas();

  const [servicios, empresas] = await Promise.all([
    db.servicio.findMany({
      where: {
        empresaId: { in: empresasPermitidas },
        ...(q ? { nombre: { contains: q, mode: "insensitive" } } : {}),
      },
      include: { empresa: true },
      orderBy: { nombre: "asc" },
    }),
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const filas: FilaServicio[] = servicios.map((s) => ({
    id: s.id,
    empresaId: s.empresaId,
    nombre: s.nombre,
    empresaNombre: s.empresa.nombre,
    moneda: s.empresa.moneda,
    precioFijo: Number(s.precioFijo),
    activo: s.activo,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Servicios"
        icon={TruckIcon}
        actions={
          <ServicioFormDialog
            empresas={empresas}
            trigger={
              <Button>
                <PlusIcon className="h-4 w-4" />
                Nuevo servicio
              </Button>
            }
          />
        }
      />

      <BuscadorLista basePath="/servicios" placeholder="Buscar por nombre…" />

      <ServiciosTable
        data={filas}
        empresas={empresas}
        emptyMessage={q ? "Ningún servicio coincide con la búsqueda." : "Todavía no hay servicios."}
      />
    </div>
  );
}
