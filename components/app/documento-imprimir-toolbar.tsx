"use client";

import { DownloadIcon, MailIcon, MessageCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VolverLink } from "@/components/app/volver-link";

function soloDigitos(valor: string | null | undefined) {
  return (valor ?? "").replace(/\D/g, "");
}

export function DocumentoImprimirToolbar({
  documentoId,
  correlativo,
  tipoLabel,
  empresaNombre,
  clienteNombre,
  clienteTelefono,
}: {
  documentoId: string;
  correlativo: number;
  tipoLabel: string;
  empresaNombre: string;
  clienteNombre: string;
  clienteTelefono: string | null;
}) {
  const asunto = encodeURIComponent(`${tipoLabel} TPM-${correlativo} (${empresaNombre})`);
  const cuerpo = encodeURIComponent(
    `Hola ${clienteNombre},\n\nAdjunto la ${tipoLabel.toLowerCase()} TPM-${correlativo}.\n\nSaludos,\n${empresaNombre}`,
  );
  const mailtoHref = `mailto:?subject=${asunto}&body=${cuerpo}`;

  const telefono = soloDigitos(clienteTelefono);
  const textoWhatsapp = encodeURIComponent(
    `Hola ${clienteNombre}, te comparto la ${tipoLabel.toLowerCase()} TPM-${correlativo}.`,
  );
  const whatsappHref = telefono
    ? `https://wa.me/${telefono}?text=${textoWhatsapp}`
    : `https://wa.me/?text=${textoWhatsapp}`;

  return (
    <div className="no-imprimir sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/95 px-6 py-3 backdrop-blur">
      <div className="flex flex-col gap-2">
        <VolverLink href={`/documentos/${documentoId}`} label="Volver al documento" />
        <p className="text-xs text-muted-foreground">
          Exportá el PDF primero y adjuntalo manualmente al correo o WhatsApp. Ninguna de
          las dos plataformas permite adjuntar archivos automáticamente desde un enlace
          externo.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* target="_blank", igual que WhatsApp abajo: sin esto, en Chrome el
            mailto: intenta navegar la MISMA pestaña mientras el sistema
            operativo decide qué hacer, y si no hay un cliente de correo
            configurado, esa pestaña se queda en about:blank — perdiendo la
            vista de impresión activa. Con target="_blank" el intento fallido
            queda aislado en una pestaña descartable, no en la que el usuario
            está usando. */}
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={mailtoHref} target="_blank" rel="noopener noreferrer" />}
        >
          <MailIcon className="h-4 w-4" />
          Correo
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={whatsappHref} target="_blank" rel="noopener noreferrer" />}
        >
          <MessageCircleIcon className="h-4 w-4" />
          WhatsApp
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <DownloadIcon className="h-4 w-4" />
          Imprimir / Exportar PDF
        </Button>
      </div>
    </div>
  );
}
