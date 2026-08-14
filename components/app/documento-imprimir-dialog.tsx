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
      {/* Ancho generoso + scroll propio: un documento real crece a varias
          páginas (docs/document-export.md), el modal tiene que poder
          desplazarse internamente en vez de recortar contenido. */}
      <DialogContent
        className="max-h-[92vh] w-full max-w-4xl overflow-hidden p-0
          [&>[data-slot=dialog-close]]:z-20 [&>[data-slot=dialog-close]]:bg-surface
          [&>[data-slot=dialog-close]]:print:hidden"
      >
        <div className="max-h-[92vh] overflow-y-auto rounded-xl">
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
              clienteNombre={documento.cliente?.nombre ?? "cliente"}
              clienteTelefono={documento.cliente?.telefono ?? null}
              clienteEmail={documento.cliente?.email ?? null}
              contactos={documento.cliente?.contactos ?? []}
              dentroDeModal
            />
            <DocumentoImprimible documento={documento} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
