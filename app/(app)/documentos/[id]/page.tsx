import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentoEstadoForm } from "@/components/app/documento-estado-form";
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
        <div className="flex flex-col gap-1">
          <Link
            href="/documentos"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Volver a documentos
          </Link>
          <div className="flex items-center gap-3">
            <span className="correlativo-tag">TPM-{documento.correlativo}</span>
            <h1 className="text-xl font-semibold text-ink">
              {TIPO_LABELS[documento.tipo]}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/documentos/${id}/editar`} />}>
            <PencilIcon className="h-4 w-4" />
            Editar
          </Button>
          <DuplicarDocumentoButton documentoId={documento.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded border border-line bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Empresa
          </p>
          <p>{documento.empresa.nombre}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Cliente
          </p>
          <p>{documento.cliente?.nombre ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Fecha
          </p>
          <p className="font-mono text-sm">
            {documento.fecha.toISOString().slice(0, 10)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Oferta válida hasta
          </p>
          <p>{documento.vigenciaDias ?? "—"} días</p>
        </div>
        {documento.condicionesPago && (
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Condiciones de pago
            </p>
            <p>{documento.condicionesPago}</p>
          </div>
        )}
        {documento.descripcionGeneral && (
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Descripción general
            </p>
            <p className="whitespace-pre-wrap">{documento.descripcionGeneral}</p>
          </div>
        )}
      </div>

      <div className="rounded border border-line bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Ítems
        </h2>
        <div className="flex flex-col gap-3">
          {documento.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[80px_1fr_120px_120px] gap-3 border-b border-line pb-2 text-sm last:border-b-0"
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
          <div className="flex w-64 justify-between border-t border-line pt-1 font-semibold">
            <span>Total</span>
            <span className="font-mono">
              {documento.empresa.moneda} {Number(documento.total).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {notas.length > 0 && (
        <div className="rounded border border-line bg-card p-4">
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

      <div className="rounded border border-line bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Estado
        </h2>
        <DocumentoEstadoForm documentoId={documento.id} estadoActual={documento.estado} />

        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
          {documento.historial.map((h) => (
            <div key={h.id} className="flex items-center gap-3 text-sm">
              <span className="font-mono text-xs text-muted-foreground">
                {h.fecha.toISOString().slice(0, 16).replace("T", " ")}
              </span>
              <span className="font-medium">{h.estado}</span>
              {h.nota && <span className="text-muted-foreground">— {h.nota}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
