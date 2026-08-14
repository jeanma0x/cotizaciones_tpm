import { PlusIcon, WalletIcon } from "lucide-react";
import { CostoFormDialog } from "@/components/app/costo-form-dialog";
import { CostosFiltros } from "@/components/app/costos-filtros";
import { CostosTable, type FilaCosto } from "@/components/app/costos-table";
import { ExportarCostosDialog } from "@/components/app/exportar-costos-dialog";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function CostosPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string }>;
}) {
  const { empresaId } = await searchParams;
  const empresasPermitidas = await getEmpresasPermitidas();

  const [costos, empresas] = await Promise.all([
    db.costoOperativo.findMany({
      where: {
        empresaId:
          empresaId && empresasPermitidas.includes(empresaId)
            ? empresaId
            : { in: empresasPermitidas },
      },
      include: { empresa: true },
      orderBy: { fechaGasto: "desc" },
    }),
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const filas: FilaCosto[] = costos.map((c) => ({
    id: c.id,
    empresaId: c.empresaId,
    empresaNombre: c.empresa.nombre,
    moneda: c.empresa.moneda,
    categoria: c.categoria,
    descripcion: c.descripcion,
    monto: Number(c.monto),
    fechaGasto: c.fechaGasto.toISOString().slice(0, 10),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Costos operativos"
        icon={WalletIcon}
        actions={
          <div className="flex gap-2">
            <ExportarCostosDialog empresaId={empresaId} />
            <CostoFormDialog
              empresas={empresas}
              trigger={
                <Button>
                  <PlusIcon className="h-4 w-4" />
                  Nuevo costo
                </Button>
              }
            />
          </div>
        }
      />

      <CostosFiltros empresas={empresas} />

      <CostosTable
        data={filas}
        empresas={empresas}
        emptyMessage="Todavía no hay costos registrados."
      />
    </div>
  );
}
