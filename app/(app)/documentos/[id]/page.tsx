import { ArrowLeftIcon, PencilIcon, PrinterIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentoEstadoForm } from "@/components/app/documento-estado-form";
import { DocumentoResumen } from "@/components/app/documento-resumen";
import { DuplicarDocumentoButton } from "@/components/app/duplicar-documento-button";
import { Button } from "@/components/ui/button";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

const TIPO_LABELS: Record<string, string> = {
  COTIZACION: "Cotización",
  PROPUESTA: "Propuesta de servicios",
  FACTURA: "Factura",
};

export default async function DocumentoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const empresasPermitidas = await getEmpresasPermitidas();

  const documento = await db.documento.findUnique({
    where: { id },
    include: {
      empresa: true,
      cliente: true,
      items: { orderBy: { orden: "asc" } },
      historial: { orderBy: { fecha: "desc" } },
    },
  });
  if (!documento || !empresasPermitidas.includes(documento.empresaId)) {
    notFound();
  }

  const notas = Array.isArray(documento.notas)
    ? (documento.notas as { titulo: string; texto: string }[])
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href="/documentos"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Volver a documentos
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/documentos/${id}/editar`} />}>
            <PencilIcon className="h-4 w-4" />
            Editar
          </Button>
          <Button variant="outline" render={<Link href={`/documentos/${id}/imprimir`} />}>
            <PrinterIcon className="h-4 w-4" />
            Ver / Imprimir
          </Button>
          <DuplicarDocumentoButton
            documentoId={documento.id}
            correlativo={documento.correlativo}
          />
        </div>
      </div>

      <div className="rounded border border-border bg-card p-4">
        <DocumentoResumen
          data={{
            correlativo: documento.correlativo,
            tipoLabel: TIPO_LABELS[documento.tipo],
            empresaNombre: documento.empresa.nombre,
            clienteNombre: documento.cliente?.nombre ?? "—",
            fecha: documento.fecha,
            vigenciaDias: documento.vigenciaDias,
            condicionesPago: documento.condicionesPago,
            descripcionGeneral: documento.descripcionGeneral,
            moneda: documento.empresa.moneda,
            total: Number(documento.total),
            estado: documento.estado,
          }}
        />
      </div>

      <div className="rounded border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Ítems
        </h2>
        <div className="flex flex-col gap-3">
          {documento.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[80px_1fr_120px_120px] gap-3 border-b border-border pb-2 text-sm last:border-b-0"
            >
              <span className="font-mono">{Number(item.cantidad)}</span>
              <span className="whitespace-pre-wrap">{item.descripcion}</span>
              <span className="font-mono">
                {Number(item.precioUnitario).toFixed(2)}
              </span>
              <span className="font-mono">
                {(Number(item.cantidad) * Number(item.precioUnitario)).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col items-end gap-1 text-sm">
          <div className="flex w-64 justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">
              {documento.empresa.moneda} {Number(documento.subtotal).toFixed(2)}
            </span>
          </div>
          <div className="flex w-64 justify-between">
            <span className="text-muted-foreground">Descuento</span>
            <span className="font-mono">
              {documento.empresa.moneda} {Number(documento.descuento).toFixed(2)}
            </span>
          </div>
          <div className="flex w-64 justify-between border-t border-border pt-1 font-semibold">
            <span>Total</span>
            <span className="font-mono">
              {documento.empresa.moneda} {Number(documento.total).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {notas.length > 0 && (
        <div className="rounded border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Notas
          </h2>
          <div className="flex flex-col gap-2">
            {notas.map((nota, i) => (
              <div key={i}>
                <p className="text-sm font-medium">{nota.titulo}</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {nota.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Estado
        </h2>
        <DocumentoEstadoForm
          documentoId={documento.id}
          estadoActual={documento.estado}
          historialInicial={documento.historial}
        />
      </div>
    </div>
  );
}
