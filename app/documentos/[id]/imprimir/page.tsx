import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { DocumentoImprimible, serializarDocumento } from "@/components/app/documento-imprimible";
import { DocumentoImprimirToolbar } from "@/components/app/documento-imprimir-toolbar";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

const TIPO_LABELS: Record<string, string> = {
  COTIZACION: "Cotización",
  PROPUESTA: "Propuesta de servicios",
  FACTURA: "Factura",
};

export default async function ImprimirDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" });

  const { id } = await params;
  const empresasPermitidas = await getEmpresasPermitidas();

  const documento = await db.documento.findUnique({
    where: { id },
    include: {
      empresa: true,
      cliente: { include: { contactos: true } },
      items: { orderBy: { orden: "asc" } },
    },
  });
  if (!documento || !empresasPermitidas.includes(documento.empresaId)) {
    notFound();
  }

  return (
    // data-theme="light" fijo: un documento exportado (cotización/propuesta/
    // factura) tiene que verse siempre igual sin importar el modo claro/oscuro
    // que tenga activo quien lo esté viendo en la app — incluye la toolbar.
    <div data-theme="light" className="fondo-imprimible min-h-screen bg-[#EAE6DC]">
      <DocumentoImprimirToolbar
        documentoId={documento.id}
        correlativo={documento.correlativo}
        tipoLabel={TIPO_LABELS[documento.tipo]}
        empresaNombre={documento.empresa.nombre}
        empresaEmail={documento.empresa.email}
        empresaTelefono={documento.empresa.telefono}
        clienteNombre={documento.cliente?.nombre ?? "cliente"}
        clienteTelefono={documento.cliente?.telefono ?? null}
        clienteEmail={documento.cliente?.email ?? null}
        contactos={documento.cliente?.contactos ?? []}
        moneda={documento.empresa.moneda === "USD" ? "USD" : "GTQ"}
        total={Number(documento.total)}
        vigenciaDias={documento.vigenciaDias}
        condicionesPago={documento.condicionesPago}
        fecha={documento.fecha}
      />
      <DocumentoImprimible documento={serializarDocumento(documento)} />
    </div>
  );
}
