import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { DocumentoForm } from "@/components/app/documento-form";
import { PageHeader } from "@/components/app/page-header";
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
        <Link
          href="/documentos"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Volver a documentos
        </Link>
        <PageHeader title="Nuevo documento" />
      </div>
      <DocumentoForm
        empresas={empresas}
        clientes={clientes}
        servicios={servicios.map((s) => ({ ...s, precioFijo: Number(s.precioFijo) }))}
      />
    </div>
  );
}
