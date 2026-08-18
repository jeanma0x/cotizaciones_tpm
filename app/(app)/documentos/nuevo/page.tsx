import { FilePlusIcon } from "lucide-react";
import { DocumentoForm } from "@/components/app/documento-form";
import { PageHeader } from "@/components/app/page-header";
import { VolverLink } from "@/components/app/volver-link";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function NuevoDocumentoPage() {
  const empresasPermitidas = await getEmpresasPermitidas();

  const [empresas, clientes, servicios, usuariosConFirma] = await Promise.all([
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
    db.cliente.findMany({
      where: { empresaId: { in: empresasPermitidas }, activo: true },
      orderBy: { nombre: "asc" },
      include: { contactos: true },
    }),
    db.servicio.findMany({
      where: { empresaId: { in: empresasPermitidas }, activo: true },
      orderBy: { nombre: "asc" },
    }),
    // Solo usuarios que ya cargaron una firma — el select de "quién firma"
    // en el formulario no tiene sentido ofrecer a alguien sin firma cargada.
    db.usuario.findMany({
      where: {
        firma: { not: null },
        empresas: { some: { empresaId: { in: empresasPermitidas } } },
      },
      select: { id: true, nombre: true, empresas: { select: { empresaId: true } } },
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
        usuarios={usuariosConFirma.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          empresaIds: u.empresas.map((e) => e.empresaId),
        }))}
      />
    </div>
  );
}
