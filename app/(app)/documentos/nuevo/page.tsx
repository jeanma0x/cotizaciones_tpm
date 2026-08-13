import { FilePlusIcon } from "lucide-react";
import { DocumentoForm } from "@/components/app/documento-form";
import { PageHeader } from "@/components/app/page-header";
import { VolverLink } from "@/components/app/volver-link";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function NuevoDocumentoPage() {
  const empresasPermitidas = await getEmpresasPermitidas();

  const [empresas, clientes, servicios] = await Promise.all([
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
    db.cliente.findMany({
      where: { empresaId: { in: empresasPermitidas }, activo: true },
      orderBy: { nombre: "asc" },
    }),
    db.servicio.findMany({
      where: { empresaId: { in: empresasPermitidas }, activo: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <VolverLink href="/documentos" label="Volver a documentos" />
        <PageHeader title="Nuevo documento" icon={FilePlusIcon} />
      </div>
      <DocumentoForm
        empresas={empresas}
        clientes={clientes}
        servicios={servicios.map((s) => ({ ...s, precioFijo: Number(s.precioFijo) }))}
      />
    </div>
  );
}
