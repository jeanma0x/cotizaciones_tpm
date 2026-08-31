import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConvertirAFacturaButton } from "@/components/app/convertir-a-factura-button";
import { DocumentoEstadoForm } from "@/components/app/documento-estado-form";
import { DocumentoImprimirDialog } from "@/components/app/documento-imprimir-dialog";
import { serializarDocumento } from "@/components/app/documento-imprimible";
import { DocumentoResumen } from "@/components/app/documento-resumen";
import { DuplicarDocumentoButton } from "@/components/app/duplicar-documento-button";
import { VolverLink } from "@/components/app/volver-link";
import { Button } from "@/components/ui/button";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatearMonto } from "@/lib/formato-numero";

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
      cliente: { include: { contactos: true } },
      items: { orderBy: { orden: "asc" } },
      historial: { orderBy: { fecha: "desc" } },
      firmante: true,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VolverLink href="/documentos" label="Volver a documentos" />
        <div className="flex flex-wrap gap-2">
          {/* Un documento ya facturado no se puede editar (ver
              documentos/actions.ts, actualizarDocumento) — Duplicar, más
              abajo, es la vía correcta si hace falta una versión nueva. */}
          {documento.estado !== "FACTURADA" && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/documentos/${id}/editar`} />}
            >
              <PencilIcon className="h-4 w-4" />
              Editar
            </Button>
          )}
          <DocumentoImprimirDialog documento={serializarDocumento(documento)} />
          <DuplicarDocumentoButton
            documentoId={documento.id}
            correlativo={documento.correlativo}
          />
          {documento.tipo !== "FACTURA" && documento.estado === "ACEPTADA" && (
            <ConvertirAFacturaButton
              documentoId={documento.id}
              correlativo={documento.correlativo}
            />
          )}
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
        {/* Cabecera de columnas solo de sm para arriba — en mobile cada renglón
            se apila en una sola columna con su propia etiqueta inline (ver
            abajo), así que un encabezado compartido no tendría con qué
            alinearse. */}
        <div className="hidden grid-cols-[80px_1fr_120px_120px] gap-3 px-1 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
          <span>Cantidad</span>
          <span>Descripción</span>
          <span>Precio unitario</span>
          <span>Total</span>
        </div>
        <div className="flex flex-col gap-3">
          {documento.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-1 border-b border-border pb-3 text-sm last:border-b-0 sm:grid-cols-[80px_1fr_120px_120px] sm:items-start sm:gap-3 sm:pb-2"
            >
              <span className="whitespace-pre-wrap sm:order-2">{item.descripcion}</span>
              <span className="font-mono sm:order-1">
                <span className="text-xs text-muted-foreground sm:hidden">Cantidad: </span>
                {Number(item.cantidad)}
              </span>
              <span className="font-mono sm:order-3">
                <span className="text-xs text-muted-foreground sm:hidden">
                  Precio unitario:{" "}
                </span>
                {formatearMonto(Number(item.precioUnitario))}
              </span>
              <span className="font-mono sm:order-4">
                <span className="text-xs text-muted-foreground sm:hidden">Total: </span>
                {formatearMonto(Number(item.cantidad) * Number(item.precioUnitario))}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col items-end gap-1 text-sm">
          <div className="flex w-64 justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">
              {documento.empresa.moneda} {formatearMonto(Number(documento.subtotal))}
            </span>
          </div>
          <div className="flex w-64 justify-between">
            <span className="text-muted-foreground">Descuento</span>
            <span className="font-mono">
              {documento.empresa.moneda} {formatearMonto(Number(documento.descuento))}
            </span>
          </div>
          <div className="flex w-64 justify-between border-t border-border pt-1 font-semibold">
            <span>Total</span>
            <span className="font-mono">
              {documento.empresa.moneda} {formatearMonto(Number(documento.total))}
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
