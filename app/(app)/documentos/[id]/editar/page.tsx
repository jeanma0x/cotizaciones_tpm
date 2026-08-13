import { notFound } from "next/navigation";
import { DocumentoForm } from "@/components/app/documento-form";
import { VolverLink } from "@/components/app/volver-link";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function EditarDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const empresasPermitidas = await getEmpresasPermitidas();

  const documento = await db.documento.findUnique({
    where: { id },
    select: {
      id: true,
      empresaId: true,
      correlativo: true,
      tipo: true,
      clienteId: true,
      fecha: true,
      vigenciaDias: true,
      condicionesPago: true,
      descripcionGeneral: true,
      descuento: true,
      notas: true,
      anexos: true,
      items: {
        orderBy: { orden: "asc" },
        select: { cantidad: true, descripcion: true, precioUnitario: true },
      },
    },
  });
  if (!documento || !empresasPermitidas.includes(documento.empresaId)) {
    notFound();
  }

  const [empresas, clientes, servicios] = await Promise.all([
    db.empresa.findMany({
      where: { id: documento.empresaId },
    }),
    db.cliente.findMany({
      where: { empresaId: documento.empresaId },
      orderBy: { nombre: "asc" },
    }),
    db.servicio.findMany({
      where: { empresaId: documento.empresaId, activo: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <VolverLink href={`/documentos/${documento.id}`} label="Volver al documento" />
        <h1 className="text-xl font-semibold text-text-primary">
          Editar documento TPM-{documento.correlativo}
        </h1>
      </div>
      <DocumentoForm
        empresas={empresas}
        clientes={clientes}
        servicios={servicios.map((s) => ({ ...s, precioFijo: Number(s.precioFijo) }))}
        documento={{
          ...documento,
          descuento: Number(documento.descuento),
          items: documento.items.map((item) => ({
            ...item,
            cantidad: Number(item.cantidad),
            precioUnitario: Number(item.precioUnitario),
          })),
        }}
      />
    </div>
  );
}
