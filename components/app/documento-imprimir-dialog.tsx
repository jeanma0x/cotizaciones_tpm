"use client";

import { PrinterIcon } from "lucide-react";
import { useState } from "react";
import {
  DocumentoImprimible,
  type DocumentoImprimibleData,
} from "@/components/app/documento-imprimible";
import { DocumentoImprimirToolbar } from "@/components/app/documento-imprimir-toolbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const TIPO_LABELS: Record<string, string> = {
  COTIZACION: "Cotización",
  PROPUESTA: "Propuesta de servicios",
  FACTURA: "Factura",
};

// El cliente acá SIEMPRE trae `contactos` (a diferencia del tipo base de
// DocumentoImprimibleData, que no lo requiere porque DocumentoImprimible en
// sí no lo usa) — lo necesita la toolbar para el selector de destinatario.
type DocumentoParaModal = DocumentoImprimibleData & {
  cliente: (DocumentoImprimibleData["cliente"] & {
    contactos: { id: string; nombre: string; email: string }[];
  }) | null;
};

export function DocumentoImprimirDialog({
  documento,
}: {
  documento: DocumentoParaModal;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <PrinterIcon className="h-4 w-4" />
            Ver / Imprimir
          </Button>
        }
      />
      {/* Ancho generoso (5xl, no 4xl) + scroll propio: el documento en sí es
          max-w-3xl (ver documento-imprimible.tsx) — el modal necesita margen
          real alrededor para no sentirse apretado contra sus propios bordes,
          igual "aire" que tenía la página completa.
          print: — SIN esto, al imprimir desde el modal el documento hereda
          el ancho fijo del modal (angosto) en vez de ocupar la página
          impresa completa como la ruta /imprimir de siempre: hay que anular
          el posicionamiento/tamaño fijo del Dialog específicamente al
          imprimir, no solo ocultar lo que rodea al modal (.app-shell). */}
      <DialogContent
        className="max-h-[92vh] w-full max-w-5xl sm:max-w-5xl overflow-hidden p-0
          print:static print:block print:h-auto print:max-h-none print:w-auto
          print:max-w-none print:translate-x-0 print:translate-y-0
          print:overflow-visible print:rounded-none print:shadow-none print:ring-0
          [&>[data-slot=dialog-close]]:z-20 [&>[data-slot=dialog-close]]:bg-surface
          [&>[data-slot=dialog-close]]:print:hidden"
      >
        <div className="max-h-[92vh] overflow-y-auto rounded-xl print:max-h-none print:overflow-visible print:rounded-none">
          {/* data-theme="light" fijo, igual que la página completa
              (/documentos/[id]/imprimir): el documento siempre se ve igual
              sin importar el modo claro/oscuro activo. */}
          <div data-theme="light" className="fondo-imprimible bg-[#EAE6DC]">
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
              total={documento.total}
              vigenciaDias={documento.vigenciaDias}
              condicionesPago={documento.condicionesPago}
              fecha={documento.fecha}
              dentroDeModal
            />
            <DocumentoImprimible documento={documento} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
